'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type College = 'nsut' | 'dtu' | 'igdtuw';

export const COLLEGE_LABELS: Record<College, string> = {
  nsut: 'NSUT',
  dtu: 'DTU',
  igdtuw: 'IGDTUW',
};

// Per-college accent color palettes
const COLLEGE_THEMES: Record<College, { light: Record<string, string>; dark: Record<string, string> }> = {
  nsut: {
    light: { '--accent': '#0EA5E9', '--accent-hover': '#0284C7', '--accent-light': '#E0F2FE', '--accent-light-border': '#BAE6FD' },
    dark:  { '--accent': '#38BDF8', '--accent-hover': '#0EA5E9', '--accent-light': '#082F49', '--accent-light-border': '#0C4A6E' },
  },
  dtu: {
    light: { '--accent': '#6366F1', '--accent-hover': '#4F46E5', '--accent-light': '#EEF2FF', '--accent-light-border': '#C7D2FE' },
    dark:  { '--accent': '#818CF8', '--accent-hover': '#6366F1', '--accent-light': '#1E1B4B', '--accent-light-border': '#312E81' },
  },
  igdtuw: {
    light: { '--accent': '#10B981', '--accent-hover': '#059669', '--accent-light': '#ECFDF5', '--accent-light-border': '#A7F3D0' },
    dark:  { '--accent': '#34D399', '--accent-hover': '#10B981', '--accent-light': '#022C22', '--accent-light-border': '#064E3B' },
  },
};

interface CollegeContextType {
  college: College;
  setCollege: (college: College) => void;
  collegeLabel: string;
  hasChosen: boolean;
}

const CollegeContext = createContext<CollegeContextType | undefined>(undefined);

export function CollegeProvider({ children, isBot = false }: { children: React.ReactNode; isBot?: boolean }) {
  const [college, setCollegeState] = useState<College>('nsut');
  const [hasChosen, setHasChosen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Bots always get default college, never see picker
    if (isBot) {
      setCollegeState('nsut');
      setHasChosen(true);
      return;
    }

    // Check URL query param first: ?college=nsut
    const params = new URLSearchParams(window.location.search);
    const queryCollege = params.get('college') as College | null;
    if (queryCollege && ['nsut', 'dtu', 'igdtuw'].includes(queryCollege)) {
      setCollegeState(queryCollege);
      setHasChosen(true);
      localStorage.setItem('college', queryCollege);
      return;
    }

    const stored = localStorage.getItem('college') as College | null;
    if (stored && ['nsut', 'dtu', 'igdtuw'].includes(stored)) {
      setCollegeState(stored);
      setHasChosen(true);
    } else {
      setHasChosen(false);
    }
  }, [isBot]);

  const setCollege = useCallback((c: College) => {
    setCollegeState(c);
    setHasChosen(true);
    localStorage.setItem('college', c);
    applyCollegeTheme(c);
  }, []);

  // Apply theme on mount and when dark/light mode changes
  useEffect(() => {
    if (!mounted) return;
    applyCollegeTheme(college);

    // Watch for dark/light class changes on <html>
    const observer = new MutationObserver(() => applyCollegeTheme(college));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [mounted, college]);

  if (!mounted) {
    return (
      <CollegeContext.Provider value={{ college: 'nsut', setCollege, collegeLabel: 'NSUT', hasChosen: true }}>
        {children}
      </CollegeContext.Provider>
    );
  }

  return (
    <CollegeContext.Provider value={{ college, setCollege, collegeLabel: COLLEGE_LABELS[college], hasChosen }}>
      {children}
    </CollegeContext.Provider>
  );
}

export function useCollege() {
  const context = useContext(CollegeContext);
  if (context === undefined) {
    throw new Error('useCollege must be used within a CollegeProvider');
  }
  return context;
}

/** Returns the API base URL prefixed with the current college */
export function getApiUrl(college: College): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.resulthubnsut.com/api';
  return `${base}/${college}`;
}

function applyCollegeTheme(college: College) {
  const isDark = document.documentElement.classList.contains('dark');
  const vars = isDark ? COLLEGE_THEMES[college].dark : COLLEGE_THEMES[college].light;
  for (const [key, value] of Object.entries(vars)) {
    document.documentElement.style.setProperty(key, value);
  }
}
