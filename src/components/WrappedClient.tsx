"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchWrapped, WrappedData } from '@/lib/data';
import { ChevronRight, ChevronLeft, X, Loader2, Sparkles } from 'lucide-react';
import { useCollege, COLLEGE_LABELS } from '@/components/CollegeProvider';
import { formatGrade } from '@/lib/utils';
import { RollNoPrompt } from '@/components/RollNoPrompt';

// ── Slide 1: Intro ────────────────────────────────────────
function Slide1({ data }: { data: WrappedData }) {
    return (
        <div className="wrapped-slide items-center justify-center text-center px-8" style={{ backgroundColor: 'var(--background)' }}>
            <div className="space-y-6 animate-in fade-in duration-700">
                <div className="text-7xl animate-bounce" style={{ animationDuration: '2s' }}>
                    {data.personality_emoji}
                </div>
                <div>
                    <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
                        Your Semester {data.semester} Wrapped
                    </p>
                    <h2 className="text-4xl sm:text-5xl font-black leading-tight" style={{ color: 'var(--text-primary)' }}>
                        {data.name.split(' ')[0]}
                    </h2>
                    <p className="text-lg mt-1" style={{ color: 'var(--text-secondary)' }}>{data.name}</p>
                </div>
                <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                    style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                >
                    {data.branch_code} • {data.year_of_study}
                </div>
                <p className="text-sm mt-8" style={{ color: 'var(--text-muted)' }}>
                    Tap to begin →
                </p>
            </div>
        </div>
    );
}

