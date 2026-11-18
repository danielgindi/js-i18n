import { readFileSync } from 'node:fs';
import i18n from '../../src/i18n.ts';

const inputDates = JSON.parse(readFileSync(0, 'utf8'));
const formatWithZone = "yyyy-MM-dd'T'HH:mm:ssZ";
const formatWithoutZone = "yyyy-MM-dd'T'HH:mm:ss";

const actualDates = inputDates.map(input => {
    const format = /(?:Z|[+-]\d{2}:\d{2})$/.test(input) ? formatWithZone : formatWithoutZone;
    const parsedDate = i18n.parseDate(input, format, {});
    return parsedDate?.toISOString() ?? null;
});

process.stdout.write(JSON.stringify(actualDates));
