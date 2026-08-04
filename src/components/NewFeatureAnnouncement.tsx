"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, X } from 'lucide-react';

// Shown at most MAX_SHOWS times (once per visit), and never again once the
// user opens the feature or we've hit the cap.
const COUNT_KEY = 'rh_bulk_announce_count';
const SESSION_KEY = 'rh_bulk_announce_session';
const MAX_SHOWS = 3;

function markDone() {
    try {
        localStorage.setItem(COUNT_KEY, String(MAX_SHOWS));
    } catch {
        // storage unavailable — worst case the popup shows again next visit
    }
}

export function NewFeatureAnnouncement() {
    const pathname = usePathname();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        try {
            const count = parseInt(localStorage.getItem(COUNT_KEY) || '0', 10);
            if (count >= MAX_SHOWS) return;
            if (sessionStorage.getItem(SESSION_KEY)) return;

            localStorage.setItem(COUNT_KEY, String(count + 1));
            sessionStorage.setItem(SESSION_KEY, '1');
            const timer = setTimeout(() => setVisible(true), 1200);
            return () => clearTimeout(timer);
        } catch {
            // storage unavailable — skip the popup rather than risk nagging forever
        }
    }, []);

    // They found the feature on their own — stop announcing it. The pathname
    // check below hides it instantly; the deferred setState keeps it hidden
    // after they navigate elsewhere.
    useEffect(() => {
        if (pathname === '/bulk') {
            markDone();
            const timer = setTimeout(() => setVisible(false), 0);
            return () => clearTimeout(timer);
        }
    }, [pathname]);

    if (!visible || pathname === '/bulk') return null;

    return (
        <div
            className="fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-xs card p-4 shadow-xl"
            style={{ backgroundColor: 'var(--surface-elevated)' }}
        >
            <button
                onClick={() => setVisible(false)}
                aria-label="Dismiss"
                className="absolute top-2.5 right-2.5 p-1 rounded hover:opacity-70"
                style={{ color: 'var(--text-muted)' }}
            >
                <X size={14} />
            </button>
            <div className="flex items-center gap-2 mb-1.5">
                <Sparkles size={15} style={{ color: 'var(--accent)' }} />
                <span className="badge badge-accent">New</span>
                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Bulk Lookup</span>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                Paste a whole list of names or roll numbers — even a messy one — and find everyone&apos;s results at once.
            </p>
            <Link
                href="/bulk"
                onClick={markDone}
                className="btn-accent inline-flex items-center text-xs px-3 py-1.5"
            >
                Try it →
            </Link>
        </div>
    );
}
