"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, Copy, Check, ClipboardList, ArrowRight, AlertCircle } from 'lucide-react';
import { useCollege, getApiUrl, College } from '@/components/CollegeProvider';
import { fetchStudentProfile, Student } from '@/lib/data';
import { parseRoster, normalizeName, ParsedEntry } from '@/lib/bulkParse';
import { formatGrade } from '@/lib/utils';

type Status = 'pending' | 'found' | 'ambiguous' | 'notfound';

interface Resolution {
    status: Status;
    matches: Student[];
    totalMatches: number;
    partial?: boolean; // matched via first-name fallback, not the full name
}

const MAX_ENTRIES = 60;
// Keeps the pasted list + results alive across navigation, so coming back
// from a student profile restores the page instead of resetting it
const STORAGE_KEY = 'rh_bulk_state';
const MAX_MATCHES_SHOWN = 8;
const CONCURRENCY = 4;

const PLACEHOLDER = `Paste anything — bullets, columns, emails all work:

* Roshan Sharma       2024UCA1908
* Prashant Tak        2024UCD2144
* Anshita
* Daksh Dham

Aaryan Aaloke
aaryan.aaloke.ug24@nsut.ac.in`;

// Runs fn over items with at most `limit` requests in flight
async function runPool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
    let i = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (i < items.length) {
            const item = items[i++];
            await fn(item);
        }
    });
    await Promise.all(workers);
}

async function resolveEntry(entry: ParsedEntry, college: College): Promise<Resolution> {
    // Roll number wins when present; if it doesn't match anyone but we also
    // have a name, fall back to searching by name
    if (entry.roll) {
        const student = await fetchStudentProfile(entry.roll, college).catch(() => null);
        if (student) return { status: 'found', matches: [student], totalMatches: 1 };
        if (!entry.name) return { status: 'notfound', matches: [], totalMatches: 0 };
    }

    const name = entry.name!;
    const tokens = name.split(/\s+/);

    // Full name (with batch hint from email if we have one), then without the
    // hint, then first name only as a last resort
    const attempts: { query: string; year?: string; partial?: boolean }[] = [];
    if (entry.batchHint) attempts.push({ query: name, year: entry.batchHint });
    attempts.push({ query: name });
    if (tokens.length > 1) attempts.push({ query: tokens[0], partial: true });

    for (const attempt of attempts) {
        try {
            const params = new URLSearchParams();
            params.append('query', attempt.query);
            if (attempt.year) params.append('year', attempt.year);

            const res = await fetch(`${getApiUrl(college)}/filter?${params.toString()}`);
            if (!res.ok) continue;
            const json = await res.json();
            const data: Student[] = json?.data ?? [];
            if (data.length === 0) continue;

            // If any results match the pasted name exactly, keep only those —
            // but keep all of them, so same-name students stay visible
            const exact = data.filter(s => normalizeName(s.name) === normalizeName(name));
            const list = exact.length > 0 ? exact : data;

            return {
                status: list.length === 1 ? 'found' : 'ambiguous',
                matches: list.slice(0, MAX_MATCHES_SHOWN),
                totalMatches: exact.length > 0 ? exact.length : (json?.pagination?.total ?? list.length),
                partial: attempt.partial && exact.length === 0,
            };
        } catch {
            // network hiccup — try the next, looser attempt
        }
    }

    return { status: 'notfound', matches: [], totalMatches: 0 };
}

function StatusBadge({ res }: { res: Resolution }) {
    if (res.status === 'pending') {
        return (
            <span className="badge badge-neutral inline-flex items-center gap-1">
                <Loader2 size={11} className="animate-spin" /> Searching
            </span>
        );
    }
    if (res.status === 'found') return <span className="badge badge-success">Found</span>;
    if (res.status === 'ambiguous') return <span className="badge badge-warning">{res.totalMatches} matches</span>;
    return <span className="badge badge-danger">Not found</span>;
}

function MatchRow({ student }: { student: Student }) {
    return (
        <Link
            href={`/student/${student.rollNo}`}
            className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 rounded-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
        >
            <div className="min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {student.name}
                </p>
                <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                    {student.rollNo} · {student.branch_code} · {student.year_of_study}
                </p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>CGPA</p>
                    <p className="font-bold font-mono text-sm" style={{ color: 'var(--accent)' }}>{formatGrade(student.cgpa, 2)}</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Rank</p>
                    <p className="font-bold font-mono text-sm" style={{ color: 'var(--text-primary)' }}>#{student.overall_rank ?? student.rank}</p>
                </div>
                <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
        </Link>
    );
}

