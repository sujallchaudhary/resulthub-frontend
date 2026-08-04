'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { useState, useRef, useEffect } from 'react';
import { useCollege, College, COLLEGE_LABELS } from './CollegeProvider';

// Priority tiers control which links show at each breakpoint:
//  1 = always visible (xs+), 2 = sm+ (640px), 3 = md+ (768px)
const navLinks = [
  { href: '/', label: 'Home', priority: 1 },
  { href: '/result', label: 'Results', priority: 1 },
  { href: '/analytics', label: 'Analytics', priority: 1 },
  { href: '/profile', label: 'Profile', priority: 2 },
  { href: '/battle', label: 'Battle', priority: 2 },
  { href: '/subjects', label: 'Subjects', priority: 2 },
  { href: '/compare', label: 'Compare', priority: 2 },
  { href: '/bulk', label: 'Bulk', priority: 3 },
  { href: '/twin', label: 'Twin', priority: 3 },
  { href: '/wrapped', label: 'Wrapped', priority: 3 },
  { href: '/tools/cgpa-calculator', label: 'Tools', priority: 3 },
  { href: '/about', label: 'About', priority: 3 },
];

const collegeOptions: { id: College; color: string }[] = [
  { id: 'nsut', color: '#0EA5E9' },
  { id: 'dtu', color: '#6366F1' },
  { id: 'igdtuw', color: '#10B981' },
];

const priorityVisibility: Record<number, string> = {
  1: '',                // always visible
  2: 'hidden sm:flex',  // show at sm+
  3: 'hidden md:flex',  // show at md+
};

// In the dropdown, hide links already visible in the bar at that breakpoint
const priorityDropdownHide: Record<number, string> = {
  1: 'hidden',              // always in bar → always hide in dropdown
  2: 'sm:hidden',           // in bar at sm+ → hide at sm+
  3: 'md:hidden',           // in bar at md+ → hide at md+
};

function CollegeSwitch() {
  const { college, setCollege } = useCollege();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = collegeOptions.find(c => c.id === college)!;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-xs font-bold px-2 py-1.5 rounded-lg border cursor-pointer transition-all duration-200"
        style={{
          borderColor: 'var(--accent)',
          backgroundColor: 'var(--accent-light)',
          color: 'var(--accent)',
        }}
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: current.color }}
        />
        <span className="truncate">{COLLEGE_LABELS[college]}</span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-44 rounded-xl border overflow-hidden shadow-lg animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          {collegeOptions.map(c => {
            const isActive = college === c.id;
            return (
              <button
                key={c.id}
                onClick={() => { setCollege(c.id); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium transition-colors duration-150"
                style={{
                  backgroundColor: isActive ? 'var(--accent-light)' : undefined,
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'var(--accent-light)';
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.backgroundColor = '';
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: c.color }}
                />
                {COLLEGE_LABELS[c.id]}
                {isActive && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto" style={{ color: 'var(--accent)' }}>
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isLinkActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-50 w-full border-b" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-2">
        {/* Nav links — progressively revealed by screen width */}
        <nav className="flex items-center gap-0.5 min-w-0">
          {navLinks.map(link => {
            const active = isLinkActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rh-nav-link whitespace-nowrap shrink-0 ${priorityVisibility[link.priority]}`}
                style={active ? { color: 'var(--accent)', backgroundColor: 'var(--accent-light)', fontWeight: 600 } : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: college selector + theme toggle + hamburger */}
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          <CollegeSwitch />
          <ThemeToggle />

          {/* Hamburger — visible until md when all links are shown */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ color: 'var(--text-secondary)' }}
          >
            {mobileMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Dropdown — only shows links not yet visible at current breakpoint */}
      {mobileMenuOpen && (
        <div
          className="md:hidden border-t"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          <nav className="flex flex-col py-2">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-3 text-sm font-medium transition-colors ${priorityDropdownHide[link.priority]}`}
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
