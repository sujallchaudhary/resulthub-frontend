export interface Student {
    rollNo: string;
    name: string;
    branch_code: string;
    cgpa: number;
    rank: number;
    credits_completed: number;
    percentile: number;
    year_of_study: string;
    branch_rank: number;
    overall_rank?: number;
    filtered_rank?: number;
    profile_views?: number;
    semesters?: Sgpa[];
}

export interface Score {
    subject_code: string;
    grade: string;
    marks: number | string;   // API returns both numeric and string values
    semester?: number | string;
}

export interface Sgpa {
    semester: number | string;  // API returns semester as string e.g. "1"
    sgpa: number;
    credits_registered: number | string;
    credits_secured: number | string;
    subjects?: Score[];
}

export interface Department {
    year: string;
    departmentCode: string;
    Name: string;
    AverageCGPA: number;
    highestCGPA: number;
    lowestCGPA: number;
    medianCGPA: number;
    modeCGPA: number;
    branchSize: number;
}

export interface SubjectAnalytics {
    subject_code: string;
    total_students: number;
    avg_marks: number;
    median_marks: number;
    highest_marks: number;
    lowest_marks: number;
    std_dev: number;
    pass_percentage: number;
    fail_percentage: number;
    difficulty: 'Hard' | 'Medium' | 'Easy';
    is_killer: boolean;
    low_grade_percentage: number;
    grade_distribution: Record<string, number>;
    grade_distribution_pct: Record<string, number>;
    marks_histogram: { range: string; count: number }[];
    branch_breakdown: { branch_code: string; total_students: number; avg_marks: number; low_grade_percentage: number }[];
    semester_breakdown: { semester: number | string; total_students: number; avg_marks: number }[];
    year_breakdown: { year_of_study: string; total_students: number; avg_marks: number; low_grade_percentage: number }[];
    top_scorers: { roll_no: string; marks: number; grade: string; branch_code: string }[];
    comparison: {
        overall_avg_marks_all_subjects: number;
        difference_from_overall: number;
        harder_than_percentage: number;
    };
    verdict: { label: string; reason: string };
}

export interface TwinData {
    rollNo: string;
    name: string;
    branch_code: string;
    year_of_study: string;
    cgpa: number;
    matchPercentage: number;
    sameDepartment: boolean;
    sameYear: boolean;
    commonSubjectsCount: number;
    commonSemestersCount: number;
    similarity: {
        sgpa: number;
        subjects: number;
        cgpa: number;
        subjectOverlap: number;
        gradeDistribution: number;
    };
    sharedStrongSubjects: string[];
    sharedWeakSubjects: string[];
    sgpaTrend: number[];
}

