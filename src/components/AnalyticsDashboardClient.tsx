"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DeptBarChart, HistogramChart } from "@/components/Charts";
import {
    GradeDistributionChart,
    YearlyTrendChart,
    TopPerformersByBranchChart,
} from "@/components/AnalyticsCharts";
import { useCollege } from "@/components/CollegeProvider";
import { fetchStats } from "@/lib/data";
import { formatGrade } from "@/lib/utils";

interface YearData {
    overall: {
        totalStudents: number;
        averageCGPA: number;
        highestCGPA: number;
        lowestCGPA: number;
    };
    departmentStats: {
        year: string;
        departmentCode: string;
        Name: string;
        AverageCGPA: number;
        highestCGPA: number;
        lowestCGPA: number;
        medianCGPA: number;
        branchSize: number;
        modeCGPA: number;
    }[];
    cgpaDistribution: { range: string; count: number }[];
    top10Students: {
        rollNo: string;
        name: string;
        branch_code: string;
        year_of_study: string;
        cgpa: number;
        rank: number;
        percentile: number;
    }[];
    semesterAverages: {
        semester: string;
        averageSGPA: number;
        studentCount: number;
    }[];
    gradeDistribution: Record<string, number>;
    topPerformersByBranch?: { branch: string; count: number }[];
}

export type MultiYearStats = Record<string, YearData>;

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="card p-5">
            <p className="section-label mb-2">{label}</p>
            <p className="stat-number">{value}</p>
            {sub && <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{sub}</p>}
        </div>
    );
}

function ChartCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
    return (
        <div className="card p-6">
            <div className="mb-4">
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{title}</p>
                {sub && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>}
            </div>
            {children}
        </div>
    );
}

const medalBorderColors = ["#F59E0B", "#9B9B9B", "#B08D57"];

