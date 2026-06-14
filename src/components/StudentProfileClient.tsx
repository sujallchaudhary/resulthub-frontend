"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Info, Sparkles, BarChart3, BookOpen, Users, Gift } from 'lucide-react';
import { SgpaChart } from '@/components/Charts';
import { RollNoSaver } from '@/components/RollNoSaver';
import { SubjectDropSimulator } from '@/components/SubjectDropSimulator';
import { useCollege } from '@/components/CollegeProvider';
import { predictCredits, computeBestDrop, GRADE_POINTS, SubjectWithCredits } from '@/components/SubjectDropSimulator';
import { fetchStudentProfile, Student, Score } from '@/lib/data';

// ── Grade colour mapping ──────────────────────────────────
const GRADE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    'O': { bg: '#ECFDF5', text: '#2D6A4F', dot: '#2D6A4F' },
    'A+': { bg: '#ECFDF5', text: '#2D6A4F', dot: '#059669' },
    'A': { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
    'B+': { bg: '#F0FFFE', text: '#0F766E', dot: '#14B8A6' },
    'B': { bg: '#FFFBEB', text: '#B45309', dot: '#F59E0B' },
    'C': { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
    'D': { bg: '#FFF7ED', text: '#C2410C', dot: '#EA580C' },
    'P': { bg: '#F0FFF4', text: '#166534', dot: '#16A34A' },
    'F': { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' },
    'FD': { bg: '#FEF2F2', text: '#DC2626', dot: '#DC2626' },
};
const DEFAULT_GRADE = { bg: '#F3F3F0', text: '#6B6B6B', dot: '#9B9B9B' };

function gradeStyle(g: string) {
    return GRADE_COLORS[g?.toUpperCase?.()] || DEFAULT_GRADE;
}

function GradeDot({ grade }: { grade: string }) {
    const s = gradeStyle(grade);
    return (
        <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold"
            style={{ backgroundColor: s.bg, color: s.text }}
        >
            {grade}
        </span>
    );
}

// ── Grade bar segment colours ─────────────────────────────
const GRADE_BAR_COLORS: Record<string, string> = {
    'O': '#2D6A4F', 'A+': '#059669', 'A': '#3B82F6',
    'B+': '#14B8A6', 'B': '#F59E0B', 'C': '#F97316',
    'D': '#EA580C', 'F': '#EF4444', 'FD': '#DC2626',
};

function GradeDistBar({ dist }: { dist: Record<string, number> }) {
    const ORDER = ['O', 'A+', 'A', 'B+', 'B', 'C', 'D', 'F', 'FD'];
    const total = Object.values(dist).reduce((s, v) => s + v, 0);
    if (!total) return null;
    const segments = ORDER.filter(g => (dist[g] ?? 0) > 0).map(g => ({
        grade: g,
        count: dist[g] ?? 0,
        pct: ((dist[g] ?? 0) / total) * 100,
        color: GRADE_BAR_COLORS[g] || '#9B9B9B',
    }));
    return (
        <div>
            <div className="h-3 rounded-full overflow-hidden flex gap-0.5">
                {segments.map(s => (
                    <div
                        key={s.grade}
                        title={`${s.grade}: ${s.count}`}
                        style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                    />
                ))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {segments.map(s => (
                    <div key={s.grade} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {s.grade} <span style={{ color: 'var(--text-muted)' }}>({s.count})</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Grade Summary horizontal bars ────────────────────────
function GradeSummaryBars({ dist }: { dist: Record<string, number> }) {
    const ORDER = ['O', 'A+', 'A', 'B+', 'B', 'C', 'D', 'F', 'FD'];
    const maxCount = Math.max(...Object.values(dist), 1);
    const segments = ORDER.filter(g => (dist[g] ?? 0) > 0).map(g => ({
        grade: g,
        count: dist[g] ?? 0,
        color: GRADE_BAR_COLORS[g] || '#9B9B9B',
    }));

    return (
        <div className="space-y-2.5">
            {segments.map(s => (
                <div key={s.grade} className="flex items-center gap-2">
                    <span className="text-xs font-bold w-6" style={{ color: 'var(--text-primary)' }}>
                        {s.grade}
                    </span>
                    <span className="text-[10px] w-5" style={{ color: 'var(--text-muted)' }}>
                        ({s.count})
                    </span>
                    <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
                        <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${(s.count / maxCount) * 100}%`, backgroundColor: s.color }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Inline stat item ─────────────────────────────────────
function StatItem({ label, value, sub, color }: {
    label: string; value: string; sub?: string; color?: string;
}) {
    return (
        <div className="min-w-0 px-3 py-2.5">
            <p className="section-label mb-1" style={{ fontSize: '10px' }}>{label}</p>
            <p className="font-black text-lg leading-tight" style={{ color: color || 'var(--text-primary)' }}>
                {value}
            </p>
            {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
        </div>
    );
}

// ── Semester Section ──────────────────────────────────────
function SemesterSection({ semesters, scores }: {
    semesters: NonNullable<Student['semesters']>;
    scores: { subject_code: string; grade: string; marks: number | string; semester?: number | string }[];
}) {
    if (!semesters?.length) return null;
    const sorted = [...semesters].sort((a, b) => Number(a.semester) - Number(b.semester));
    const gridClass = sorted.length === 1
        ? ''
        : sorted.length === 2
            ? 'grid grid-cols-1 md:grid-cols-2 gap-3'
            : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3';

    return (
        <div className={gridClass}>
            {sorted.map((sem) => {
                const semScores = scores.filter(s => Number(s.semester) === Number(sem.semester));
                const bestGrade = semScores.reduce<typeof semScores[0] | null>((best, s) => {
                    const order = ['O', 'A+', 'A', 'B+', 'B', 'C', 'D', 'P', 'F', 'FD'];
                    const bi = best ? order.indexOf(best.grade.toUpperCase()) : 99;
                    const ci = order.indexOf(s.grade.toUpperCase());
                    return ci < bi ? s : best;
                }, null);

                return (
                    <div key={sem.semester} className="card overflow-hidden">
                        <div
                            className="px-3 py-1.5 flex items-center justify-between border-b"
                            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
                        >
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                                    Semester {sem.semester}
                                </span>
                                <span
                                    className="text-[10px] px-1.5 py-0.5 rounded border"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                                >
                                    {sem.credits_secured}/{sem.credits_registered} cr
                                </span>
                            </div>
                            <span
                                className="font-black text-sm"
                                style={{ color: sem.sgpa >= 8 ? 'var(--success)' : sem.sgpa >= 6 ? 'var(--warning)' : 'var(--danger)' }}
                            >
                                {sem.sgpa > 0 ? sem.sgpa.toFixed(2) : '—'}
                            </span>
                        </div>
                        {semScores.length > 0 && (
                            <table className="w-full data-table data-table-compact">
                                <thead>
                                    <tr>
                                        <th className="text-left">Subject</th>
                                        <th className="text-center w-16">Grade</th>
                                        <th className="text-right w-14">GPA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {semScores.map((score, si) => {
                                        const isBest = score === bestGrade;
                                        return (
                                            <tr
                                                key={si}
                                                style={isBest ? { borderLeft: '3px solid var(--success)' } : {}}
                                            >
                                                <td>
                                                    <span className="mono" style={{ color: 'var(--text-primary)' }}>
                                                        {score.subject_code}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <GradeDot grade={score.grade} />
                                                </td>
                                                <td className="text-right">
                                                    <span className="mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                        {score.marks !== null && score.marks !== undefined && score.marks !== ''
                                                            ? score.marks
                                                            : '—'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

const medalBorderColors = ["#F59E0B", "#9B9B9B", "#B08D57"];

// ── Main client component ─────────────────────────────────
export default function StudentProfileClient({ rollNo }: { rollNo: string }) {
    const { college } = useCollege();
    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetchStudentProfile(rollNo, college)
            .then(setStudent)
            .catch(() => setStudent(null))
            .finally(() => setLoading(false));
    }, [rollNo, college]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 w-32 rounded" style={{ backgroundColor: 'var(--surface-elevated)' }} />
                    <div className="card px-5 py-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl" style={{ backgroundColor: 'var(--surface-elevated)' }} />
                            <div className="space-y-2 flex-1">
                                <div className="h-5 w-48 rounded" style={{ backgroundColor: 'var(--surface-elevated)' }} />
                                <div className="h-3 w-32 rounded" style={{ backgroundColor: 'var(--surface-elevated)' }} />
                            </div>
                        </div>
                    </div>
                    <div className="card h-24" style={{ backgroundColor: 'var(--surface-elevated)' }} />
                    <div className="card h-64" style={{ backgroundColor: 'var(--surface-elevated)' }} />
                </div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-center">
                <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Student not found</p>
                <Link href="/" className="text-sm mt-2 inline-block" style={{ color: 'var(--accent)' }}>
                    Back to home
                </Link>
            </div>
        );
    }

    const sgpaList = student.semesters || [];
    const sorted = [...sgpaList].sort((a, b) => Number(a.semester) - Number(b.semester));
    const scores = sgpaList.flatMap(sem =>
        sem.subjects?.map(sub => ({ ...sub, semester: sem.semester })) || []
    );

    const gradeDist: Record<string, number> = {};
    scores.forEach(s => {
        if (s.grade) gradeDist[s.grade.toUpperCase()] = (gradeDist[s.grade.toUpperCase()] || 0) + 1;
    });

    const sgpas = sorted.filter(s => s.sgpa > 0).map(s => s.sgpa);
    const lastTwo = sgpas.slice(-2);
    const trend = lastTwo.length === 2
        ? lastTwo[1] > lastTwo[0] ? 'up' : lastTwo[1] < lastTwo[0] ? 'down' : 'stable'
        : 'stable';

    const hasTrend = sorted.length > 1;
    const hasGrades = Object.keys(gradeDist).length > 0;
    const semCount = sorted.length;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

            <RollNoSaver rollNo={student.rollNo} />

            <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm mb-4 group"
                style={{ color: 'var(--text-secondary)' }}
            >
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                Back to results
            </Link>

            {/* Identity row */}
            <div className="card px-5 py-4 mb-3">
                <div className="flex items-center gap-4">
                    <img
                        src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(student.name)}`}
                        alt={student.name}
                        className="w-12 h-12 rounded-xl shrink-0"
                    />
                    <div className="min-w-0">
                        <h1 className="font-black text-xl leading-tight" style={{ color: 'var(--text-primary)' }}>
                            {student.name}
                        </h1>
                        <p className="mono text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {student.rollNo}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 ml-auto">
                        <span className="badge badge-accent">{student.branch_code}</span>
                        <span className="badge badge-neutral">{student.year_of_study}</span>
                    </div>
                </div>
            </div>

            {/* Stats bar + Grade Distribution */}
            <div className="card mb-3 overflow-hidden">
                {(() => {
                    const allSubjects: SubjectWithCredits[] = sgpaList.flatMap(sem =>
                        (sem.subjects || []).map(sub => ({
                            subject_code: sub.subject_code,
                            grade: sub.grade,
                            marks: sub.marks,
                            semester: sem.semester,
                            credits: predictCredits(sub.subject_code),
                        }))
                    );
                    const bestDrop = computeBestDrop(allSubjects, student.cgpa);
                    const hasDrop = bestDrop && bestDrop.cgpaDelta > 0.001;
                    const colCount = hasDrop ? 'grid-cols-3 lg:grid-cols-6' : 'grid-cols-3 lg:grid-cols-5';
                    return (
                        <div className={`grid ${colCount} stat-grid`}>
                            <StatItem
                                label="CGPA"
                                value={student.cgpa.toFixed(2)}
                                color={student.cgpa >= 8 ? 'var(--success)' : student.cgpa >= 6 ? 'var(--warning)' : 'var(--danger)'}
                            />
                            {hasDrop && bestDrop && (
                                <div
                                    className="min-w-0 px-3 py-2.5 cursor-pointer transition-colors"
                                    style={{ borderLeft: '1px solid var(--border)', backgroundColor: 'var(--success-bg)' }}
                                    onClick={() => {
                                        const el = document.getElementById('subject-drop-simulator');
                                        if (el) {
                                            el.setAttribute('open', '');
                                            setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                                        }
                                    }}
                                    title="Click to open Subject Drop Simulator"
                                >
                                    <p className="section-label mb-1" style={{ fontSize: '10px', color: 'var(--success)' }}>AFTER DROP ↓</p>
                                    <p className="font-black text-lg leading-tight" style={{ color: 'var(--success)' }}>
                                        {bestDrop.newCGPA.toFixed(2)}
                                    </p>
                                    <p className="text-[10px] mt-0.5 font-mono truncate" style={{ color: 'var(--text-secondary)' }}
                                        title={`Drop ${bestDrop.subject_code} (Sem ${bestDrop.semester} · ${bestDrop.credits}cr · Grade ${bestDrop.grade})`}>
                                        drop {bestDrop.subject_code}
                                    </p>
                                </div>
                            )}
                            <StatItem
                                label="RANK"
                                value={`#${student.rank}`}
                                sub={`of ${(student as any).total_students ? (student as any).total_students.toLocaleString() : 'all students'}`}
                            />
                            <StatItem
                                label="BRANCH RANK"
                                value={`#${student.branch_rank}`}
                                sub={`in ${student.branch_code}`}
                            />
                            <StatItem
                                label="CREDITS"
                                value={`${student.credits_completed}`}
                                sub="completed"
                            />
                            <StatItem
                                label="SUBJECTS"
                                value={`${scores.length}`}
                                sub="total"
                            />
                        </div>
                    );
                })()}
                {Object.keys(gradeDist).length > 0 && (
                    <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
                        <p className="section-label mb-2">GRADE DISTRIBUTION</p>
                        <GradeDistBar dist={gradeDist} />
                    </div>
                )}
            </div>




            {/* ── Analytics Section (adaptive layout) ── */}
            {hasTrend ? (
                <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 mb-4">
                    <div className="card p-4">
                        <div className="flex items-center justify-between mb-3">
                            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                                Semester SGPA Trend
                            </p>
                            <span
                                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                                style={
                                    trend === 'up'
                                        ? { backgroundColor: 'var(--success-bg)', color: 'var(--success)' }
                                        : trend === 'down'
                                            ? { backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }
                                            : { backgroundColor: 'var(--surface-elevated)', color: 'var(--text-muted)' }
                                }
                            >
                                {trend === 'up' ? <TrendingUp size={12} /> : trend === 'down' ? <TrendingDown size={12} /> : <Minus size={12} />}
                                {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
                            </span>
                        </div>
                        <SgpaChart data={sgpaList} />
                    </div>

                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <Link href={`/twin/${student.rollNo}`} className="card p-4 block card-hover">
                                <div className="text-center py-2">
                                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Academic Twins</p>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                        Find students like you
                                    </p>
                                    <span className="btn-accent mt-3 inline-flex text-xs">
                                        Find Twins
                                    </span>
                                </div>
                            </Link>
                            {semCount > 0 && (
                                <Link href={`/wrapped/${student.rollNo}/${sorted[sorted.length - 1].semester}`} className="card p-4 block card-hover">
                                    <div className="text-center py-2">
                                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Semester Wrapped</p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                            Your semester story
                                        </p>
                                        <span className="btn-accent mt-3 inline-flex text-xs">
                                            View Wrapped
                                        </span>
                                    </div>
                                </Link>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="card p-4">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <p className="section-label">PERCENTILE</p>
                                    <Info size={12} style={{ color: 'var(--text-muted)' }} />
                                </div>
                                <p
                                    className="font-black text-2xl leading-tight"
                                    style={{ color: student.percentile >= 90 ? 'var(--success)' : student.percentile >= 60 ? 'var(--text-primary)' : 'var(--danger)' }}
                                >
                                    {student.percentile.toFixed(1)}%
                                </p>
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Rank</span>
                                    <span className="text-xs font-semibold mono" style={{ color: 'var(--text-primary)' }}>
                                        #{student.rank}
                                    </span>
                                </div>
                            </div>
                            <div className="card p-4">
                                <p className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
                                    Grade Summary
                                </p>
                                {hasGrades ? (
                                    <GradeSummaryBars dist={gradeDist} />
                                ) : (
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No grade data yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            ) : semCount === 1 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className="card p-4">
                        <p className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
                            Performance Summary
                        </p>
                        <div className="space-y-3">
                            <div>
                                <p className="section-label mb-0.5">Percentile</p>
                                <p
                                    className="font-black text-2xl leading-tight"
                                    style={{ color: student.percentile >= 90 ? 'var(--success)' : student.percentile >= 60 ? 'var(--text-primary)' : 'var(--danger)' }}
                                >
                                    {student.percentile.toFixed(1)}%
                                </p>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Rank</span>
                                <span className="text-xs font-semibold mono" style={{ color: 'var(--text-primary)' }}>
                                    #{student.rank}
                                </span>
                            </div>
                        </div>
                        <div
                            className="mt-4 p-2.5 rounded-lg flex items-start gap-2"
                            style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-light-border)' }}
                        >
                            <BarChart3 size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--accent)' }}>
                                Complete more semesters to unlock SGPA trend analysis.
                            </p>
                        </div>
                    </div>

                    <Link href={`/twin/${student.rollNo}`} className="card p-4 block card-hover">
                        <div className="text-center py-2">
                            <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: 'var(--accent-light)' }}>
                                <Sparkles size={18} style={{ color: 'var(--accent)' }} />
                            </div>
                            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Find Academic Twins</p>
                            <p className="text-xs mt-1 max-w-[200px] mx-auto" style={{ color: 'var(--text-secondary)' }}>
                                Discover students with similar performance.
                            </p>
                            <span className="btn-accent mt-3 inline-flex text-xs">
                                <Sparkles size={12} />
                                Run Algorithm
                            </span>
                        </div>
                    </Link>

                    <Link href={`/wrapped/${student.rollNo}/${sorted[sorted.length - 1].semester}`} className="card p-4 block card-hover">
                        <div className="text-center py-2">
                            <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: 'var(--success-bg)' }}>
                                <Gift size={18} style={{ color: 'var(--success)' }} />
                            </div>
                            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Semester Wrapped</p>
                            <p className="text-xs mt-1 max-w-[200px] mx-auto" style={{ color: 'var(--text-secondary)' }}>
                                Your semester story experience.
                            </p>
                            <span className="btn-accent mt-3 inline-flex text-xs">
                                <Gift size={12} />
                                View Wrapped
                            </span>
                        </div>
                    </Link>

                    <div className="card p-4">
                        <p className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
                            Grade Summary
                        </p>
                        {hasGrades ? (
                            <GradeSummaryBars dist={gradeDist} />
                        ) : (
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No grade data available yet.</p>
                        )}
                    </div>
                </div>

            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <Link href={`/twin/${student.rollNo}`} className="card p-4 block card-hover">
                        <div className="text-center py-4">
                            <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: 'var(--accent-light)' }}>
                            </div>
                            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Find Your Academic Twins</p>
                            <p className="text-sm mt-1 max-w-xs mx-auto" style={{ color: 'var(--text-secondary)' }}>
                                Discover students with similar academic performance.
                            </p>
                            <span className="btn-accent mt-4 inline-flex">
                                Run Twins Algorithm
                            </span>
                        </div>
                    </Link>
                    <Link href="/wrapped" className="card p-4 block card-hover">
                        <div className="text-center py-4">
                            <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: 'var(--success-bg)' }}>
                            </div>
                            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Semester Wrapped</p>
                            <p className="text-sm mt-1 max-w-xs mx-auto" style={{ color: 'var(--text-secondary)' }}>
                                Get your personalized semester story experience.
                            </p>
                            <span className="btn-accent mt-4 inline-flex">
                                View Wrapped
                            </span>
                        </div>
                    </Link>
                    <Link href="/compare" className="card p-4 block card-hover">
                        <div className="text-center py-4">
                            <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: 'var(--accent-light)' }}>
                                <Users size={18} style={{ color: 'var(--accent)' }} />
                            </div>
                            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Compare With Peers</p>
                            <p className="text-sm mt-1 max-w-xs mx-auto" style={{ color: 'var(--text-secondary)' }}>
                                Compare your profile with other students side-by-side.
                            </p>
                            <span className="btn-accent mt-4 inline-flex">
                                Compare Now
                            </span>
                        </div>
                    </Link>
                </div>
            )}

            {/* ── Academic Record ── */}
            {semCount > 0 ? (
                <div className="mb-4">
                    <p className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                        Academic Record
                    </p>
                    <SemesterSection semesters={sgpaList} scores={scores} />
                </div>
            ) : (
                <div className="card p-6 mb-4 text-center">
                    <BookOpen size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>No Academic Records Yet</p>
                    <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
                        Once semester results are published, your complete academic record will appear here.
                    </p>
                </div>
            )}

            <SubjectDropSimulator student={student} />
        </div>
    );
}
