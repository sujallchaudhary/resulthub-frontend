"use client";

import { useState, useEffect } from 'react';
import { Calculator, Plus, Trash2, RotateCcw, Award } from 'lucide-react';
import { formatGrade } from '@/lib/utils';

interface SemesterRow {
    id: string;
    semesterName: string;
    sgpa: string;
    credits: string;
}

export default function CgpaCalculator() {
    const [rows, setRows] = useState<SemesterRow[]>([
        { id: '1', semesterName: 'Semester 1', sgpa: '', credits: '' },
        { id: '2', semesterName: 'Semester 2', sgpa: '', credits: '' },
    ]);
    const [cgpa, setCgpa] = useState<number | null>(null);
    const [totalCredits, setTotalCredits] = useState<number>(0);

    const generateId = () => Math.random().toString(36).substring(2, 9);

    const addRow = () => {
        setRows([...rows, {
            id: generateId(),
            semesterName: `Semester ${rows.length + 1}`,
            sgpa: '',
            credits: ''
        }]);
    };

    const removeRow = (id: string) => {
        if (rows.length > 1) {
            setRows(rows.filter(row => row.id !== id));
        }
    };

    const updateRow = (id: string, field: keyof SemesterRow, value: string) => {
        setRows(rows.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ));
    };

    const resetCalculator = () => {
        setRows([
            { id: generateId(), semesterName: 'Semester 1', sgpa: '', credits: '' },
            { id: generateId(), semesterName: 'Semester 2', sgpa: '', credits: '' },
        ]);
        setCgpa(null);
        setTotalCredits(0);
    };

    useEffect(() => {
        let sumProduct = 0;
        let sumCredits = 0;
        let hasValidInput = false;

        rows.forEach(row => {
            const sgpaVal = parseFloat(row.sgpa);
            const creditsVal = parseFloat(row.credits);

            if (!isNaN(sgpaVal) && !isNaN(creditsVal) && creditsVal > 0) {
                sumProduct += sgpaVal * creditsVal;
                sumCredits += creditsVal;
                hasValidInput = true;
            }
        });

        if (hasValidInput && sumCredits > 0) {
            setCgpa(sumProduct / sumCredits);
            setTotalCredits(sumCredits);
        } else {
            setCgpa(null);
            setTotalCredits(0);
        }
    }, [rows]);

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl animate-in fade-in duration-500">
            {/* Header */}
            <div className="text-center mb-10">
                <h1
                    className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight drop-shadow-sm"
                    style={{ color: 'var(--text-primary)' }}
                >
                    CGPA Calculator
                </h1>
                <p className="text-lg max-w-2xl mx-auto font-medium" style={{ color: 'var(--text-muted)' }}>
                    Calculate your Cumulative Grade Point Average securely right in your browser. Add your semesters below.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Calculator Form */}
                <div
                    className="lg:col-span-2 p-6 md:p-8 rounded-xl border relative overflow-hidden"
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                    <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'linear-gradient(to right, var(--accent), var(--accent-hover))' }}></div>

                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Semester Details</h2>
                        <button
                            onClick={resetCalculator}
                            className="text-sm flex items-center gap-1 transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                            <RotateCcw className="w-4 h-4" /> Reset
                        </button>
                    </div>

                    <div className="space-y-4 mb-6">
                        {/* Headers */}
                        <div className="grid grid-cols-12 gap-4 px-2 hidden md:grid">
                            <div className="col-span-4 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Semester Name</div>
                            <div className="col-span-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>SGPA (0-10)</div>
                            <div className="col-span-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Credits</div>
                            <div className="col-span-2"></div>
                        </div>

                        {/* Rows */}
                        {rows.map((row) => (
                            <div
                                key={row.id}
                                className="grid grid-cols-12 gap-3 md:gap-4 items-center p-3 rounded-xl border transition-all"
                                style={{
                                    backgroundColor: 'var(--accent-light)',
                                    borderColor: 'var(--accent-light-border)',
                                }}
                            >
                                <div className="col-span-12 md:col-span-4">
                                    <label className="md:hidden text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Semester Name</label>
                                    <input
                                        type="text"
                                        value={row.semesterName}
                                        onChange={(e) => updateRow(row.id, 'semesterName', e.target.value)}
                                        placeholder="e.g. Semester 1"
                                        className="w-full rounded-lg px-3 py-2 border transition-all outline-none focus:ring-2"
                                        style={{
                                            backgroundColor: 'var(--background)',
                                            borderColor: 'var(--border)',
                                            color: 'var(--text-primary)',
                                            // @ts-expect-error CSS custom property
                                            '--tw-ring-color': 'var(--accent)',
                                        }}
                                    />
                                </div>
                                <div className="col-span-6 md:col-span-3">
                                    <label className="md:hidden text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>SGPA</label>
                                    <input
                                        type="number"
                                        min="0" max="10" step="0.01"
                                        value={row.sgpa}
                                        onChange={(e) => updateRow(row.id, 'sgpa', e.target.value)}
                                        placeholder="9.5"
                                        className="w-full rounded-lg px-3 py-2 border transition-all outline-none focus:ring-2"
                                        style={{
                                            backgroundColor: 'var(--background)',
                                            borderColor: 'var(--border)',
                                            color: 'var(--text-primary)',
                                            // @ts-expect-error CSS custom property
                                            '--tw-ring-color': 'var(--accent)',
                                        }}
                                    />
                                </div>
                                <div className="col-span-6 md:col-span-3">
                                    <label className="md:hidden text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Credits</label>
                                    <input
                                        type="number"
                                        min="1" max="50" step="1"
                                        value={row.credits}
                                        onChange={(e) => updateRow(row.id, 'credits', e.target.value)}
                                        placeholder="22"
                                        className="w-full rounded-lg px-3 py-2 border transition-all outline-none focus:ring-2"
                                        style={{
                                            backgroundColor: 'var(--background)',
                                            borderColor: 'var(--border)',
                                            color: 'var(--text-primary)',
                                            // @ts-expect-error CSS custom property
                                            '--tw-ring-color': 'var(--accent)',
                                        }}
                                    />
                                </div>
                                <div className="col-span-12 md:col-span-2 flex justify-end md:justify-center mt-2 md:mt-0">
                                    <button
                                        onClick={() => removeRow(row.id)}
                                        disabled={rows.length === 1}
                                        className="p-2 rounded-lg transition-colors disabled:opacity-30"
                                        style={{ color: 'var(--text-muted)' }}
                                        aria-label="Remove semester"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addRow}
                        className="w-full py-3 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition-colors font-medium"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                        <Plus className="w-5 h-5" /> Add Another Semester
                    </button>
                </div>

                {/* Live Results Panel */}
                <div className="lg:col-span-1">
                    <div
                        className="p-8 rounded-xl border sticky top-24 flex flex-col items-center justify-center text-center min-h-[300px]"
                        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                    >
                        <div className="mb-6 relative">
                            <div className="absolute inset-0 blur-[40px] opacity-20 rounded-full" style={{ backgroundColor: 'var(--accent)' }}></div>
                            <div
                                className="relative w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-xl border"
                                style={{
                                    background: 'linear-gradient(to bottom right, var(--accent-light), var(--surface))',
                                    borderColor: 'var(--accent-light-border)',
                                }}
                            >
                                {cgpa !== null ? (
                                    <>
                                        <span
                                            className="text-4xl font-extrabold"
                                            style={{ color: 'var(--accent)' }}
                                        >
                                            {formatGrade(cgpa, 2)}
                                        </span>
                                        <span className="text-xs font-medium uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>CGPA</span>
                                    </>
                                ) : (
                                    <span className="font-medium" style={{ color: 'var(--text-muted)' }}>--</span>
                                )}
                            </div>
                        </div>

                        {cgpa !== null && (
                            <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 w-full">
                                <p className="text-lg font-medium mb-2 flex items-center justify-center gap-2">
                                    {cgpa >= 9 ? <span className="text-green-500 flex items-center gap-1"><Award className="w-5 h-5" /> Outstanding</span> :
                                        cgpa >= 8 ? <span style={{ color: 'var(--accent)' }} className="flex items-center gap-1"><Award className="w-5 h-5" /> Excellent</span> :
                                            cgpa >= 7 ? <span className="text-sky-500 flex items-center gap-1"><Award className="w-5 h-5" /> Good</span> :
                                                <span style={{ color: 'var(--text-secondary)' }}>Keep it up!</span>}
                                </p>
                                <div
                                    className="rounded-lg p-3 border flex justify-between items-center text-sm w-full"
                                    style={{ backgroundColor: 'var(--accent-light)', borderColor: 'var(--accent-light-border)' }}
                                >
                                    <span style={{ color: 'var(--text-muted)' }}>Total Credits Earned</span>
                                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{totalCredits}</span>
                                </div>
                            </div>
                        )}

                        {cgpa === null && (
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                Enter your credits and SGPA to see your Cumulative GPA calculated in real-time.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