// ── Slide 2: SGPA Reveal ──────────────────────────────────
function Slide2({ data }: { data: WrappedData }) {
    const trendColor = data.sgpa_trend === 'UP' ? 'var(--success)' : data.sgpa_trend === 'DOWN' ? 'var(--danger)' : 'var(--text-muted)';
    const trendLabel = data.sgpa_trend === 'UP' ? '↑' : data.sgpa_trend === 'DOWN' ? '↓' : '→';
    return (
        <div className="wrapped-slide items-center justify-center px-8 text-center" style={{ backgroundColor: 'var(--background)' }}>
            {/* Decorative arc */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15"
                    style={{
                        width: '70vw', height: '70vw',
                        border: '2px solid var(--accent)',
                        maxWidth: '400px', maxHeight: '400px',
                    }}
                />
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-5"
                    style={{
                        width: '90vw', height: '90vw',
                        border: '2px solid var(--accent)',
                        maxWidth: '500px', maxHeight: '500px',
                    }}
                />
            </div>

            <div className="relative space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <p className="text-sm font-semibold tracking-[0.1em] uppercase" style={{ color: 'var(--text-muted)' }}>
                    Your SGPA this semester
                </p>
                <div className="font-black leading-none" style={{ color: 'var(--accent)', fontSize: 'clamp(5rem, 20vw, 8rem)' }}>
                    {formatGrade(data.sgpa ?? 0, 2)}
                </div>
                <div className="space-y-2">
                    <p className="text-xl font-semibold" style={{ color: trendColor }}>
                        {trendLabel} {(data.sgpa_change ?? 0) !== 0 ? `${(data.sgpa_change ?? 0) > 0 ? '+' : ''}${formatGrade(data.sgpa_change ?? 0, 2)} from last semester` : 'Same as last semester'}
                    </p>
                    <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
                        Better than <strong style={{ color: 'var(--accent)' }}>{(data.batch_percentile ?? 0).toFixed(1)}%</strong> of your batch
                    </p>
                </div>
            </div>
        </div>
    );
}

// ── Slide 3: Star Subject ─────────────────────────────────
function Slide3({ data }: { data: WrappedData }) {
    const best = data.best_grade;
    return (
        <div className="wrapped-slide items-center justify-center px-8 text-center" style={{ backgroundColor: 'var(--background)' }}>
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <p className="text-sm font-semibold tracking-[0.1em] uppercase" style={{ color: 'var(--text-muted)' }}>
                    You absolutely crushed it in
                </p>
                <p className="mono font-black text-3xl sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
                    {best.subject_code}
                </p>
                <div
                    className="font-black leading-none"
                    style={{ color: 'var(--success)', fontSize: 'clamp(5rem, 20vw, 8rem)' }}
                >
                    {best.grade}
                </div>
                {best.marks !== undefined && (
                    <p className="text-xl font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        {best.marks}
                        {best.percentile != null && (
                            <span> • {best.percentile.toFixed(0)}th percentile</span>
                        )}
                    </p>
                )}
                {best.total_students && (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Out of {best.total_students.toLocaleString()} students
                    </p>
                )}
            </div>
        </div>
    );
}

// ── Slide 4: Toughest Subject ─────────────────────────────
function Slide4({ data }: { data: WrappedData }) {
    const tough = data.toughest_subject;
    return (
        <div className="wrapped-slide items-center justify-center px-8 text-center" style={{ backgroundColor: 'var(--background)' }}>
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <p className="text-sm font-semibold tracking-[0.1em] uppercase" style={{ color: 'var(--text-muted)' }}>
                    Your toughest battle
                </p>
                <p className="mono font-black text-3xl sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
                    {tough.subject_code}
                </p>
                <div
                    className="font-black leading-none"
                    style={{ color: 'var(--danger)', fontSize: 'clamp(4rem, 18vw, 7rem)' }}
                >
                    {tough.grade}
                </div>
                {tough.marks !== undefined && (
                    <p className="text-xl font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        {tough.marks}
                    </p>
                )}
                <p className="text-base italic" style={{ color: 'var(--text-muted)' }}>
                    "It pushed you — and you pushed back."
                </p>
                {tough.percentile != null && (
                    <div className="mt-2">
                        <div className="w-48 h-1 rounded-full mx-auto overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                            <div className="h-full rounded-full" style={{ width: `${tough.percentile}%`, backgroundColor: 'var(--warning)' }} />
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{tough.percentile.toFixed(0)}th percentile</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Slide 5: Subject Rankings ─────────────────────────────
function Slide5({ data }: { data: WrappedData }) {
    const rankings = data.subject_rankings.slice(0, 7);
    return (
        <div className="wrapped-slide justify-center px-6 py-16" style={{ backgroundColor: 'var(--background)' }}>
            <div className="max-w-sm mx-auto w-full">
                <p className="text-sm font-semibold tracking-[0.1em] uppercase mb-6 text-center" style={{ color: 'var(--text-muted)' }}>
                    Your subject leaderboard
                </p>
                <div className="space-y-3">
                    {rankings.map((s, i) => (
                        <div key={s.subject_code} className="flex items-center gap-3 animate-in fade-in duration-500"
                            style={{ animationDelay: `${i * 80}ms` }}
                        >
                            <span className="mono text-xs font-bold w-20 shrink-0 truncate" style={{ color: 'var(--text-primary)' }}>
                                {s.subject_code}
                            </span>
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${s.percentile ?? 0}%`,
                                        backgroundColor: i < 3 ? 'var(--accent)' : 'var(--text-muted)',
                                        animationDelay: `${i * 100}ms`,
                                    }}
                                />
                            </div>
                            <span className="text-xs font-bold w-10 text-right shrink-0" style={{ color: i < 3 ? 'var(--accent)' : 'var(--text-muted)' }}>
                                {(s.percentile ?? 0).toFixed(0)}%
                            </span>
                            <span
                                className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0"
                                style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)', minWidth: '28px', textAlign: 'center' }}
                            >
                                {s.grade}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Slide 6: Personality + AI ─────────────────────────────
function Slide6({ data }: { data: WrappedData }) {
    const [copied, setCopied] = useState(false);
    const { college } = useCollege();

    const handleShare = () => {
        const url = `${window.location.origin}/wrapped/${data.rollNo}/${data.semester}`;
        const brandName = `ResultHub${COLLEGE_LABELS[college]}`;
        const msg = `${data.personality_emoji} I'm "${data.academic_personality}" with ${formatGrade(data.sgpa ?? 0, 2)} SGPA this semester!\n\nCheck out my Semester ${data.semester} Wrapped on ${brandName}:\n${url}`;
        navigator.clipboard.writeText(msg).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="wrapped-slide items-center justify-center px-8 text-center" style={{ backgroundColor: 'var(--background)' }}>
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 w-full max-w-md mx-auto">
                <div className="text-5xl">{data.personality_emoji}</div>
                <h2 className="text-3xl sm:text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
                    {data.academic_personality}
                </h2>
                {data.ai_narrative && (
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {data.ai_narrative}
                    </p>
                )}
                <div className="flex items-center justify-center gap-2 pt-2">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Semester {data.semester}
                    </span>
                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {data.branch_code}
                    </span>
                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {data.year_of_study}
                    </span>
                </div>
                <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all mt-2"
                    style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                >
                    {copied ? 'Copied! ✅' : 'Share your Wrapped'}
                </button>
            </div>
        </div>
    );
}

// ── Semester picker (shown after roll number is provided) ──
function SemesterPicker({ rollNo, onGenerate }: { rollNo: string; onGenerate: (semester: number) => void }) {
    const [semester, setSemester] = useState(1);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onGenerate(semester);
        setLoading(false);
    };

    return (
        <div className="max-w-lg mx-auto px-4 py-16 space-y-8">
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    Semester Wrapped
                </h1>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                    Generating for <span className="mono font-semibold" style={{ color: 'var(--accent)' }}>{rollNo}</span>
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="card p-5">
                    <label className="section-label block mb-3">Pick a Semester</label>
                    <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setSemester(s)}
                                className="w-10 h-10 rounded-lg text-sm font-bold border transition-all"
                                style={semester === s
                                    ? { backgroundColor: 'var(--accent)', color: 'white', border: '1px solid var(--accent)' }
                                    : { backgroundColor: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                                }
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all"
                    style={{ backgroundColor: loading ? '#E5B89A' : 'var(--accent)' }}
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {loading ? 'Generating your Wrapped…' : 'Generate My Wrapped'}
                </button>
            </form>
        </div>
    );
}

// ── Main Wrapped client ───────────────────────────────────
interface WrappedClientProps {
    initialRollNo?: string;
    initialSemester?: number;
}

export function WrappedClient({ initialRollNo, initialSemester }: WrappedClientProps = {}) {
    const [rollNo, setRollNo] = useState<string | null>(initialRollNo ?? null);
    const [data, setData] = useState<WrappedData | null>(null);
    const [slide, setSlide] = useState(0);
    const [error, setError] = useState('');
    const [generating, setGenerating] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { college } = useCollege();

    const TOTAL_SLIDES = 6;

    const handleGenerate = async (semester: number) => {
        if (!rollNo) return;
        setError('');
        setGenerating(true);
        try {
            const result = await fetchWrapped(rollNo, semester, college);
            if (!result) {
                setError('No Wrapped data found. Check your Roll No and semester.');
                return;
            }
            setData(result);
            setSlide(0);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    // Auto-fetch when opened via share link
    useEffect(() => {
        if (initialRollNo && initialSemester) {
            handleGenerate(initialSemester);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Tap navigation
    const handleTap = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const x = e.clientX;
        const w = e.currentTarget.offsetWidth;
        if (x < w / 2) {
            setSlide(s => Math.max(0, s - 1));
        } else {
            setSlide(s => Math.min(TOTAL_SLIDES - 1, s + 1));
        }
    }, []);

    // Touch swipe
    const touchStartX = useRef(0);
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 50) {
            if (dx < 0) setSlide(s => Math.min(TOTAL_SLIDES - 1, s + 1));
            else setSlide(s => Math.max(0, s - 1));
        }
    };

    // Loading state — show while auto-fetching or generating
    if (generating) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-32">
                <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Generating your Wrapped…
                </p>
            </div>
        );
    }

    // Gate: ask for roll number
    if (!rollNo && !data) {
        return (
            <RollNoPrompt
                title="Semester Wrapped"
                description="Your Spotify Wrapped — but make it academic. Enter your roll number to get started."
                buttonLabel="Continue"
                onSubmit={(roll) => setRollNo(roll)}
            />
        );
    }

    if (!data) {
        return (
            <div>
                <SemesterPicker rollNo={rollNo!} onGenerate={handleGenerate} />
                {error && (
                    <div className="max-w-lg mx-auto px-4 -mt-4">
                        <div className="card p-4 border-red-200" style={{ backgroundColor: 'var(--danger-bg)' }}>
                            <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const slides = [
        <Slide1 key={0} data={data} />,
        <Slide2 key={1} data={data} />,
        <Slide3 key={2} data={data} />,
        <Slide4 key={3} data={data} />,
        <Slide5 key={4} data={data} />,
        <Slide6 key={5} data={data} />,
    ];

    return (
        <div
            ref={containerRef}
            className="relative overflow-hidden select-none"
            style={{
                height: 'calc(100dvh - 80px)',
                backgroundColor: 'var(--background)',
                cursor: 'pointer',
            }}
            onClick={handleTap}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Top bar: progress + name + close */}
            <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-3 pb-2 flex items-center gap-3">
                <div className="flex-1 flex gap-1">
                    {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
                        <div
                            key={i}
                            className="flex-1 h-0.5 rounded-full transition-all duration-300"
                            style={{ backgroundColor: i <= slide ? 'var(--accent)' : 'var(--border)' }}
                        />
                    ))}
                </div>
                <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--text-muted)' }} onClick={e => e.stopPropagation()}>
                    {data.name.split(' ')[0]}
                </span>
                <button
                    className="p-1.5 rounded-full transition-colors shrink-0"
                    style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface-elevated)' }}
                    onClick={e => { e.stopPropagation(); setData(null); setSlide(0); }}
                >
                    <X size={14} />
                </button>
            </div>

            {/* Slide content */}
            <div
                key={slide}
                className="animate-in fade-in duration-300 h-full"
                style={{ display: 'flex', flexDirection: 'column' }}
            >
                {slides[slide]}
            </div>

            {/* Desktop nav arrows (non-tap) */}
            <div className="hidden sm:flex absolute bottom-6 left-1/2 -translate-x-1/2 gap-3 z-20" onClick={e => e.stopPropagation()}>
                <button
                    onClick={() => setSlide(s => Math.max(0, s - 1))}
                    disabled={slide === 0}
                    className="p-2 rounded-full transition-all"
                    style={{
                        backgroundColor: 'var(--surface-elevated)',
                        color: slide === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                        border: '1px solid var(--border)',
                    }}
                >
                    <ChevronLeft size={16} />
                </button>
                <span className="flex items-center text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {slide + 1} / {TOTAL_SLIDES}
                </span>
                <button
                    onClick={() => setSlide(s => Math.min(TOTAL_SLIDES - 1, s + 1))}
                    disabled={slide === TOTAL_SLIDES - 1}
                    className="p-2 rounded-full transition-all"
                    style={{
                        backgroundColor: 'var(--surface-elevated)',
                        color: slide === TOTAL_SLIDES - 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                        border: '1px solid var(--border)',
                    }}
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}
