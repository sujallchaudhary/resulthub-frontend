// Parses messy pasted rosters (bullet lists, name+roll columns, name/email
// exports) into lookup entries keyed on roll number or name.

export interface ParsedEntry {
    id: number;
    raw: string;
    roll?: string;      // normalized roll number, e.g. 2024UCA1953
    name?: string;
    email?: string;
    batchHint?: string; // e.g. '2024', derived from ug24-style emails
}

// NSUT (2024UCA1953) and DTU (2K22/EE/138) roll formats, matched anywhere in a line
const NSUT_ROLL = /\b\d{4}[A-Z]{3}\d{4}\b/;
const DTU_ROLL = /\b\d[A-Z0-9]{1,3}\/[A-Z]{2,4}\/\d{1,4}\b/;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

// Column headers and label-only lines that should never become lookup entries
const HEADER_LINES = new Set([
    'candidate name', 'candidate email', 'name', 'email', 'names', 'emails',
    'roll no', 'roll number', 'rollno', 'roll', 'student name', 'student',
    's no', 'sno', 'sr no', 'sl no', 'serial no',
    'waitlist', 'waitlisted', 'shortlist', 'shortlisted', 'selected',
    'rejected', 'confirmed', 'pending', 'participants', 'members', 'list',
]);

function stripBullets(line: string): string {
    return line
        .replace(/^[\s*\-•·●▪‣>–—]+/, '')
        .replace(/^\d{1,3}[.)]\s+/, '')
        .trim();
}

function normalizeName(name: string): string {
    return name.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

// "aaryan.aaloke.ug24@nsut.ac.in" -> { name: 'aaryan aaloke', batchHint: '2024' }
function parseEmail(email: string): { name?: string; batchHint?: string } {
    const local = email.split('@')[0];
    const batchMatch = local.match(/ug(\d{2})/i);
    const tokens = local
        .split(/[._+-]/)
        .filter(t => t && !/^ug\d{2}$/i.test(t) && !/^\d+$/.test(t));
    return {
        name: tokens.length ? tokens.join(' ') : undefined,
        batchHint: batchMatch ? `20${batchMatch[1]}` : undefined,
    };
}

export function parseRoster(text: string): ParsedEntry[] {
    const entries: ParsedEntry[] = [];
    const seen = new Set<string>();
    let nextId = 0;

    for (const rawLine of text.split(/\r?\n/)) {
        const line = stripBullets(rawLine);
        if (!line) continue;
        if (HEADER_LINES.has(normalizeName(line))) continue;

        const rollMatch = line.toUpperCase().match(NSUT_ROLL) || line.toUpperCase().match(DTU_ROLL);
        const emailMatch = line.match(EMAIL);
        const email = emailMatch?.[0];

        // Leftover text once roll/email are removed is the name; stray serial
        // numbers ("1", "23.") are dropped too
        let name = line;
        if (rollMatch) name = name.replace(new RegExp(rollMatch[0].replace(/[/\\]/g, '\\$&'), 'i'), ' ');
        if (email) name = name.replace(email, ' ');
        name = name
            .replace(/[,;|\t]+/g, ' ')
            .split(/\s+/)
            .filter(t => t && !/^\d{1,4}[.)]?$/.test(t))
            .join(' ')
            .trim();

        const fromEmail = email ? parseEmail(email) : {};

        // Email-only line: in name/email column exports the email belongs to the
        // name on the previous line — attach it there instead of adding a row
        if (!rollMatch && !name && email) {
            const prev = entries[entries.length - 1];
            if (prev && prev.name && !prev.roll && !prev.email) {
                prev.email = email;
                if (!prev.batchHint) prev.batchHint = fromEmail.batchHint;
                continue;
            }
        }

        const prev = entries[entries.length - 1];

        // Bare roll right after a lone name (name-then-roll column exports):
        // it's that student's roll, not a separate entry
        if (rollMatch && !name && !email && prev && prev.name && !prev.roll) {
            prev.roll = rollMatch[0];
            prev.raw = `${prev.raw} · ${rollMatch[0]}`;
            seen.add(rollMatch[0]);
            continue;
        }

        // Lone name right after a bare roll (serial/roll/name exports):
        // it's that student's name
        if (name && !rollMatch && !email && prev && prev.roll && !prev.name) {
            prev.name = name;
            prev.raw = `${prev.raw} · ${name}`;
            continue;
        }

        const entry: ParsedEntry = {
            id: nextId,
            raw: line,
            roll: rollMatch ? rollMatch[0] : undefined,
            name: name || fromEmail.name,
            email,
            batchHint: fromEmail.batchHint,
        };
        if (!entry.roll && !entry.name) continue;

        const key = entry.roll ?? `${normalizeName(entry.name!)}|${entry.batchHint ?? ''}`;
        if (seen.has(key)) continue;
        seen.add(key);

        entry.id = nextId++;
        entries.push(entry);
    }

    return entries;
}

export { normalizeName };
