"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useCollege, getApiUrl } from '@/components/CollegeProvider';
import { formatGrade } from '@/lib/utils';

interface Student {
    rollNo: string;
    name: string;
    branch_code: string;
    cgpa: number;
    rank: number;
    credits_completed: number;
    percentile: number;
    year_of_study: string;
    branch_rank: number;
    overall_rank?: number;
    filtered_rank?: number;
    semesters?: { semester: number | string; sgpa: number }[];
}

interface StudentListProps {
    initialStudents: Student[];
    initialTotal: number;
    initialTotalPages: number;
    batch: string;
    branch: string;
    name: string;
    searchOverride?: { students: any[]; total: number; totalPages: number } | null;
}

function cgpaColor(cgpa: number): string {
    if (cgpa >= 8) return 'var(--success)';
    if (cgpa >= 6) return 'var(--warning)';
    return 'var(--danger)';
}

function PercentileBadge({ value }: { value: number }) {
    const cls =
        value >= 90 ? 'badge-success' :
            value >= 70 ? 'badge-warning' :
                'badge-neutral';
    return <span className={`badge ${cls}`}>{value.toFixed(1)}%</span>;
}

function CgpaBar({ value }: { value: number }) {
    const pct = Math.min((value / 10) * 100, 100);
    const color = cgpaColor(value);
    return (
        <div className="flex items-center gap-2">
            <span className="font-bold text-sm min-w-[3rem]" style={{ color }}>{formatGrade(value, 2)}</span>
            <div className="w-16 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
        </div>
    );
}

function RankCell({ rank }: { rank: number }) {
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
    return (
        <div className="flex items-center gap-1.5">
            {medal && <span className="text-base leading-none">{medal}</span>}
            <span className="mono" style={{ color: medal ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                #{rank}
            </span>
        </div>
    );
}

function SemChips({ student }: { student: Student }) {
    if (!student.semesters?.length) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
    const sorted = [...student.semesters].sort((a, b) => Number(a.semester) - Number(b.semester));
    return (
        <div className="flex flex-wrap gap-1">
            {sorted.map(s => (
                <span
                    key={s.semester}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                        backgroundColor: 'var(--background)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                    }}
                >
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.625rem' }}>S{s.semester}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{s.sgpa > 0 ? formatGrade(s.sgpa, 2) : '—'}</span>
                </span>
            ))}
        </div>
    );
}

function MobileStudentCard({ student, displayRank }: { student: Student; displayRank: number }) {
    const sorted = student.semesters
        ? [...student.semesters].sort((a, b) => Number(a.semester) - Number(b.semester))
        : [];
    return (
        <Link
            href={`/student/${student.rollNo}`}
            className="block card p-4 active:scale-[0.99] transition-transform"
        >
            <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {student.name}
                    </p>
                    <p className="mono text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {student.rollNo}
                    </p>
                </div>
                <div className="text-right shrink-0">
                    <span className="font-black text-lg" style={{ color: cgpaColor(student.cgpa) }}>
                        {formatGrade(student.cgpa, 2)}
                    </span>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>CGPA</p>
                </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <span className="badge badge-neutral">{student.branch_code}</span>
                <span className="badge badge-neutral">{student.year_of_study}</span>
                <RankCell rank={displayRank} />
                <PercentileBadge value={student.percentile} />
            </div>
            {sorted.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                    {sorted.map(s => (
                        <span
                            key={s.semester}
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                                backgroundColor: 'var(--background)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-secondary)',
                            }}
                        >
                            S{s.semester}: {s.sgpa > 0 ? formatGrade(s.sgpa, 2) : '—'}
                        </span>
                    ))}
                </div>
            )}
        </Link>
    );
}

