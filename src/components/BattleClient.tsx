"use client";

import { useState, useEffect } from "react";
import { type BattleData, type BattleSide, getBranchesByBatch } from "@/lib/data";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCollege, getApiUrl } from '@/components/CollegeProvider';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, Legend,
} from "recharts";
import { formatGrade } from "@/lib/utils";

const RANGE_ORDER = ["0-4", "4-5", "5-6", "6-7", "7-8", "8-9", "9-10"];

function sortDistribution(dist: { range: string; count: number }[]) {
    return [...dist].sort(
        (a, b) => RANGE_ORDER.indexOf(a.range) - RANGE_ORDER.indexOf(b.range)
    );
}

/* ── Stat comparison row ── */
function StatRow({
    label,
    aVal,
    bVal,
    format = "number",
    higherWins = true,
}: {
    label: string;
    aVal: number;
    bVal: number;
    format?: "number" | "cgpa";
    higherWins?: boolean;
}) {
    const aWins = higherWins ? aVal > bVal : aVal < bVal;
    const bWins = higherWins ? bVal > aVal : bVal < aVal;
    const fmt = (v: number) => (format === "cgpa" ? formatGrade(v, 2) : v.toLocaleString());

    return (
        <div className="grid grid-cols-3 items-center py-3 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="text-right pr-4">
                <span
                    className="font-bold text-lg tabular-nums"
                    style={{ color: aWins ? "var(--success)" : bWins ? "var(--text-muted)" : "var(--text-primary)" }}
                >
                    {fmt(aVal)}
                </span>
            </div>
            <div className="text-center">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    {label}
                </span>
            </div>
            <div className="text-left pl-4">
                <span
                    className="font-bold text-lg tabular-nums"
                    style={{ color: bWins ? "var(--success)" : aWins ? "var(--text-muted)" : "var(--text-primary)" }}
                >
                    {fmt(bVal)}
                </span>
            </div>
        </div>
    );
}

