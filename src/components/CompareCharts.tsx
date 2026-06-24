"use client";

import { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    Cell,
} from 'recharts';
import { Student } from '@/lib/data';
import { formatGrade } from '@/lib/utils';

interface CompareChartsProps {
    students: Student[];
}

// A vibrant, accessible color palette for up to 10 students
const CHART_COLORS = [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#f97316', // orange-500
    '#6366f1', // indigo-500
    '#14b8a6', // teal-500
];

export function CompareCharts({ students }: CompareChartsProps) {
    if (!students || students.length === 0) return null;

    // 1. Prepare Data for CGPA Comparison Bar Chart
    const cgpaData = useMemo(() => {
        return students.map((stu) => ({
            name: stu.name.split(' ')[0], // Use first name for brevity
            fullName: stu.name,
            rollNo: stu.rollNo,
            cgpa: stu.cgpa,
        }));
    }, [students]);

    // 2. Prepare Data for Semester Trend Line Chart
    // We need to merge all semesters together. e.g. { semester: "1", "Rahul": 9.8, "Anjali": 9.4 }
    const trendData = useMemo(() => {
        // Find the maximum number of semesters any student has completed
        let maxSems = 0;
        students.forEach(s => {
            const sems = s.semesters || [];
            if (sems.length > maxSems) maxSems = sems.length;
        });

        const data = [];
        for (let i = 1; i <= maxSems; i++) {
            const dataPoint: any = { semester: `Sem ${i}` };
            students.forEach(s => {
                const sems = s.semesters || [];
                const semData = sems.find(sem => Number(sem.semester) === i);
                // Only plot if they actually have data for this semester
                if (semData) {
                    dataPoint[s.rollNo] = semData.sgpa;
                }
            });
            data.push(dataPoint);
        }
        return data;
    }, [students]);

    // Calculate Y-axis domain based on min/max CGPA/SGPA to make differences more visible
    const yDomain = useMemo(() => {
        let min = 10;
        let max = 0;

        // Check CGPAs
        students.forEach(s => {
            if (s.cgpa < min) min = s.cgpa;
            if (s.cgpa > max) max = s.cgpa;

            // Check SGPAs
            const sems = s.semesters || [];
            sems.forEach(sem => {
                if (sem.sgpa < min) min = sem.sgpa;
                if (sem.sgpa > max) max = sem.sgpa;
            });
        });

        // Add some padding and clamp between 0 and 10
        return [
            Math.max(0, Math.floor(min - 0.5)),
            Math.min(10, Math.ceil(max + 0.2))
        ];
    }, [students]);

    const CustomTooltipStyle = {
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E5E5',
        borderRadius: '0.75rem',
        color: '#1A1A1A',
        padding: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    };

    return (
        <div className="flex flex-col gap-8 w-full mt-8">
            {/* CGPA Bar Chart */}
            <div className="card p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <span className="w-1.5 h-6 rounded-full inline-block" style={{ backgroundColor: 'var(--accent)' }}></span>
                    Overall CGPA Race
                </h3>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={cgpaData}
                            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} opacity={0.8} />
                            <XAxis
                                dataKey="name"
                                stroke="#9B9B9B"
                                fontSize={13}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="#9B9B9B"
                                fontSize={13}
                                tickLine={false}
                                axisLine={false}
                                dx={-10}
                                domain={yDomain}
                                tickFormatter={(val) => formatGrade(val, 1)}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(232, 100, 26, 0.05)' }}
                                contentStyle={CustomTooltipStyle}
                                formatter={(value: any) => [`${formatGrade(Number(value), 2)} CGPA`, 'Score']}
                                labelStyle={{ color: '#6B6B6B', marginBottom: '8px', fontWeight: 'bold' }}
                            />
                            <Bar
                                dataKey="cgpa"
                                radius={[6, 6, 0, 0]}
                                barSize={40}
                            // Fill color applied via Cell in a full mapping, or just dynamic fill prop
                            // We use a little trick here to map colors based on index
                            >
                                {cgpaData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* SGPA Trend Line Chart */}
            <div className="card p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <span className="w-1.5 h-6 rounded-full inline-block" style={{ backgroundColor: 'var(--success)' }}></span>
                    Semester Performance Timeline
                </h3>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={trendData}
                            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} opacity={0.8} />
                            <XAxis
                                dataKey="semester"
                                stroke="#9B9B9B"
                                fontSize={13}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="#9B9B9B"
                                fontSize={13}
                                tickLine={false}
                                axisLine={false}
                                dx={-10}
                                domain={yDomain}
                                tickFormatter={(val) => formatGrade(val, 1)}
                            />
                            <Tooltip
                                contentStyle={CustomTooltipStyle}
                                formatter={(value: any, name: any) => {
                                    // Match roll number back to name for the tooltip
                                    const student = students.find(s => s.rollNo === String(name));
                                    return [`${formatGrade(Number(value), 2)} SGPA`, student ? student.name.split(' ')[0] : String(name)];
                                }}
                                labelStyle={{ color: '#6B6B6B', marginBottom: '8px', fontWeight: 'bold' }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                wrapperStyle={{ paddingTop: '20px' }}
                                formatter={(value, entry, index) => {
                                    const student = students.find(s => s.rollNo === value);
                                    return <span style={{ color: '#1A1A1A', fontWeight: 500 }}>{student ? student.name.split(' ')[0] : value}</span>;
                                }}
                            />

                            {students.map((stu, index) => (
                                <Line
                                    key={stu.rollNo}
                                    type="monotone"
                                    dataKey={stu.rollNo}
                                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: CHART_COLORS[index % CHART_COLORS.length], strokeWidth: 2, stroke: '#FFFFFF' }}
                                    activeDot={{ r: 7, strokeWidth: 0 }}
                                    connectNulls={true}
                                    animationDuration={1500}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
}