function EntryCard({ entry, res }: { entry: ParsedEntry; res?: Resolution }) {
    if (!res) return null;
    return (
        <div className="card p-3 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-mono truncate" style={{ color: 'var(--text-muted)' }} title={entry.raw}>
                    {entry.raw}
                </p>
                <div className="shrink-0"><StatusBadge res={res} /></div>
            </div>

            {res.matches.length > 0 && (
                <div className="space-y-1.5">
                    {res.status === 'ambiguous' && (
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {res.partial
                                ? `No exact match for “${entry.name}” — showing first-name matches:`
                                : `${res.totalMatches} students match this name — pick the right one:`}
                        </p>
                    )}
                    {res.matches.map(s => <MatchRow key={s.rollNo} student={s} />)}
                    {res.totalMatches > res.matches.length && (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            + {res.totalMatches - res.matches.length} more — narrow it down on the{' '}
                            <Link href={`/result?name=${encodeURIComponent(entry.name ?? '')}`} className="underline">results page</Link>
                        </p>
                    )}
                </div>
            )}

            {res.status === 'notfound' && (
                <p className="text-xs inline-flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <AlertCircle size={13} style={{ color: 'var(--danger)' }} />
                    {entry.roll && entry.name
                        ? `No student with roll no ${entry.roll}, and no name match for “${entry.name}” either.`
                        : entry.roll
                            ? `No student with roll no ${entry.roll} — check for typos.`
                            : `Couldn't find “${entry.name}” — try their roll number.`}
                </p>
            )}
        </div>
    );
}