export default function StudentList({
    initialStudents,
    initialTotal,
    initialTotalPages,
    batch,
    branch,
    name,
    searchOverride,
}: StudentListProps) {
    const { college } = useCollege();
    const [students, setStudents] = useState<Student[]>(initialStudents);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialTotalPages > 1);
    const [total, setTotal] = useState(initialTotal);
    const loaderRef = useRef<HTMLDivElement>(null);

    // When searchOverride changes, use those results instead
    const isSearchActive = searchOverride !== undefined && searchOverride !== null;
    const displayStudents = isSearchActive ? searchOverride.students : students;
    const displayTotal = isSearchActive ? searchOverride.total : total;
    const displayHasMore = isSearchActive ? false : hasMore;

    // Reset when filters change
    useEffect(() => {
        setStudents(initialStudents);
        setPage(1);
        setHasMore(initialTotalPages > 1);
        setTotal(initialTotal);
    }, [initialStudents, initialTotalPages, initialTotal, batch, branch, name]);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        const nextPage = page + 1;

        try {
            const params = new URLSearchParams();
            params.append('page', nextPage.toString());
            if (batch && batch !== 'All') params.append('year', batch);
            if (branch && branch !== 'All') params.append('branch', branch);
            if (name) params.append('name', name);

            const endpoint = (batch === 'All' && branch === 'All' && !name) ? '/students' : '/filter';
            const res = await fetch(`${getApiUrl(college)}${endpoint}?${params.toString()}`);

            if (!res.ok) throw new Error('Failed to fetch');

            const json = await res.json();
            if (json.success && json.data.length > 0) {
                setStudents(prev => [...prev, ...json.data]);
                setPage(nextPage);
                setHasMore(nextPage < json.pagination.totalPages);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Failed to load more students:', error);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, page, batch, branch, name, college]);

    // Intersection observer for infinite scroll
    useEffect(() => {
        if (isSearchActive) return; // Disable infinite scroll during search

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    loadMore();
                }
            },
            { threshold: 0.1, rootMargin: '800px' }
        );

        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loading, loadMore, isSearchActive]);

    const pageSize = 20;
    const showing = displayStudents.length;

    return (
        <div className="card overflow-hidden">
            {/* Table header bar */}
            <div
                className="px-5 py-3 flex items-center justify-between border-b"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
            >
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Student Leaderboard
                </p>
                {displayTotal > 0 && (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Showing {showing} of {displayTotal.toLocaleString()}
                    </p>
                )}
            </div>

            {/* ── Desktop table ── */}
            <div className="hidden md:block overflow-x-auto">
                {displayStudents.length > 0 ? (
                    <table className="w-full data-table table-fixed">
                        <thead>
                            <tr>
                                <th className="text-left w-[5%]">Rank</th>
                                <th className="text-left w-[16%]">Name</th>
                                <th className="text-left w-[12%]">Roll No</th>
                                <th className="text-left w-[9%]">Branch</th>
                                <th className="text-left w-[5%]">Year</th>
                                <th className="text-left w-[13%]">CGPA</th>
                                <th className="text-right w-[10%]">Percentile</th>
                                <th className="text-right w-[7%]">Credits</th>
                                <th className="text-left w-[21%]">Semesters</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayStudents.map(s => {
                                const rank = s.filtered_rank || s.overall_rank || s.rank;
                                return (
                                    <tr key={s.rollNo} className="group">
                                        <td><RankCell rank={rank} /></td>
                                        <td className="truncate">
                                            <Link
                                                href={`/student/${s.rollNo}`}
                                                className="font-medium hover:underline"
                                                style={{ color: 'var(--text-primary)', textDecorationColor: 'var(--accent)' }}
                                            >
                                                {s.name}
                                            </Link>
                                        </td>
                                        <td>
                                            <span className="mono" style={{ color: 'var(--text-secondary)' }}>
                                                {s.rollNo}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge badge-neutral whitespace-nowrap">{s.branch_code}</span>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{s.year_of_study}</td>
                                        <td><CgpaBar value={s.cgpa} /></td>
                                        <td className="text-right"><PercentileBadge value={s.percentile} /></td>
                                        <td className="text-right">
                                            <span className="text-sm font-medium mono" style={{ color: 'var(--text-secondary)' }}>
                                                {s.credits_completed}
                                            </span>
                                        </td>
                                        <td><SemChips student={s} /></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="py-20 text-center">
                        <div className="text-4xl mb-3">🔍</div>
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No students found</p>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                            Try clearing your filters or searching by a different name/roll number.
                        </p>
                    </div>
                )}
            </div>

            {/* ── Mobile card list ── */}
            <div className="md:hidden divide-y" style={{ borderColor: 'var(--border)' }}>
                {displayStudents.length > 0 ? (
                    displayStudents.map(s => (
                        <div key={s.rollNo} className="p-3">
                            <MobileStudentCard
                                student={s}
                                displayRank={s.filtered_rank || s.overall_rank || s.rank}
                            />
                        </div>
                    ))
                ) : (
                    <div className="py-16 text-center">
                        <div className="text-3xl mb-2">🔍</div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                            No students found
                        </p>
                    </div>
                )}
            </div>

            {/* ── Loading indicator / Scroll trigger ── */}
            <div ref={loaderRef} className="py-4">
                {loading && (
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading more...</span>
                    </div>
                )}
                {!displayHasMore && displayStudents.length > 0 && (
                    <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                        You've reached the end
                    </p>
                )}
            </div>
        </div>
    );
}
