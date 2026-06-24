"use client";

import { useState, useMemo, useCallback } from 'react';
import { SubjectDifficulty, fetchSubjectsDifficulty } from '@/lib/data';
import { Search, Loader2, AlertTriangle } from 'lucide-react';
import { RollNoPrompt } from '@/components/RollNoPrompt';
import { formatGrade } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { useCollege } from '@/components/CollegeProvider';

type Difficulty = 'All' | 'Easy' | 'Medium' | 'Hard';
type SortOption = 'students' | 'killer' | 'high_fail' | 'subject_code' | 'avg_marks';

const GRADE_ORDER = ['O', 'A+', 'A', 'B+', 'B', 'C', 'D', 'F', 'FD'];
const GRADE_COLORS: Record<string, string> = {
    O: '#2D6A4F', 'A+': '#059669', A: '#3B82F6',
    'B+': '#14B8A6', B: '#F59E0B', C: '#F97316',
    D: '#EA580C', F: '#EF4444', FD: '#DC2626',
};

const DIFFICULTY_STYLES: Record<string, { bg: string; text: string }> = {
    Easy: { bg: '#ECFDF5', text: '#2D6A4F' },
    Medium: { bg: '#FFFBEB', text: '#B45309' },
    Hard: { bg: '#FEF2F2', text: '#DC2626' },
};

function MiniGradeBar({ dist }: { dist: SubjectDifficulty['grade_distribution'] }) {
    const total = Object.values(dist).reduce((s: number, v) => s + (v ?? 0), 0);
    if (!total) return null;
    const segs = GRADE_ORDER
        .filter(g => (dist[g] ?? 0) > 0)
        .map(g => ({
            grade: g,
            pct: ((dist[g] ?? 0) / total) * 100,
            color: GRADE_COLORS[g] || '#9B9B9B',
            count: dist[g] ?? 0,
        }));
    return (
        <div>
            <div className="h-2 rounded-full overflow-hidden flex gap-px">
                {segs.map(s => (
                    <div key={s.grade} title={`${s.grade}: ${s.count}`} style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
                ))}
            </div>
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1.5">
                {segs.map(s => (
                    <span key={s.grade} className="text-xs flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{s.grade}</span>
                        <span style={{ color: 'var(--text-muted)' }}>({s.count})</span>
                    </span>
                ))}
            </div>
        </div>
    );
}

function SubjectCard({ subject }: { subject: SubjectDifficulty }) {
    const diff = DIFFICULTY_STYLES[subject.difficulty] || DIFFICULTY_STYLES.Medium;
    const totalGrades = Object.values(subject.grade_distribution).reduce((s: number, v) => s + (v ?? 0), 0);

    return (
        <div className="card-hover p-5 flex flex-col gap-4">
            {/* Top row */}
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="mono font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {subject.subject_code}
                        {subject.is_killer && <span className="ml-1.5">🔥</span>}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {subject.total_students.toLocaleString()} students
                    </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    {subject.is_killer && (
                        <span className="badge" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>Killer</span>
                    )}
                    <span className="badge" style={{ backgroundColor: diff.bg, color: diff.text }}>
                        {subject.difficulty}
                    </span>
                </div>
            </div>

            {/* Avg GPA */}
            <div>
                <p className="font-black text-3xl leading-none" style={{ color: 'var(--text-primary)' }}>
                    {formatGrade(subject.avg_marks, 2)}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>avg GPA</p>
            </div>

            {/* Low grade warning */}
            {subject.low_grade_percentage > 20 && (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--danger)' }}>
                    <AlertTriangle size={12} />
                    <span>⚠ {subject.low_grade_percentage.toFixed(1)}% low grades</span>
                </div>
            )}

            {/* Grade distribution bar */}
            <MiniGradeBar dist={subject.grade_distribution} />
        </div>
    );
}

