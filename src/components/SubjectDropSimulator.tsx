"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Target, Info, AlertTriangle, MinusCircle, ChevronRight, RotateCcw, CheckCircle2, BookOpen, Pencil, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { Student } from '@/lib/data';
import { formatGrade } from '@/lib/utils';

interface SubjectDropSimulatorProps {
    student: Student;
}

// Map NSUT grades to grade points
export const GRADE_POINTS: Record<string, number> = {
    'O': 10, 'A+': 9, 'A': 8, 'B+': 7,
    'B': 6, 'C': 5, 'D': 4, 'P': 4,
    'F': 0, 'FD': 0,
};

// Grade display color helper
function gradeColor(grade: string) {
    const g = grade?.toUpperCase();
    if (['O', 'A+', 'A'].includes(g)) return 'var(--success)';
    if (['B+', 'B'].includes(g)) return '#3B82F6';
    if (g === 'C') return 'var(--warning)';
    if (['F', 'FD'].includes(g)) return 'var(--danger)';
    return 'var(--text-secondary)';
}

// ── Credit Prediction ─────────────────────────────────────
// Predicts credits for NSUT subject codes (semesters 1–4).
//
// Rules derived from NSUT curriculum patterns:
//   • VA** prefix (e.g. VANH0301, VAPD0101, VAPD0115) → 0 credits (audit / non-credit)
//   • FCFO** prefix (e.g. FCFO0301) → 2 credits (foundation optional)
//   • Everything else (e.g. CACSC401, CAMTC305, FCHS0105, FCEE0106) → 4 credits
export function predictCredits(subjectCode: string): number {
    const code = subjectCode.toUpperCase().trim();

    // 0-credit: Value-Added / audit courses — VA prefix
    if (code.startsWith('VA')) return 0;

    // 2-credit: Foundation optional courses — FCFO prefix
    if (code.startsWith('FCFO')) return 2;

    // Default: most theory + lab courses
    return 4;
}

// ── Types ─────────────────────────────────────────────────
export interface SubjectWithCredits {
    subject_code: string;
    grade: string;
    marks: number | string;
    semester: number | string;
    credits: number;
}

// ── Setup Step ────────────────────────────────────────────
interface SetupProps {
    semesters: Array<{
        semester: number | string;
        sgpa: number;
        subjects: Array<{ subject_code: string; grade: string; marks: number | string }>;
    }>;
    creditMap: Record<string, number>;
    touchedFields: Set<string>;
    onCreditChange: (code: string, val: number) => void;
    onConfirm: () => void;
    isPredicted: boolean;
}