export function BulkLookupClient() {
    const { college } = useCollege();
    const [text, setText] = useState('');
    const [entries, setEntries] = useState<ParsedEntry[]>([]);
    const [results, setResults] = useState<Record<number, Resolution>>({});
    const [resolving, setResolving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [sortBy, setSortBy] = useState<'input' | 'rank' | 'branch'>('input');
    const [hydrated, setHydrated] = useState(false);

    // Restore a previous session (e.g. after opening a profile and coming back)
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem(STORAGE_KEY);
            if (saved) {
                const state = JSON.parse(saved);
                if (typeof state.text === 'string') setText(state.text);
                if (Array.isArray(state.entries)) setEntries(state.entries);
                if (state.results) setResults(state.results);
                if (state.sortBy === 'rank' || state.sortBy === 'branch') setSortBy(state.sortBy);
            }
        } catch {
            // corrupt or unavailable storage — start fresh
        }
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!hydrated || resolving) return;
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ text, entries, results, sortBy }));
        } catch {
            // storage full or unavailable — persistence is best-effort
        }
    }, [hydrated, resolving, text, entries, results, sortBy]);

    const preview = useMemo(() => {
        const parsed = parseRoster(text);
        return {
            total: parsed.length,
            rolls: parsed.filter(e => e.roll).length,
            names: parsed.filter(e => !e.roll).length,
        };
    }, [text]);

    const handleResolve = async () => {
        const parsed = parseRoster(text).slice(0, MAX_ENTRIES);
        if (parsed.length === 0) return;

        setEntries(parsed);
        const initial: Record<number, Resolution> = {};
        for (const e of parsed) initial[e.id] = { status: 'pending', matches: [], totalMatches: 0 };
        setResults(initial);
        setResolving(true);

        await runPool(parsed, CONCURRENCY, async (entry) => {
            const res = await resolveEntry(entry, college);
            setResults(prev => ({ ...prev, [entry.id]: res }));
        });
        setResolving(false);
    };

    const handleClear = () => {
        setText('');
        setEntries([]);
        setResults({});
    };

    const done = entries.length > 0 && entries.every(e => results[e.id]?.status !== 'pending');
    const doneCount = entries.filter(e => results[e.id] && results[e.id].status !== 'pending').length;
    const foundCount = entries.filter(e => results[e.id]?.status === 'found').length;
    const ambiguousCount = entries.filter(e => results[e.id]?.status === 'ambiguous').length;
    const notFoundCount = entries.filter(e => results[e.id]?.status === 'notfound').length;

    // Rank sort uses each entry's best-ranked match; unresolved entries go last
    const rankOf = (e: ParsedEntry) => {
        const matches = results[e.id]?.matches ?? [];
        if (matches.length === 0) return Infinity;
        return Math.min(...matches.map(s => s.overall_rank ?? s.rank ?? Infinity));
    };

    const displayEntries = useMemo(() => {
        if (sortBy !== 'rank') return entries;
        return [...entries].sort((a, b) => rankOf(a) - rankOf(b));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entries, results, sortBy]);

    // Branch view: sections keyed by the best match's branch (rank-sorted
    // inside each), with unresolved entries collected at the end
    const branchGroups = useMemo(() => {
        if (sortBy !== 'branch') return null;
        const groups = new Map<string, ParsedEntry[]>();
        for (const e of entries) {
            const best = results[e.id]?.matches?.[0];
            const key = best ? best.branch_code : 'Not found';
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(e);
        }
        return [...groups.entries()]
            .sort(([a], [b]) => (a === 'Not found' ? 1 : b === 'Not found' ? -1 : a.localeCompare(b)))
            .map(([branch, list]) => ({ branch, entries: list.sort((a, b) => rankOf(a) - rankOf(b)) }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entries, results, sortBy]);

    const resolvedRolls = entries
        .filter(e => results[e.id]?.status === 'found')
        .map(e => results[e.id].matches[0].rollNo);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(resolvedRolls.join('\n'));
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // clipboard unavailable — nothing to do
        }
    };

    return (
        <div className="space-y-6">
            {/* ── Input ── */}
            <div className="card p-4 sm:p-5 space-y-3">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={PLACEHOLDER}
                    rows={10}
                    spellCheck={false}
                    className="input w-full font-mono text-sm resize-y"
                    style={{ minHeight: '200px', lineHeight: 1.7 }}
                />
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleResolve}
                        disabled={preview.total === 0 || resolving}
                        className="btn-accent inline-flex items-center gap-2"
                        style={{ opacity: preview.total === 0 || resolving ? 0.5 : 1 }}
                    >
                        {resolving ? <Loader2 size={15} className="animate-spin" /> : <ClipboardList size={15} />}
                        {resolving ? `Resolving ${doneCount}/${entries.length}…` : 'Find everyone'}
                    </button>
                    {text && (
                        <button onClick={handleClear} className="btn-ghost" disabled={resolving}>
                            Clear
                        </button>
                    )}
                    {preview.total > 0 && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Detected <strong style={{ color: 'var(--text-secondary)' }}>{preview.total}</strong> {preview.total === 1 ? 'entry' : 'entries'}
                            {' · '}{preview.rolls} with roll no{' · '}{preview.names} by name
                            {preview.total > MAX_ENTRIES && ` (first ${MAX_ENTRIES} will be looked up)`}
                        </span>
                    )}
                </div>
            </div>

            {/* ── Summary + actions ── */}
            {entries.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="badge badge-success">{foundCount} found</span>
                    {ambiguousCount > 0 && <span className="badge badge-warning">{ambiguousCount} need a pick</span>}
                    {notFoundCount > 0 && <span className="badge badge-danger">{notFoundCount} not found</span>}
                    <div className="flex items-center gap-1.5 ml-2">
                        <span className="section-label">Sort</span>
                        <button onClick={() => setSortBy('input')} className={`pill-toggle text-xs ${sortBy === 'input' ? 'active' : ''}`}>
                            Pasted
                        </button>
                        <button onClick={() => setSortBy('rank')} className={`pill-toggle text-xs ${sortBy === 'rank' ? 'active' : ''}`}>
                            Rank
                        </button>
                        <button onClick={() => setSortBy('branch')} className={`pill-toggle text-xs ${sortBy === 'branch' ? 'active' : ''}`}>
                            Branch
                        </button>
                    </div>
                    <div className="flex-1" />
                    {done && resolvedRolls.length > 0 && (
                        <button onClick={handleCopy} className="btn-ghost inline-flex items-center gap-1.5 text-xs">
                            {copied ? <Check size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
                            {copied ? 'Copied!' : `Copy ${resolvedRolls.length} roll no${resolvedRolls.length === 1 ? '' : 's'}`}
                        </button>
                    )}
                    {done && resolvedRolls.length >= 2 && resolvedRolls.length <= 10 && (
                        <Link href={`/compare?rolls=${resolvedRolls.join(',')}`} className="btn-ghost inline-flex items-center gap-1.5 text-xs">
                            Compare all <ArrowRight size={13} />
                        </Link>
                    )}
                </div>
            )}

            {/* ── Per-entry results ── */}
            {entries.length > 0 && (branchGroups ? (
                <div className="space-y-6">
                    {branchGroups.map(group => (
                        <div key={group.branch} className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="section-label">{group.branch}</span>
                                <span className="badge badge-neutral">{group.entries.length}</span>
                            </div>
                            {group.entries.map(entry => (
                                <EntryCard key={entry.id} entry={entry} res={results[entry.id]} />
                            ))}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {displayEntries.map(entry => (
                        <EntryCard key={entry.id} entry={entry} res={results[entry.id]} />
                    ))}
                </div>
            ))}
        </div>
    );
}