export default function AnalyticsDashboardClient() {
    const { college } = useCollege();
    const [data, setData] = useState<MultiYearStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState<string>("");

    useEffect(() => {
        setLoading(true);
        fetchStats(college)
            .then((stats) => {
                setData(stats);
                const years = Object.keys(stats).sort((a, b) => Number(b) - Number(a));
                setSelectedYear(years[0] || "2025");
            })
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [college]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 w-48 rounded" style={{ backgroundColor: 'var(--surface-elevated)' }} />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-lg" style={{ backgroundColor: 'var(--surface-elevated)' }} />)}
                    </div>
                    <div className="h-64 rounded-lg" style={{ backgroundColor: 'var(--surface-elevated)' }} />
                </div>
            </div>
        );
    }

    if (!data) return null;

    const years = Object.keys(data).sort((a, b) => Number(b) - Number(a));
    const yearData = data[selectedYear];
    if (!yearData) return null;

    const { overall, departmentStats: departments, cgpaDistribution, top10Students: top10, semesterAverages, gradeDistribution, topPerformersByBranch } = yearData;

    const topBranch = [...departments]
        .sort((a, b) => b.AverageCGPA - a.AverageCGPA)[0];

    // Dept bar data
    const deptBarData = departments
        .filter((d) => d.AverageCGPA > 0)
        .sort((a, b) => b.AverageCGPA - a.AverageCGPA)
        .slice(0, 20)
        .map((d) => ({
            name: d.departmentCode,
            avg: parseFloat(formatGrade(d.AverageCGPA || 0, 2)),
            max: parseFloat(formatGrade(d.highestCGPA || 0, 2)),
        }));

    // CGPA histogram from cgpaDistribution array
    const histogramColors: Record<string, string> = {
        "0-4": "#EF4444",
        "4-5": "#F97316",
        "5-6": "#F59E0B",
        "6-7": "#EAB308",
        "7-8": "#84CC16",
        "8-9": "#22C55E",
        "9-10": "#16A34A",
    };
    const histogramData = (cgpaDistribution || []).map((d) => ({
        range: d.range.replace("-", "–"),
        count: d.count,
        color: histogramColors[d.range] || "#3b82f6",
    }));

    // Yearly trend from all years
    const yearlyTrendData = years
        .sort((a, b) => Number(a) - Number(b))
        .map((y) => ({
            year: y,
            averageCGPA: data[y].overall.averageCGPA,
        }));

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            {/* Page heading */}
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                    University Analytics
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    Performance metrics, grade distributions, and department comparisons across all batches
                </p>
            </div>

            {/* Year Tabs */}
            <div className="flex gap-2 flex-wrap">
                {years.map((year) => (
                    <button
                        key={year}
                        onClick={() => setSelectedYear(year)}
                        className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                        style={{
                            backgroundColor: selectedYear === year ? "var(--accent)" : "var(--card-bg)",
                            color: selectedYear === year ? "#fff" : "var(--text-secondary)",
                            border: `1px solid ${selectedYear === year ? "var(--accent)" : "var(--border)"}`,
                        }}
                    >
                        Batch {year}
                    </button>
                ))}
            </div>

            {/* KPI bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <KpiCard label="Total Students" value={overall.totalStudents.toLocaleString()} />
                <KpiCard label="Average CGPA" value={formatGrade(overall.averageCGPA, 2)} sub={`Batch ${selectedYear}`} />
                <KpiCard label="Highest CGPA" value={formatGrade(overall.highestCGPA, 2)} />
                <KpiCard
                    label="Top Department"
                    value={topBranch?.departmentCode || "—"}
                    sub={topBranch ? `Avg ${formatGrade(topBranch.AverageCGPA, 2)}` : undefined}
                />
            </div>

            {/* Two charts side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="CGPA Distribution" sub="Number of students per CGPA range">
                    <HistogramChart data={histogramData} />
                </ChartCard>
                <ChartCard title="Historical CGPA Trend" sub="Average CGPA across graduation years">
                    <YearlyTrendChart data={yearlyTrendData} />
                </ChartCard>
            </div>

            {/* Department bar chart */}
            {deptBarData.length > 0 && (
                <ChartCard
                    title={`Department Performance — ${selectedYear}`}
                    sub="Average and highest CGPA by department (sorted by avg CGPA)"
                >
                    <DeptBarChart data={deptBarData} />
                </ChartCard>
            )}

            {/* Top performers by branch + Grade distribution side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {topPerformersByBranch && topPerformersByBranch.length > 0 && (
                    <ChartCard title={`Top Performers by Branch — ${selectedYear}`} sub="Students with CGPA ≥ 8.50 per department">
                        <TopPerformersByBranchChart data={topPerformersByBranch} />
                    </ChartCard>
                )}
                {gradeDistribution && (
                    <ChartCard title="Grade Distribution" sub="Volume of letter grades awarded across all students">
                        <GradeDistributionChart data={gradeDistribution} />
                    </ChartCard>
                )}
            </div>

            {/* Top 10 table */}
            {top10.length > 0 && (
                <div className="card overflow-hidden">
                    <div
                        className="px-5 py-3 border-b flex items-center justify-between"
                        style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
                    >
                        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                            🏆 Top 10 Students — Batch {selectedYear}
                        </p>
                        <Link href="/" className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                            View full rankings →
                        </Link>
                    </div>
                    <table className="w-full data-table">
                        <thead>
                            <tr>
                                <th className="text-left w-16">Rank</th>
                                <th className="text-left">Name</th>
                                <th className="text-left">Roll No</th>
                                <th className="text-left w-20">Branch</th>
                                <th className="text-right w-24">CGPA</th>
                            </tr>
                        </thead>
                        <tbody>
                            {top10.map((student, i) => {
                                const rank = i + 1;
                                const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
                                return (
                                    <tr
                                        key={student.rollNo}
                                        className="group"
                                        style={rank <= 3 ? { borderLeft: `3px solid ${medalBorderColors[rank - 1]}` } : {}}
                                    >
                                        <td>
                                            <span className="flex items-center gap-1.5">
                                                {medal && <span>{medal}</span>}
                                                <span className="mono" style={{ color: "var(--text-muted)" }}>#{rank}</span>
                                            </span>
                                        </td>
                                        <td>
                                            <Link href={`/student/${student.rollNo}`} className="font-medium group-hover:underline" style={{ color: "var(--text-primary)", textDecorationColor: "var(--accent)" }}>
                                                {student.name}
                                            </Link>
                                        </td>
                                        <td><span className="mono" style={{ color: "var(--text-secondary)" }}>{student.rollNo}</span></td>
                                        <td><span className="badge badge-neutral">{student.branch_code}</span></td>
                                        <td className="text-right">
                                            <span className="font-black" style={{ color: "var(--success)" }}>{formatGrade(student.cgpa, 2)}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Dept full table */}
            {departments.length > 0 && (
                <div className="card overflow-hidden">
                    <div
                        className="px-5 py-3 border-b"
                        style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
                    >
                        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                            Department Breakdown — {selectedYear}
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full data-table">
                            <thead>
                                <tr>
                                    <th className="text-left">Department</th>
                                    <th className="text-right">Students</th>
                                    <th className="text-right">Avg CGPA</th>
                                    <th className="text-right">Highest</th>
                                    <th className="text-right">Lowest</th>
                                    <th className="text-right">Median</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...departments]
                                    .sort((a, b) => b.AverageCGPA - a.AverageCGPA)
                                    .map((dept) => (
                                        <tr key={dept.departmentCode}>
                                            <td>
                                                <div>
                                                    <span className="font-medium mono text-sm" style={{ color: "var(--text-primary)" }}>{dept.departmentCode}</span>
                                                    <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>{dept.Name}</span>
                                                </div>
                                            </td>
                                            <td className="text-right mono" style={{ color: "var(--text-secondary)" }}>{dept.branchSize}</td>
                                            <td className="text-right font-semibold" style={{ color: "var(--accent)" }}>{dept.AverageCGPA ? formatGrade(dept.AverageCGPA, 2) : ''}</td>
                                            <td className="text-right" style={{ color: "var(--success)" }}>{dept.highestCGPA ? formatGrade(dept.highestCGPA, 2) : ''}</td>
                                            <td className="text-right" style={{ color: "var(--danger)" }}>{dept.lowestCGPA ? formatGrade(dept.lowestCGPA, 2) : ''}</td>
                                            <td className="text-right mono" style={{ color: "var(--text-secondary)" }}>{dept.medianCGPA ? formatGrade(dept.medianCGPA, 2) : ''}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
