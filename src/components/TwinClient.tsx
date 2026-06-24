"use client";

import { useState, useCallback } from 'react';
import { fetchAcademicTwins, TwinsResponseData } from '@/lib/data';
import { RollNoPrompt } from '@/components/RollNoPrompt';
import { clearSavedRollNo } from '@/components/RollNoSaver';
import { Sparkles, ExternalLink, Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { useCollege } from '@/components/CollegeProvider';
import { formatGrade } from '@/lib/utils';

interface TwinClientProps {
    /** Pre-fill roll number (e.g. from URL param) */
    initialRollNo?: string;
    /** Auto-fetch twins on mount when initialRollNo or saved roll is present */
    autoLoad?: boolean;
}

export default function TwinClient({ initialRollNo, autoLoad = false }: TwinClientProps) {
    const [rollNo, setRollNo] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [twinsData, setTwinsData] = useState<TwinsResponseData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { college } = useCollege();

    const fetchTwins = useCallback(async (roll: string) => {
        setRollNo(roll);
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAcademicTwins(roll, 6, college);
            if (data) setTwinsData(data);
            else setError('Rate limit hit or no twins found. Try again in a few minutes.');
        } catch (err: unknown) {
            setError((err as Error).message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    }, [college]);

    // Step 1 — ask for roll number
    if (!rollNo && !loading && !twinsData) {
        return (
            <RollNoPrompt
                title="Find Your Academic Twin"
                description="Discover students with the most similar SGPA trends, grades, and subject performance."
                buttonLabel="Find"
                onSubmit={fetchTwins}
                autoLoad={autoLoad}
                initialRollNo={initialRollNo}
            />
        );
    }

    // Step 2 — loading
    if (loading) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-20 text-center">
                <Loader2 size={28} className="animate-spin mx-auto mb-4" style={{ color: 'var(--accent)' }} />
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Running similarity algorithm…</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Comparing thousands of score records for {rollNo}</p>
            </div>
        );
    }

    // Step 3 — error
    if (error) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-20 text-center">
                <AlertTriangle size={24} className="mx-auto mb-3" style={{ color: 'var(--danger)' }} />
                <p className="font-semibold" style={{ color: 'var(--danger)' }}>{error}</p>
                <div className="flex items-center justify-center gap-3 mt-4">
                    <button onClick={() => fetchTwins(rollNo!)} className="btn-accent text-sm">
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

    if (!twinsData) return null;

    // Step 4 — results
    const student = twinsData.student;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">

            {/* Back link */}
            <button
                onClick={() => { clearSavedRollNo(); setRollNo(null); setTwinsData(null); }}
                className="inline-flex items-center gap-1.5 text-sm mb-4 group"
                style={{ color: 'var(--text-secondary)' }}
            >
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                Change Roll No
            </button>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={18} style={{ color: 'var(--accent)' }} />
                        <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                            Academic Twins
                        </h1>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Showing twins for{' '}
                        <Link href={`/student/${student.rollNo}`} className="font-semibold underline" style={{ color: 'var(--accent)' }}>
                            {student.name}
                        </Link>
                        {' '}({student.rollNo})
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Compared against
                    </p>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {twinsData.poolStats.totalCompared.toLocaleString()} students
                    </p>
                </div>
            </div>

            {/* Pool stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                {[
                    { label: 'Total Compared', value: twinsData.poolStats.totalCompared.toLocaleString() },
                    { label: 'Same Branch', value: twinsData.poolStats.sameDepartment.toLocaleString() },
                    { label: 'Other Branches', value: twinsData.poolStats.otherDepartment.toLocaleString() },
                    { label: 'Same Batch', value: twinsData.poolStats.sameYear.toLocaleString() },
                ].map(stat => (
                    <div key={stat.label} className="card px-3 py-2">
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                        <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Twins grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {twinsData.twins.map((twin, i) => {
                    const sgpaData = twin.sgpaTrend.map((sgpa, si) => ({ sem: si + 1, sgpa }));
                    const minSgpa = Math.max(0, Math.min(...twin.sgpaTrend) - 1);
                    const isTopMatch = i === 0;

                    return (
                        <div
                            key={twin.rollNo}
                            className="card p-4 space-y-3"
                            style={isTopMatch ? { borderColor: 'var(--accent)' } : {}}
                        >
                            {/* Match % + badges */}
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span
                                            className="font-black text-2xl"
                                            style={{ color: isTopMatch ? 'var(--accent)' : 'var(--text-primary)' }}
                                        >
                                            {twin.matchPercentage.toFixed(1)}%
                                        </span>
                                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>match</span>
                                    </div>
                                    <div className="flex gap-1 mt-1">
                                        {!twin.sameDepartment && (
                                            <span className="badge badge-warning">Diff Branch</span>
                                        )}
                                        {!twin.sameYear && (
                                            <span className="badge" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>Diff Batch</span>
                                        )}
                                        {twin.sameDepartment && twin.sameYear && (
                                            <span className="badge badge-success">Classmate</span>
                                        )}
                                    </div>
                                </div>
                                {isTopMatch && (
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                                        #1
                                    </span>
                                )}
                            </div>

                            {/* Name + rollNo */}
                            <div>
                                <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                    {twin.name}
                                </p>
                                <p className="text-xs mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                    {twin.rollNo} · {formatGrade(twin.cgpa, 2)} CGPA
                                </p>
                            </div>

                            {/* Similarity breakdown */}
                            <div className="space-y-1">
                                {[
                                    { label: 'SGPA', pct: twin.similarity.sgpa },
                                    { label: 'Subjects', pct: twin.similarity.subjects },
                                    { label: 'Grades', pct: twin.similarity.gradeDistribution },
                                ].map(bar => (
                                    <div key={bar.label} className="flex items-center gap-2">
                                        <span className="text-xs w-14 shrink-0" style={{ color: 'var(--text-muted)' }}>{bar.label}</span>
                                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                                            <div
                                                className="h-full rounded-full"
                                                style={{ width: `${bar.pct}%`, backgroundColor: isTopMatch ? 'var(--accent)' : 'var(--text-secondary)' }}
                                            />
                                        </div>
                                        <span className="text-xs mono w-8 text-right" style={{ color: 'var(--text-secondary)' }}>{bar.pct.toFixed(0)}%</span>
                                    </div>
                                ))}
                            </div>

                            {/* Shared subjects */}
                            {twin.sharedStrongSubjects.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {twin.sharedStrongSubjects.slice(0, 4).map(s => (
                                        <span key={s} className="badge badge-success mono text-xs">{s}</span>
                                    ))}
                                </div>
                            )}

                            {/* Sparkline */}
                            {sgpaData.length > 1 && (
                                <div className="h-10 w-full opacity-60">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={sgpaData}>
                                            <YAxis domain={[minSgpa, 10]} hide />
                                            <Line
                                                type="monotone"
                                                dataKey="sgpa"
                                                stroke={isTopMatch ? 'var(--accent)' : '#9B9B9B'}
                                                strokeWidth={1.5}
                                                dot={false}
                                                isAnimationActive={false}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* View profile link */}
                            <Link
                                href={`/student/${twin.rollNo}`}
                                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border text-xs font-medium transition-colors"
                                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                            >
                                View Profile
                                <ExternalLink size={12} />
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