export interface TwinsResponseData {
    student: {
        rollNo: string;
        name: string;
        branch_code: string;
        year_of_study: string;
        cgpa: number;
    };
    twins: TwinData[];
    poolStats: {
        totalCompared: number;
        sameDepartment: number;
        otherDepartment: number;
        sameYear: number;
        differentYear: number;
    };
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    message: string;
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface WrappedSubject {
    subject_code: string;
    grade: string;
    marks: string | number;
    percentile?: number;
    total_students?: number;
}

export interface WrappedData {
    rollNo: string;
    name: string;
    branch_code: string;
    year_of_study: string;
    semester: number;
    subjects_count: number;
    best_grade: WrappedSubject;
    toughest_subject: WrappedSubject;
    sgpa: number;
    sgpa_change: number;
    sgpa_trend: 'UP' | 'DOWN' | 'STABLE';
    batch_percentile: number;
    academic_personality: string;
    personality_emoji: string;
    top_subjects: WrappedSubject[];
    bottom_subjects: WrappedSubject[];
    subject_rankings: WrappedSubject[];
    ai_narrative: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.resulthubnsut.com/api';

function apiUrl(college: string = 'nsut'): string {
    return `${API_BASE_URL}/${college}`;
}

export const fetchStudents = async (page: number = 1, college: string = 'nsut'): Promise<PaginatedResponse<Student>> => {
    const res = await fetch(`${apiUrl(college)}/students?page=${page}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
};

export const fetchFilteredStudents = async (
    year: string,
    branch: string,
    page: number = 1,
    name?: string,
    college: string = 'nsut'
): Promise<PaginatedResponse<Student>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());

    if (year && year !== 'All') params.append('year', year);
    if (branch && branch !== 'All') params.append('branch', branch);
    if (name) params.append('name', name);

    const endpoint = (year === 'All' && branch === 'All' && !name) ? '/students' : '/filter';

    const res = await fetch(`${apiUrl(college)}${endpoint}?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch filtered students');
    return res.json();
};

export const fetchStudentProfile = async (rollNo: string, college: string = 'nsut'): Promise<Student | null> => {
    const res = await fetch(`${apiUrl(college)}/students/${rollNo}`, { cache: 'no-store' });
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Failed to fetch student profile');
    }
    const json = await res.json();
    return json.data;
};

// Increments a student's profile view counter; returns the updated count or null on failure.
export const recordProfileView = async (rollNo: string, college: string = 'nsut'): Promise<number | null> => {
    try {
        const res = await fetch(`${apiUrl(college)}/students/${rollNo}/view`, { method: 'POST' });
        if (!res.ok) return null;
        const json = await res.json();
        return json?.data?.profile_views ?? null;
    } catch {
        return null;
    }
};

// Server-side lookup for <title> generation: tries the given college first, then the
// others, with cached responses so metadata fetches don't hammer the API.
export const fetchStudentForMetadata = async (rollNo: string, college?: string): Promise<Student | null> => {
    const colleges = ['nsut', 'dtu', 'igdtuw'];
    const order = college && colleges.includes(college)
        ? [college, ...colleges.filter((c) => c !== college)]
        : colleges;

    for (const c of order) {
        try {
            const res = await fetch(`${apiUrl(c)}/students/${rollNo}`, { next: { revalidate: 3600 } });
            if (!res.ok) continue;
            const json = await res.json();
            if (json?.data?.name) return json.data;
        } catch {
            // API unreachable — fall through to the next college
        }
    }
    return null;
};

export const fetchStats = async (college: string = 'nsut') => {
    const res = await fetch(`${apiUrl(college)}/stats`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('Failed to fetch stats');
    const json = await res.json();
    return json.data;
};

export const fetchSubjectAnalytics = async (code: string, college: string = 'nsut'): Promise<SubjectAnalytics | null> => {
    const res = await fetch(`${apiUrl(college)}/subjects/${encodeURIComponent(code.trim())}/analytics`, { cache: 'no-store' });
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Failed to fetch subject analytics');
    }
    const json = await res.json();
    return json.data;
};

export const fetchSubjectCodes = async (college: string = 'nsut'): Promise<string[]> => {
    try {
        const res = await fetch(`${apiUrl(college)}/subjects/codes`, { next: { revalidate: 3600 } });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data ?? [];
    } catch {
        return [];
    }
};

export const fetchAcademicTwins = async (rollNo: string, limit: number = 5, college: string = 'nsut'): Promise<TwinsResponseData | null> => {
    const res = await fetch(`${apiUrl(college)}/students/${rollNo}/twins?limit=${limit}`);
    if (!res.ok) {
        if (res.status === 404 || res.status === 429) return null;
        throw new Error('Failed to fetch academic twins');
    }
    const json = await res.json();
    return json.data;
};

// Known NSUT branches — used as fallback since /api/filter/options doesn't exist yet
const KNOWN_BRANCHES = [
    'UBT', 'UCA', 'UCB', 'UCD', 'UCE', 'UCG', 'UCI', 'UCM', 'UCO', 'UCS',
    'UEA', 'UEC', 'UEE', 'UEI', 'UEV', 'UGI', 'UIC', 'UII', 'UIN', 'UIT',
    'UME', 'UMP', 'UMV',
];
const KNOWN_YEARS = ['2025', '2024', '2023', '2022'];

// Fetch available filter options (years & branches) from the API
export const fetchFilterOptions = async (college: string = 'nsut'): Promise<{ years: string[]; branches: string[] }> => {
    try {
        const res = await fetch(`${apiUrl(college)}/filter/options`, { next: { revalidate: 3600 } });
        if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
                return {
                    years: json.data.years?.length ? json.data.years : KNOWN_YEARS,
                    branches: json.data.branches?.length ? json.data.branches : KNOWN_BRANCHES,
                };
            }
        }
    } catch (e) {
        // Silently fall back below
    }
    // Always fall back to known lists so the UI is never empty
    return { years: KNOWN_YEARS, branches: KNOWN_BRANCHES };
};

export const getAllBatches = (): string[] => {
    return ['2025', '2024', '2023', '2022', '2021', '2020'];
};

export const getBranchesByBatch = (batchYear: string): string[] => {
    return [
        'UBT', 'UCA', 'UCB', 'UCD', 'UCE', 'UCG', 'UCI', 'UCM', 'UCO', 'UCS',
        'UEA', 'UEC', 'UEE', 'UEI', 'UEV', 'UGI', 'UIC', 'UII', 'UIN', 'UIT',
        'UME', 'UMP', 'UMV'
    ];
};

export const fetchWrapped = async (rollNo: string, semester: number, college: string = 'nsut'): Promise<WrappedData | null> => {
    const res = await fetch(`${apiUrl(college)}/wrapped/${rollNo.trim().toUpperCase()}/${semester}`, { cache: 'no-store' });
    if (!res.ok) {
        if (res.status === 404 || res.status === 429) return null;
        throw new Error('Failed to fetch wrapped data');
    }
    const json = await res.json();
    return json.data;
};

export interface BattleSide {
    label: string;
    totalStudents: number;
    averageCGPA: number;
    highestCGPA: number;
    lowestCGPA: number;
    topPerformerCount: number;
    cgpaDistribution: { range: string; count: number }[];
}

export interface BattleData {
    type: 'branch' | 'year';
    a: BattleSide;
    b: BattleSide;
}

export const fetchBattle = async (type: 'branch' | 'year', a: string, b: string, college: string = 'nsut'): Promise<BattleData | null> => {
    const params = new URLSearchParams({ type, a, b });
    const res = await fetch(`${apiUrl(college)}/stats/battle?${params}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
};

