import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatGrade(value: number | undefined | null, decimals: number = 2): string {
    if (value === undefined || value === null || isNaN(value)) return (0).toFixed(decimals);
    const str = value.toString();
    const match = str.match(new RegExp(`^-?\\d+(?:\\.\\d{0,${decimals}})?`));
    if (!match) return (0).toFixed(decimals);
    
    let truncated = match[0];
    if (!truncated.includes('.')) {
        truncated += '.' + '0'.repeat(decimals);
    } else {
        const parts = truncated.split('.');
        parts[1] = parts[1].padEnd(decimals, '0');
        truncated = parts.join('.');
    }
    return truncated;
}
