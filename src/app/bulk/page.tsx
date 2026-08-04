import type { Metadata } from 'next';
import { BulkLookupClient } from '@/components/BulkLookupClient';

export const metadata: Metadata = {
    title: 'Bulk Lookup — Paste a List of Names or Roll Numbers',
    description:
        'Paste any list of NSUT, DTU or IGDTUW students — names, roll numbers, or college emails — and Result Hub finds every profile, CGPA and rank in one go.',
    alternates: { canonical: 'https://www.resulthubnsut.com/bulk' },
};

export default function BulkLookupPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            <div className="mb-6">
                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    Bulk Lookup
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Paste any list — names, roll numbers, even a name/email export — and find everyone at once.
                    Same-name students are all shown so you can pick the right one.
                </p>
            </div>
            <BulkLookupClient />
        </div>
    );
}