export function SubjectsClient() {
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('students');
    const [difficultyFilter, setDifficultyFilter] = useState<Difficulty>('All');
    const [killerOnly, setKillerOnly] = useState(false);

    const [subjects, setSubjects] = useState<SubjectDifficulty[]>([]);
    const [rollNo, setRollNo] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { college } = useCollege();

    const loadSubjects = useCallback(async (roll: string) => {
        const cleaned = roll.trim().toUpperCase();
        setRollNo(cleaned);
        setLoading(true);
        setError(null);
        try {
            const data = await fetchSubjectsDifficulty({ rollNo: cleaned }, college);
            if (data && data.length > 0) {
                setSubjects(data);
            } else {
                setError('Roll number not found or no subjects available.');
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [college]);
    const filtered = useMemo(() => {
        let items = [...subjects];
        if (search) {
            const q = search.toLowerCase();
            items = items.filter(s => s.subject_code.toLowerCase().includes(q));
        }
        if (difficultyFilter !== 'All') items = items.filter(s => s.difficulty === difficultyFilter);
        if (killerOnly) items = items.filter(s => s.is_killer);
        items.sort((a, b) => {
            if (sortBy === 'students') return b.total_students - a.total_students;
            if (sortBy === 'killer') return (b.is_killer ? 1 : 0) - (a.is_killer ? 1 : 0) || b.low_grade_percentage - a.low_grade_percentage;
            if (sortBy === 'high_fail') return b.low_grade_percentage - a.low_grade_percentage;
            if (sortBy === 'avg_marks') return b.avg_marks - a.avg_marks;
            return a.subject_code.localeCompare(b.subject_code);
        });
        return items;
    }, [subjects, search, difficultyFilter, killerOnly, sortBy]);

    const hardCount = useMemo(() => subjects.filter(s => s.difficulty === 'Hard').length, [subjects]);
    const killerCount = useMemo(() => subjects.filter(s => s.is_killer).length, [subjects]);
    const hardest = useMemo(() => [...subjects].sort((a, b) => b.low_grade_percentage - a.low_grade_percentage)[0] ?? null, [subjects]);

    // Gate: ask for roll number first
    if (!rollNo && !loading && subjects.length === 0) {
        return (
            <RollNoPrompt
                title="Subject Difficulty Map"
                description="Enter your roll number to see grade distributions and difficulty ratings for every subject in your branch."
                buttonLabel="Load"
                onSubmit={loadSubjects}
            />
        );
    }

    // Loading state
    if (loading) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-20 text-center">
                <Loader2 size={28} className="animate-spin mx-auto mb-4" style={{ color: 'var(--accent)' }} />
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Loading subjects…</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Fetching difficulty data for {rollNo}</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-20 text-center">
                <AlertTriangle size={24} className="mx-auto mb-3" style={{ color: 'var(--danger)' }} />
                <p className="font-semibold" style={{ color: 'var(--danger)' }}>{error}</p>
                <div className="flex items-center justify-center gap-3 mt-4">
                    <button onClick={() => loadSubjects(rollNo!)} className="btn-accent text-sm">
                        Try Again
                    </button>
                    <button
                        onClick={() => { setRollNo(null); setError(null); }}
                        className="btn-ghost text-sm"
                    >
                        Change Roll No
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            {/* Back link */}
            <button
                onClick={() => { setRollNo(null); setSubjects([]); }}
                className="inline-flex items-center gap-1.5 text-sm group"
                style={{ color: 'var(--text-secondary)' }}
            >
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                Change Roll No
            </button>

            {/* Page heading */}
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    Subject Difficulty Map
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Showing {subjects.length} subjects for <span className="mono font-semibold" style={{ color: 'var(--accent)' }}>{rollNo}</span>
                </p>
            </div>

            {subjects.length > 0 && (
                <>
                    {/* Summary bar */}
                    <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span><strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> subjects shown</span>
                        {hardest && (
                            <span>Hardest: <span className="mono font-medium" style={{ color: 'var(--danger)' }}>{hardest.subject_code}</span></span>
                        )}
                        <span>Hard subjects: <strong>{hardCount}</strong></span>
                        <span>🔥 Killer: <strong>{killerCount}</strong></span>
                    </div>

                    {/* Filter bar */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px] max-w-xs">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search subject code…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="input"
                                style={{ paddingLeft: '2.25rem' }}
                            />
                        </div>

                        {/* Difficulty toggles */}
                        <div className="flex items-center gap-1">
                            {(['All', 'Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDifficultyFilter(d)}
                                    className={`pill-toggle text-xs ${difficultyFilter === d ? 'active' : ''}`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>

                        {/* Killer toggle */}
                        <button
                            onClick={() => setKillerOnly(!killerOnly)}
                            className={`pill-toggle text-xs ${killerOnly ? 'active' : ''}`}
                        >
                            🔥 Killer only
                        </button>

                        {/* Sort */}
                        <div className="flex items-center gap-1 ml-auto">
                            <span className="section-label">Sort</span>
                            {([
                                { value: 'students', label: 'Most students' },
                                { value: 'killer', label: 'Killer first' },
                                { value: 'high_fail', label: 'High fail %' },
                                { value: 'avg_marks', label: 'Avg GPA' },
                                { value: 'subject_code', label: 'Code A→Z' },
                            ] as { value: SortOption; label: string }[]).map(o => (
                                <button
                                    key={o.value}
                                    onClick={() => setSortBy(o.value)}
                                    className={`pill-toggle text-xs ${sortBy === o.value ? 'active' : ''}`}
                                >
                                    {o.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Card grid */}
                    {filtered.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map(s => <SubjectCard key={s.subject_code} subject={s} />)}
                        </div>
                    ) : (
                        <div className="py-16 text-center card">
                            <p className="text-2xl mb-2">🔍</p>
                            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No subjects match your filters</p>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Try clearing the search or removing filters.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