/* ── Distribution comparison chart ── */
function DistributionChart({ a, b }: { a: BattleSide; b: BattleSide }) {
    const aMap = Object.fromEntries(a.cgpaDistribution.map((d) => [d.range, d.count]));
    const bMap = Object.fromEntries(b.cgpaDistribution.map((d) => [d.range, d.count]));
    const chartData = RANGE_ORDER.map((range) => ({
        range: range.replace("-", "–"),
        [a.label]: aMap[range] || 0,
        [b.label]: bMap[range] || 0,
    }));

    return (
        <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={chartData} margin={{ top: 20, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="range" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px", color: "#f1f5f9" }} cursor={{ fill: "#334155", opacity: 0.4 }} />
                    <Legend />
                    <Bar dataKey={a.label} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={b.label} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

/* ── Winner banner ── */
function WinnerBanner({ a, b }: { a: BattleSide; b: BattleSide }) {
    // Score: who wins more metrics
    let aScore = 0, bScore = 0;
    if (a.averageCGPA > b.averageCGPA) aScore++; else if (b.averageCGPA > a.averageCGPA) bScore++;
    if (a.highestCGPA > b.highestCGPA) aScore++; else if (b.highestCGPA > a.highestCGPA) bScore++;
    if (a.topPerformerCount > b.topPerformerCount) aScore++; else if (b.topPerformerCount > a.topPerformerCount) bScore++;

    const winner = aScore > bScore ? a.label : bScore > aScore ? b.label : null;

    return (
        <div className="card p-6 text-center">
            {winner ? (
                <>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Winner</p>
                    <p className="text-3xl font-black" style={{ color: "var(--success)" }}>🏆 {winner}</p>
                    <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                        Wins {Math.max(aScore, bScore)} out of 3 key metrics
                    </p>
                </>
            ) : (
                <>
                    <p className="text-3xl font-black" style={{ color: "var(--accent)" }}>🤝 It&apos;s a Tie!</p>
                    <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Both sides are evenly matched</p>
                </>
            )}
        </div>
    );
}

/* ── Main component ── */
const DEFAULT_YEARS = ["2025", "2024", "2023", "2022"];
const DEFAULT_BRANCHES = getBranchesByBatch("2025");

export default function BattleClient() {
    const [battleType, setBattleType] = useState<"branch" | "year">("branch");
    const [sideA, setSideA] = useState("");
    const [sideB, setSideB] = useState("");
    const [result, setResult] = useState<BattleData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { college } = useCollege();
    const [years, setYears] = useState(DEFAULT_YEARS);
    const [branches, setBranches] = useState(DEFAULT_BRANCHES);

    // Re-fetch filter options when college changes
    useEffect(() => {
        const base = getApiUrl(college);
        fetch(`${base}/filter/options`)
            .then(r => r.ok ? r.json() : null)
            .then(json => {
                if (json?.success && json.data) {
                    if (json.data.years?.length) setYears(json.data.years);
                    if (json.data.branches?.length) setBranches(json.data.branches);
                }
            })
            .catch(() => {});
        // Reset selections on college change
        setSideA("");
        setSideB("");
        setResult(null);
        setError("");
    }, [college]);

    const options = battleType === "branch" ? branches : years;

    const handleBattle = async () => {
        if (!sideA || !sideB) { setError("Select both sides"); return; }
        if (sideA === sideB) { setError("Pick two different options"); return; }
        setError("");
        setLoading(true);
        setResult(null);
        try {
            const params = new URLSearchParams({ type: battleType, a: sideA, b: sideB });
            const res = await fetch(`${getApiUrl(college)}/stats/battle?${params}`);
            if (!res.ok) throw new Error("Battle API failed");
            const json = await res.json();
            if (!json.success) throw new Error(json.message || "Battle failed");
            setResult(json.data);
        } catch {
            setError("Failed to fetch battle data. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
            {/* Back link */}
            <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm group"
                style={{ color: 'var(--text-secondary)' }}
            >
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                Back to results
            </Link>

            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                    Battle Arena
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    Compare two branches or graduation years head-to-head
                </p>
            </div>

            {/* Controls */}
            <div className="card p-6 space-y-5">
                {/* Type toggle */}
                <div className="flex gap-2">
                    {(["branch", "year"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => { setBattleType(t); setSideA(""); setSideB(""); setResult(null); setError(""); }}
                            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                            style={{
                                backgroundColor: battleType === t ? "var(--accent)" : "var(--card-bg)",
                                color: battleType === t ? "#fff" : "var(--text-secondary)",
                                border: `1px solid ${battleType === t ? "var(--accent)" : "var(--border)"}`,
                            }}
                        >
                            {t === "branch" ? "Branch Battle" : "Year Battle"}
                        </button>
                    ))}
                </div>

                {/* Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-muted)" }}>
                            {battleType === "branch" ? "Branch A" : "Year A"}
                        </label>
                        <select
                            value={sideA}
                            onChange={(e) => setSideA(e.target.value)}
                            className="w-full rounded-lg px-3 py-2.5 text-sm font-medium"
                            style={{ backgroundColor: "var(--background)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                        >
                            <option value="">Select…</option>
                            {options.map((o) => (
                                <option key={o} value={o}>{o}</option>
                            ))}
                        </select>
                    </div>

                    <div className="hidden sm:flex items-center justify-center">
                        <span className="text-2xl font-black" style={{ color: "var(--text-muted)" }}>VS</span>
                    </div>

                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-muted)" }}>
                            {battleType === "branch" ? "Branch B" : "Year B"}
                        </label>
                        <select
                            value={sideB}
                            onChange={(e) => setSideB(e.target.value)}
                            className="w-full rounded-lg px-3 py-2.5 text-sm font-medium"
                            style={{ backgroundColor: "var(--background)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                        >
                            <option value="">Select…</option>
                            {options.map((o) => (
                                <option key={o} value={o}>{o}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && <p className="text-sm font-medium" style={{ color: "var(--danger, #ef4444)" }}>{error}</p>}

                <button
                    onClick={handleBattle}
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200"
                    style={{
                        backgroundColor: loading ? "var(--border)" : "var(--accent)",
                        color: "#fff",
                        opacity: loading ? 0.7 : 1,
                    }}
                >
                    {loading ? "Loading…" : "Start Battle"}
                </button>
            </div>

            {/* Results */}
            {result && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* VS header */}
                    <div className="grid grid-cols-3 items-center">
                        <div className="text-center">
                            <p className="text-2xl font-black" style={{ color: "#3b82f6" }}>{result.a.label}</p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{result.a.totalStudents} students</p>
                        </div>
                        <div className="text-center">
                            <span className="text-3xl font-black" style={{ color: "var(--text-muted)" }}>VS</span>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-black" style={{ color: "#f59e0b" }}>{result.b.label}</p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{result.b.totalStudents} students</p>
                        </div>
                    </div>

                    {/* Winner */}
                    <WinnerBanner a={result.a} b={result.b} />

                    {/* Stat rows */}
                    <div className="card p-6">
                        <p className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Head-to-Head Stats</p>
                        <StatRow label="Avg CGPA" aVal={result.a.averageCGPA} bVal={result.b.averageCGPA} format="cgpa" />
                        <StatRow label="Highest CGPA" aVal={result.a.highestCGPA} bVal={result.b.highestCGPA} format="cgpa" />
                        <StatRow label="Lowest CGPA" aVal={result.a.lowestCGPA} bVal={result.b.lowestCGPA} format="cgpa" higherWins={false} />
                        <StatRow label="Total Students" aVal={result.a.totalStudents} bVal={result.b.totalStudents} />
                        <StatRow label="Top Performers" aVal={result.a.topPerformerCount} bVal={result.b.topPerformerCount} />
                    </div>

                    {/* Distribution chart */}
                    <div className="card p-6">
                        <div className="mb-4">
                            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>CGPA Distribution Comparison</p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Number of students per CGPA range</p>
                        </div>
                        <DistributionChart a={result.a} b={result.b} />
                    </div>
                </div>
            )}
        </div>
    );
}
