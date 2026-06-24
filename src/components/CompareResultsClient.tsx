"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Target, Trophy, Award, BookOpen, AlertCircle } from 'lucide-react';
import { CompareCharts } from '@/components/CompareCharts';
import { useCollege } from '@/components/CollegeProvider';
import { fetchStudentProfile, Student } from '@/lib/data';
import { formatGrade } from '@/lib/utils';

export function CompareResultsClient({ rolls }: { rolls: string[] }) {
    const { college } = useCollege();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (rolls.length === 0) {
            setStudents([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        Promise.all(
            rolls.map(roll => fetchStudentProfile(roll, college).catch(() => null))
        ).then(results => {
            setStudents(results.filter(Boolean) as Student[]);
            setLoading(false);
        });
    }, [rolls, college]);

    if (loading) {
        return (
            <div className="mt-8 animate-pulse space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {rolls.map((_, i) => (
                        <div key={i} className="card p-6 h-48" style={{ backgroundColor: 'var(--surface-elevated)' }} />
                    ))}
                </div>
            </div>
        );
    }

    if (rolls.length > 0 && students.length === 0) {
        return (
            <div className="card p-8 text-center mt-8" style={{ borderColor: 'var(--danger)', backgroundColor: 'var(--danger-bg)' }}>
                <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--danger)' }} />
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--danger)' }}>No Students Found</h3>
                <p style={{ color: 'var(--text-secondary)' }}>We couldn&apos;t find any students matching the roll numbers provided. Please check for typos and try again.</p>
            </div>
        );
    }

    if (students.length === 0) return null;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {students.map((stu) => (
                    <Link key={stu.rollNo} href={`/student/${stu.rollNo}`} className="card-hover p-6 block">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }} title={stu.name}>
                                    {stu.name}
                                </h3>
                                <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{stu.rollNo}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>CGPA</p>
                                <p className="text-2xl font-bold font-mono" style={{ color: 'var(--accent)' }}>{formatGrade(stu.cgpa, 2)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Trophy className="w-4 h-4" style={{ color: 'var(--warning)' }} />
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Univ Rank</span>
                                </div>
                                <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>#{stu.overall_rank ?? stu.rank}</p>
                            </div>
                            <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Award className="w-4 h-4" style={{ color: 'var(--success)' }} />
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Branch Rank</span>
                                </div>
                                <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>#{stu.branch_rank}</p>
                            </div>
                            <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Target className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Percentile</span>
                                </div>
                                <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{stu.percentile}%</p>
                            </div>
                            <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
                                <div className="flex items-center gap-2 mb-1">
                                    <BookOpen className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Credits</span>
                                </div>
                                <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{stu.credits_completed}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <CompareCharts students={students} />
        </div>
    );
}
