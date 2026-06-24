"use client";

import { useState, useEffect, useRef } from 'react';
import { fetchAcademicTwins, TwinsResponseData } from '@/lib/data';
import { Sparkles, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { useCollege } from '@/components/CollegeProvider';
import { formatGrade } from '@/lib/utils';

export function AcademicTwins({ rollNo, autoFetch = false }: { rollNo: string; autoFetch?: boolean }) {
    const [loading, setLoading] = useState(false);
    const [twinsData, setTwinsData] = useState<TwinsResponseData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const didAutoFetch = useRef(false);
    const { college } = useCollege();

    const handleFetch = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAcademicTwins(rollNo, 5, college);
            if (data) setTwinsData(data);
            else setError('Rate limit hit or no twins found. Try again in a few minutes.');
        } catch (err: unknown) {
            setError((err as Error).message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (autoFetch && !didAutoFetch.current && !twinsData && !loading) {
            didAutoFetch.current = true;
            handleFetch();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoFetch]);

    // Prompt state
    if (!twinsData && !loading && !error) {
        return (
            <div className="text-center py-2">
                <div className="mb-4">
                    <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: 'var(--accent-light)' }}>
                        <Sparkles size={18} style={{ color: 'var(--accent)' }} />
                    </div>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Find Your Academic Twins</p>
                    <p className="text-sm mt-1 max-w-xs mx-auto" style={{ color: 'var(--text-secondary)' }}>
                        Discover students with the most similar SGPA trends, grades, and subject performance.
                    </p>
                </div>
                <button onClick={handleFetch} className="btn-accent">
                    <Sparkles size={14} />
                    Run Twins Algorithm
                </button>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Rate limited: 15 requests / 15 min</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="py-8 text-center">
                <Loader2 size={24} className="animate-spin mx-auto mb-3" style={{ color: 'var(--accent)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Running similarity algorithm…</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Comparing thousands of score records</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-6 text-center">
                <AlertTriangle size={20} className="mx-auto mb-2" style={{ color: 'var(--danger)' }} />
                <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
                <button onClick={handleFetch} className="btn-ghost mt-3 text-xs">Try Again</button>
            </div>
        );
    }

    if (!twinsData) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Academic Twins
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    vs {twinsData.poolStats.totalCompared.toLocaleString()} students
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {twinsData.twins.map((twin, i) => {
                    const sgpaData = twin.sgpaTrend.map((sgpa, si) => ({ sem: si + 1, sgpa }));
                    const minSgpa = Math.max(0, Math.min(...twin.sgpaTrend) - 1);
                    const isTopMatch = i === 0;

                    return (
                        <div
                            key={twin.rollNo}
                            className="card p-4 space-y-3"
                            style={isTopMatch ? { borderColor: 'var(--accent-light-border)' } : {}}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span
                                            className="font-black text-xl"
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
                                            <span className="badge" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>Diff Batch</span>
                                        )}
                                        {twin.sameDepartment && twin.sameYear && (
                                            <span className="badge badge-success">Classmate</span>
                                        )}
                                    </div>
                                </div>
                                <Link
                                    href={`/student/${twin.rollNo}`}
                                    className="p-1.5 rounded-lg border transition-colors"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                                >
                                    <ExternalLink size={13} />
                                </Link>
                            </div>

                            <div>
                                <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                    {twin.name}
                                </p>
                                <p className="text-xs mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                    {twin.rollNo} · {formatGrade(twin.cgpa, 2)} CGPA
                                </p>
                            </div>

                            {/* Shared subjects */}
                            {twin.sharedStrongSubjects.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {twin.sharedStrongSubjects.slice(0, 4).map(s => (
                                        <span key={s} className="badge badge-success mono">{s}</span>
                                    ))}
                                </div>
                            )}

                            {/* Mini sparkline */}
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
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