function SetupStep({ semesters, creditMap, touchedFields, onCreditChange, onConfirm, isPredicted }: SetupProps) {
    const sorted = [...semesters].sort((a, b) => Number(a.semester) - Number(b.semester));
    // A field is considered filled if the user has explicitly typed into it (even 0 is valid for non-credit subjects)
    const totalSubjects = semesters.reduce((s, sem) => s + (sem.subjects || []).length, 0);
    const allFilled = totalSubjects > 0 && touchedFields.size >= totalSubjects;

    return (
        <div>
            <div className="inline-flex items-start gap-2 p-3 rounded-lg mb-4"
                style={{ backgroundColor: isPredicted ? 'var(--success-bg)' : 'var(--accent-light)', borderColor: isPredicted ? 'var(--success)' : 'var(--accent)', border: '1px solid' }}>
                {isPredicted ? (
                    <Sparkles size={15} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 1 }} />
                ) : (
                    <Info size={15} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
                )}
                <p className="text-xs leading-relaxed" style={{ color: isPredicted ? 'var(--success)' : 'var(--accent)' }}>
                    {isPredicted
                        ? 'Credits have been auto-predicted from subject codes. Review and correct if needed, then run the simulator.'
                        : 'Enter the credits for each subject from your marksheet — then we\'ll calculate exactly how dropping a subject affects your CGPA.'}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {sorted.map(sem => {
                    const subs = sem.subjects || [];

                    return (
                        <div key={sem.semester} className="card overflow-hidden">
                            {/* Semester header */}
                            <div className="flex items-center justify-between px-3 py-1.5 border-b"
                                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
                                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                                    Semester {sem.semester}
                                </span>
                                <div className="flex items-center gap-2">
                                    {sem.sgpa > 0 && (
                                        <span className="font-black text-sm"
                                            style={{ color: sem.sgpa >= 8 ? 'var(--success)' : sem.sgpa >= 6 ? 'var(--warning)' : 'var(--danger)' }}>
                                            {formatGrade(sem.sgpa, 2)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Subject rows */}
                            <table className="w-full data-table data-table-compact">
                                <thead>
                                    <tr>
                                        <th className="text-left">Subject</th>
                                        <th className="text-center w-12">Grade</th>
                                        <th className="text-right w-16">Credits</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subs.map(sub => {
                                        const isTouched = touchedFields.has(sub.subject_code);
                                        const val = isTouched ? (creditMap[sub.subject_code] ?? 0) : '';
                                        const predicted = predictCredits(sub.subject_code);
                                        const isZeroCredit = predicted === 0;
                                        return (
                                            <tr key={sub.subject_code} style={{ opacity: isZeroCredit ? 0.45 : 1 }}>
                                                <td>
                                                    <span className="mono" style={{ color: 'var(--text-primary)' }}>
                                                        {sub.subject_code}
                                                    </span>
                                                    {isZeroCredit && (
                                                        <span className="text-[9px] ml-1 px-1 py-0.5 rounded"
                                                            style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-muted)' }}>
                                                            audit
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    <span className="text-xs font-bold" style={{ color: gradeColor(sub.grade) }}>
                                                        {sub.grade}
                                                    </span>
                                                </td>
                                                <td className="text-right">
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        placeholder="cr"
                                                        value={val}
                                                        onChange={e => {
                                                            const raw = e.target.value.replace(/[^0-9]/g, '');
                                                            if (raw === '') {
                                                                onCreditChange(sub.subject_code, -1);
                                                            } else {
                                                                const n = parseInt(raw, 10);
                                                                if (n >= 0 && n <= 10) {
                                                                    onCreditChange(sub.subject_code, n);
                                                                }
                                                            }
                                                        }}
                                                        className="w-10 text-center text-xs font-mono rounded border py-0.5 px-1 focus:outline-none"
                                                        style={{
                                                            backgroundColor: 'var(--surface-elevated)',
                                                            borderColor: isTouched ? 'var(--success)' : 'var(--border)',
                                                            color: 'var(--text-primary)',
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={onConfirm}
                disabled={!allFilled}
                className="w-full mt-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                    backgroundColor: allFilled ? 'var(--accent)' : 'var(--surface-elevated)',
                    color: allFilled ? '#fff' : 'var(--text-muted)',
                    cursor: allFilled ? 'pointer' : 'not-allowed',
                }}
            >
                <CheckCircle2 size={16} />
                {allFilled ? 'Run Simulator →' : 'Fill in all credits to continue'}
            </button>
        </div>
    );
}

// ── Best Drop Recommendation ──────────────────────────────
export interface DropRecommendation {
    subject_code: string;
    semester: number | string;
    grade: string;
    credits: number;
    cgpaDelta: number;
    newCGPA: number;
}

export function computeBestDrop(subjects: SubjectWithCredits[], officialCGPA: number): DropRecommendation | null {
    // Only consider subjects with credits > 0
    const eligible = subjects.filter(s => s.credits > 0);
    if (eligible.length <= 1) return null;

    // Compute full weighted CGPA from all credited subjects
    let ptsFull = 0, credsFull = 0;
    eligible.forEach(sub => {
        const gp = GRADE_POINTS[sub.grade?.toUpperCase()] ?? 0;
        ptsFull += gp * sub.credits;
        credsFull += sub.credits;
    });
    const creditedFull = credsFull > 0 ? ptsFull / credsFull : officialCGPA;

    let bestDrop: DropRecommendation | null = null;

    for (const candidate of eligible) {
        const gp = GRADE_POINTS[candidate.grade?.toUpperCase()] ?? 0;
        const ptsAfter = ptsFull - (gp * candidate.credits);
        const credsAfter = credsFull - candidate.credits;
        if (credsAfter <= 0) continue;

        const creditedAfter = ptsAfter / credsAfter;
        const delta = creditedAfter - creditedFull;

        // We want the drop that MAXIMISES the delta (biggest improvement)
        if (!bestDrop || delta > bestDrop.cgpaDelta) {
            bestDrop = {
                subject_code: candidate.subject_code,
                semester: candidate.semester,
                grade: candidate.grade,
                credits: candidate.credits,
                cgpaDelta: delta,
                newCGPA: officialCGPA + delta,
            };
        }
    }

    // Only recommend if it actually improves CGPA
    if (bestDrop && bestDrop.cgpaDelta > 0.001) return bestDrop;
    return null;
}

// ── Simulator Step ────────────────────────────────────────
interface SimulatorProps {
    subjects: SubjectWithCredits[];
    officialCGPA: number;
    onEdit: () => void;
}

function SimulatorStep({ subjects, officialCGPA, onEdit }: SimulatorProps) {
    const [droppedSubjects, setDroppedSubjects] = useState<string[]>([]);
    const MAX_DROPS = 2;

    // Filter out 0-credit subjects — they don't affect CGPA at all
    const creditedSubjects = useMemo(() => subjects.filter(s => s.credits > 0), [subjects]);

    // Auto-recommend the best drop
    const recommendation = useMemo(() => computeBestDrop(creditedSubjects, officialCGPA), [creditedSubjects, officialCGPA]);

    const toggleDrop = (code: string) => {
        if (droppedSubjects.includes(code)) {
            setDroppedSubjects(prev => prev.filter(c => c !== code));
        } else if (droppedSubjects.length < MAX_DROPS) {
            setDroppedSubjects(prev => [...prev, code]);
        }
    };

    // Compute credit-weighted CGPAs to get an accurate DELTA from dropping
    // We then apply that delta to the official CGPA so the baseline always matches the profile
    const { creditedFull, creditedAfterDrop, newCreditTotal } = useMemo(() => {
        let ptsFull = 0, credsFull = 0;
        let ptsAfter = 0, credsAfter = 0;
        creditedSubjects.forEach(sub => {
            const gp = GRADE_POINTS[sub.grade?.toUpperCase()] ?? 0;
            ptsFull += gp * sub.credits;
            credsFull += sub.credits;
            if (!droppedSubjects.includes(sub.subject_code)) {
                ptsAfter += gp * sub.credits;
                credsAfter += sub.credits;
            }
        });
        return {
            creditedFull: credsFull > 0 ? ptsFull / credsFull : officialCGPA,
            creditedAfterDrop: credsAfter > 0 ? ptsAfter / credsAfter : officialCGPA,
            newCreditTotal: credsAfter,
        };
    }, [creditedSubjects, droppedSubjects, officialCGPA]);

    // Delta from user-entered credits, anchored to official baseline
    const cgpaDelta = creditedAfterDrop - creditedFull;
    const newCGPA = officialCGPA + cgpaDelta;
    const totalCredits = creditedSubjects.reduce((s, sub) => s + sub.credits, 0);

    // Group subjects by semester for grid display
    const semesterGroups = useMemo(() => {
        const map = new Map<string | number, SubjectWithCredits[]>();
        creditedSubjects.forEach(sub => {
            const list = map.get(sub.semester) || [];
            list.push(sub);
            map.set(sub.semester, list);
        });
        return [...map.entries()]
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([semester, subs]) => ({
                semester,
                subjects: subs.sort((a, b) => {
                    const pa = GRADE_POINTS[a.grade?.toUpperCase()] ?? 5;
                    const pb = GRADE_POINTS[b.grade?.toUpperCase()] ?? 5;
                    return pa - pb;
                }),
            }));
    }, [creditedSubjects]);

    return (
        <div>
            {/* Auto-recommendation banner */}
            {recommendation && droppedSubjects.length === 0 && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl mb-4"
                    style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent)' }}>
                    <Zap size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold mb-0.5" style={{ color: 'var(--accent)' }}>
                            Recommended Drop
                        </p>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            Drop <strong style={{ color: 'var(--text-primary)' }}>{recommendation.subject_code}</strong>
                            {' '}(Sem {recommendation.semester} · {recommendation.credits}cr · Grade {recommendation.grade})
                            {' '}for the biggest improvement: <strong style={{ color: 'var(--success)' }}>+{formatGrade(recommendation.cgpaDelta, 3)}</strong>
                            {' '}→ {formatGrade(recommendation.newCGPA, 2)} CGPA
                        </p>
                        <button
                            onClick={() => toggleDrop(recommendation.subject_code)}
                            className="mt-2 text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1 transition-all"
                            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
                            <TrendingUp size={12} /> Apply Recommendation
                        </button>
                    </div>
                </div>
            )}

            {/* Live CGPA panel */}
            <div className="flex items-center gap-4 p-3 rounded-xl mb-4"
                style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
                <div className="flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Current CGPA</p>
                    <p className="font-black text-xl mono" style={{ color: 'var(--text-primary)' }}>{formatGrade(officialCGPA, 2)}</p>
                </div>
                <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                <div className="flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>After Drop</p>
                    <p className="font-black text-xl mono" style={{
                        color: cgpaDelta > 0.005 ? 'var(--success)' : cgpaDelta < -0.005 ? 'var(--danger)' : 'var(--text-primary)'
                    }}>{droppedSubjects.length > 0 ? formatGrade(newCGPA, 2) : formatGrade(officialCGPA, 2)}</p>
                </div>
                <div className="flex-1 text-right">
                    <p className="font-bold text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Net Change</p>
                    <p className="font-black text-xl mono" style={{ color: cgpaDelta > 0.005 ? 'var(--success)' : cgpaDelta < -0.005 ? 'var(--danger)' : 'var(--text-primary)' }}>
                        {droppedSubjects.length === 0 ? '—' : `${cgpaDelta > 0 ? '+' : ''}${formatGrade(cgpaDelta, 2)}`}
                    </p>
                </div>
            </div>

            {/* Credits summary + actions */}
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Select subjects to drop <span style={{ color: 'var(--text-muted)' }}>({droppedSubjects.length}/{MAX_DROPS})</span>
                </p>
                <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{newCreditTotal}/{totalCredits} cr</span>
                    <button onClick={onEdit}
                        className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg"
                        style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-light)' }}>
                        <Pencil size={11} /> Edit Credits
                    </button>
                    {droppedSubjects.length > 0 && (
                        <button onClick={() => setDroppedSubjects([])}
                            className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg"
                            style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface-elevated)' }}>
                            <RotateCcw size={11} /> Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Semester-based grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {semesterGroups.map(({ semester, subjects: subs }) => (
                    <div key={semester} className="card overflow-hidden">
                        {/* Semester header */}
                        <div className="px-3 py-1.5 flex items-center justify-between border-b"
                            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
                            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                                Semester {semester}
                            </span>
                        </div>
                        {/* Subject table */}
                        <table className="w-full data-table data-table-compact">
                            <thead>
                                <tr>
                                    <th className="text-left">Subject</th>
                                    <th className="text-center w-14">Grade</th>
                                    <th className="text-right w-14">Credits</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subs.map(sub => {
                                    const isDropped = droppedSubjects.includes(sub.subject_code);
                                    const isMaxed = droppedSubjects.length >= MAX_DROPS && !isDropped;
                                    const isRecommended = recommendation?.subject_code === sub.subject_code && droppedSubjects.length === 0;
                                    return (
                                        <tr
                                            key={`${sub.semester}-${sub.subject_code}`}
                                            onClick={() => !isMaxed && toggleDrop(sub.subject_code)}
                                            className="transition-colors"
                                            style={{
                                                cursor: isMaxed ? 'not-allowed' : 'pointer',
                                                opacity: isMaxed ? 0.45 : 1,
                                                backgroundColor: isDropped ? 'var(--danger-bg)' : isRecommended ? 'var(--accent-light)' : 'transparent',
                                            }}
                                        >
                                            <td>
                                                <span className="mono" style={{
                                                    color: isDropped ? 'var(--danger)' : 'var(--text-primary)',
                                                    textDecoration: isDropped ? 'line-through' : 'none',
                                                }}>
                                                    {sub.subject_code}
                                                </span>
                                                {isRecommended && (
                                                    <span className="text-[9px] ml-1 px-1 py-0.5 rounded font-bold"
                                                        style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
                                                        ★ DROP
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-center">
                                                <span className="text-xs font-bold" style={{ color: gradeColor(sub.grade) }}>
                                                    {sub.grade}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <span className="mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                    {sub.credits}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>

            {droppedSubjects.length === MAX_DROPS && (
                <div className="mt-3 flex items-center gap-1.5 text-xs font-medium"
                    style={{ color: 'var(--warning)' }}>
                    <AlertTriangle size={13} />
                    Maximum drops reached. Click a dropped subject to restore it.
                </div>
            )}

            {droppedSubjects.length > 0 && cgpaDelta > 0.005 && (
                <div className="mt-3 p-3 rounded-lg text-xs"
                    style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success)' }}>
                    ✓ Dropping {droppedSubjects.join(' & ')} would improve your CGPA by <strong>+{formatGrade(cgpaDelta, 3)}</strong> — from {formatGrade(officialCGPA, 2)} → {formatGrade(newCGPA, 2)}.
                </div>
            )}
            {droppedSubjects.length > 0 && cgpaDelta < -0.005 && (
                <div className="mt-3 p-3 rounded-lg text-xs"
                    style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                    ⚠ Dropping {droppedSubjects.join(' & ')} would <strong>hurt</strong> your CGPA by {formatGrade(Math.abs(cgpaDelta), 3)}.
                </div>
            )}
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────
export function SubjectDropSimulator({ student }: SubjectDropSimulatorProps) {
    const [step, setStep] = useState<'setup' | 'simulate'>('setup');
    const [creditMap, setCreditMap] = useState<Record<string, number>>({});
    const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
    const [isPredicted, setIsPredicted] = useState(false);

    // Flatten semesters
    const semesters = useMemo(() => {
        return (student.semesters || []).map(sem => ({
            semester: sem.semester,
            sgpa: sem.sgpa,
            subjects: (sem.subjects || []).map(s => ({
                subject_code: s.subject_code,
                grade: s.grade,
                marks: s.marks,
            })),
        }));
    }, [student]);

    // Auto-predict credits on mount and jump straight to simulator
    useEffect(() => {
        const allSubjectCodes = semesters.flatMap(sem => sem.subjects.map(s => s.subject_code));
        if (allSubjectCodes.length === 0) return;

        const predicted: Record<string, number> = {};
        const touched = new Set<string>();

        allSubjectCodes.forEach(code => {
            predicted[code] = predictCredits(code);
            touched.add(code);
        });

        setCreditMap(predicted);
        setTouchedFields(touched);
        setIsPredicted(true);
        // Auto-advance to simulator since credits are predicted
        setStep('simulate');
    }, [semesters]);

    const handleCreditChange = useCallback((code: string, val: number) => {
        setTouchedFields(prev => {
            const next = new Set(prev);
            if (val === -1) {
                // User cleared the field — remove from touched so it goes back to empty
                next.delete(code);
            } else {
                next.add(code);
            }
            return next;
        });
        setCreditMap(prev => ({ ...prev, [code]: val === -1 ? 0 : val }));
    }, []);

    const handleConfirm = () => setStep('simulate');
    const handleEdit = () => {
        setStep('setup');
        // Keep the creditMap and touchedFields intact so user's values are preserved
    };

    // Build flat subject list with predicted/user credits
    const allSubjects: SubjectWithCredits[] = useMemo(() => {
        return semesters.flatMap(sem =>
            sem.subjects.map(sub => ({
                ...sub,
                semester: sem.semester,
                credits: creditMap[sub.subject_code] ?? predictCredits(sub.subject_code),
            }))
        );
    }, [semesters, creditMap]);

    if (semesters.length === 0 || semesters.every(s => s.subjects.length === 0)) return null;

    return (
        <details id="subject-drop-simulator" className="card overflow-hidden group" open={step === 'simulate'}>
            <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                <ChevronRight size={14} className="transition-transform group-open:rotate-90" style={{ color: 'var(--text-muted)' }} />
                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Subject Drop Simulator</p>
                {step === 'simulate' && (
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
                        LIVE
                    </span>
                )}
                {step === 'setup' && (
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
                        Setup
                    </span>
                )}
            </summary>

            <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                {step === 'setup' ? (
                    <SetupStep
                        semesters={semesters}
                        creditMap={creditMap}
                        touchedFields={touchedFields}
                        onCreditChange={handleCreditChange}
                        onConfirm={handleConfirm}
                        isPredicted={isPredicted}
                    />
                ) : (
                    <SimulatorStep
                        subjects={allSubjects}
                        officialCGPA={student.cgpa}
                        onEdit={handleEdit}
                    />
                )}
            </div>
        </details>
    );
}
