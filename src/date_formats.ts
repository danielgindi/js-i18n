import { generateAllCasePermutations } from './string_case_permutations.ts';
import { padLeft, arrayToRegex } from './utils.ts';

const DATE_FORMAT_REGEX = /d{1,4}|M{1,4}|yy(?:yy)?|([HhmsTt])\1?|[LloSZq]|f{1,7}|F{1,7}|UTC|('[^'\\]*(?:\\.[^'\\]*)*')|("[^"\\]*(?:\\.[^"\\]*)*")|(\[[^\]\\]*(?:\\.[^\]\\]*)*])/g;
const DATE_TIMEZONE_REGEX = /\b(?:[PMCEA][SDP]T|[a-zA-Z ]+ (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)?(?:[-+]\d{4})?)\b/g;
const DATE_TIMEZONE_CLIP_REGEX = /[^-+\dA-Z]/g;

type FlagMap = {
    d: (d: Date) => number;
    D: (d: Date) => number;
    M: (d: Date) => number;
    y: (d: Date) => number;
    H: (d: Date) => number;
    m: (d: Date) => number;
    s: (d: Date) => number;
    L: (d: Date) => number;
    o: (d: Date) => number;
    utcd: (d: Date) => string;
    utc: (d: Date) => string;
    q: (d: Date) => number;
};

type Culture = Record<string, any>;
type DateFlagFormatter = (o: Date, fmap: FlagMap, culture: Culture) => string | number;
type DateParserFactory = (c: Culture, s?: boolean) => string | [string, boolean];

const DATE_FLAG_SUBMAP_LOCAL: FlagMap = {
    'd': d => d.getDate(),
    'D': d => d.getDay(),
    'M': d => d.getMonth(),
    'y': d => d.getFullYear(),
    'H': d => d.getHours(),
    'm': d => d.getMinutes(),
    's': d => d.getSeconds(),
    'L': d => d.getMilliseconds(),
    'o': () => 0,
    'utcd': d => ((d + '').match(DATE_TIMEZONE_REGEX) || ['']).pop().replace(DATE_TIMEZONE_CLIP_REGEX, ''),
    'utc': d => {
        let z = d.getTimezoneOffset();
        const s = (z > 0 ? '-' : '+');
        z = z < 0 ? -z : z;
        const zm = z % 60;
        return s + padLeft((z - zm) / 60, 2, '0') + ':' + (zm ? padLeft(zm, 2, '0') : '');
    },
    'q': d => {
        const m = d.getMonth();
        if (m < 3) return 1;
        if (m < 6) return 2;
        if (m < 9) return 3;
        return 4;
    },
};

const DATE_FLAG_SUBMAP_UTC: FlagMap = {
    'd': d => d.getUTCDate(),
    'D': d => d.getUTCDay(),
    'M': d => d.getUTCMonth(),
    'y': d => d.getUTCFullYear(),
    'H': d => d.getUTCHours(),
    'm': d => d.getUTCMinutes(),
    's': d => d.getUTCSeconds(),
    'L': d => d.getUTCMilliseconds(),
    'o': d => d.getTimezoneOffset(),
    'utcd': () => "UTC",
    'utc': () => "Z",
    'q': d => {
        const m = d.getUTCMonth();
        if (m < 3) return 1;
        if (m < 6) return 2;
        if (m < 9) return 3;
        return 4;
    },
};

const DATE_FLAG_MAP: Record<string, DateFlagFormatter> = {
    'd': (o, fmap) => fmap.d(o),

    'dd': (o, fmap) => padLeft(fmap.d(o), 2, '0'),

    'ddd': (o, fmap, culture) => culture['weekdays_short'][fmap.D(o)],

    'dddd': (o, fmap, culture) => culture['weekdays'][fmap.D(o)],

    'M': (o, fmap) => fmap.M(o) + 1,

    'MM': (o, fmap) => padLeft(fmap.M(o) + 1, 2, '0'),

    'MMM': (o, fmap, culture) => culture['months_short'][fmap.M(o)],

    'MMMM': (o, fmap, culture) => culture['months'][fmap.M(o)],

    'yy': (o, fmap) => padLeft(String(fmap.y(o)).slice(2), 2, '0'),

    'yyyy': (o, fmap) => padLeft(fmap.y(o), 4, '0'),

    'h': (o, fmap) => fmap.H(o) % 12 || 12,

    'hh': (o, fmap) => padLeft(fmap.H(o) % 12 || 12, 2, '0'),

    'H': (o, fmap) => fmap.H(o),

    'HH': (o, fmap) => padLeft(fmap.H(o), 2, '0'),

    'm': (o, fmap) => fmap.m(o),

    'mm': (o, fmap) => padLeft(fmap.m(o), 2, '0'),

    's': (o, fmap) => fmap.s(o),

    'ss': (o, fmap) => padLeft(fmap.s(o), 2, '0'),

    'l': (o, fmap) => padLeft(fmap.L(o), 3, '0'),

    'L': (o, fmap) => {
        const L = fmap.L(o);
        return padLeft(L > 99 ? Math.round(L / 10) : L, 2, '0');
    },

    'f': (o, fmap) => Math.floor(fmap.L(o) / 100).toString(),

    'ff': (o, fmap) => padLeft(Math.floor(fmap.L(o) / 10), 2, '0'),

    'fff': (o, fmap) => padLeft(fmap.L(o), 3, '0'),

    'ffff': (o, fmap) => padLeft(fmap.L(o), 3, '0') + '0',

    'fffff': (o, fmap) => padLeft(fmap.L(o), 3, '0') + '00',

    'ffffff': (o, fmap) => padLeft(fmap.L(o), 3, '0') + '000',

    'fffffff': (o, fmap) => padLeft(fmap.L(o), 3, '0') + '0000',

    'F': (o, fmap) => {
        const v = Math.floor(fmap.L(o) / 100);
        if (v === 0) return '';
        return v.toString();
    },

    'FF': (o, fmap) => {
        const v = Math.floor(fmap.L(o) / 10);
        if (v === 0) return '';
        return padLeft(v, 2, '0');
    },

    'FFF': (o, fmap) => {
        const v = fmap.L(o);
        if (v === 0) return '';
        return padLeft(v, 3, '0');
    },

    'FFFF': (o, fmap) => {
        const v = fmap.L(o);
        if (v === 0) return '';
        return padLeft(v, 3, '0') + '0';
    },

    'FFFFF': (o, fmap) => {
        const v = fmap.L(o);
        if (v === 0) return '';
        return padLeft(v, 3, '0') + '00';
    },

    'FFFFFF': (o, fmap) => {
        const v = fmap.L(o);
        if (v === 0) return '';
        return padLeft(v, 3, '0') + '000';
    },

    'FFFFFFF': (o, fmap) => {
        const v = fmap.L(o);
        if (v === 0) return '';
        return padLeft(v, 3, '0') + '0000';
    },

    't': (o, fmap, culture) => fmap.H(o) < 12 ?
        culture['am_short_lower'] || 'a' :
        culture['pm_short_lower'] || 'p',

    'tt': (o, fmap, culture) => fmap.H(o) < 12 ?
        culture['am_lower'] || 'am' :
        culture['am_lower'] || 'pm',

    'T': (o, fmap, culture) => fmap.H(o) < 12 ?
        culture['am_short_upper'] || 'A' :
        culture['pm_short_upper'] || 'P',

    'TT': (o, fmap, culture) => fmap.H(o) < 12 ?
        culture['am_upper'] || 'AM' :
        culture['pm_upper'] || 'PM',

    'Z': (o, fmap) => fmap.utc(o),

    'UTC': (o, fmap) => fmap.utcd(o),

    'o': (o, fmap) => {
        let oo = fmap.o(o);
        return (oo > 0 ? "-" : "+") + padLeft(Math.floor(Math.abs(oo) / 60) * 100 + Math.abs(oo) % 60, 4, '0');
    },

    'S': (o, fmap) => {
        const d = /**@type number*/fmap.d(o);
        const lastDigit = d % 10;
        return ["th", "st", "nd", "rd"][lastDigit > 3 ? 0 : ((d % 100) - lastDigit !== 10) ? lastDigit : 0];
    },

    'q': (o, fmap) => {
        return fmap.q(o).toString();
    },
};

const DATE_PARSER_FORMAT_REGEX = /('[^'\\]*(?:\\.[^'\\]*)*')|("[^"\\]*(?:\\.[^"\\]*)*")|(\[[^\]\\]*(?:\\.[^\]\\]*)*])|yy(?:yy)?|d{1,4}|M{1,4}|H{1,2}|h{1,2}|m{1,2}|s{1,2}|T{1,2}|t{1,2}|[LloSZ]|f{1,7}|\.?F{1,7}|UTC|.+?/g;

const DATE_PARSER_MAP: Record<string, DateParserFactory> = {
    'yyyy': (c, s) => s ? '[0-9]{4}' : '[0-9]{2}|[0-9]{4}',
    'yy': () => '[0-9]{2}',
    'MMMM': (c) => arrayToRegex(c['months']),
    'MMM': (c) => arrayToRegex(c['months_short']),
    'MM': (c, s) => s ? '[0-9]{2}' : '[0-9]{1,2}',
    'M': () => '[0-9]{1,2}',
    'dddd': (c) => arrayToRegex(c['days']),
    'ddd': (c) => arrayToRegex(c['days_short']),
    'dd': (c, s) => s ? '[0-9]{2}' : '[0-9]{1,2}',
    'd': () => '[0-9]{1,2}',
    'HH': (c, s) => s ? '[0-9]{2}' : '[0-9]{1,2}',
    'H': () => '[0-9]{1,2}',
    'hh': (c, s) => s ? '[0-9]{2}' : '[0-9]{1,2}',
    'h': () => '[0-9]{1,2}',
    'mm': (c, s) => s ? '[0-9]{2}' : '[0-9]{1,2}',
    'm': () => '[0-9]{1,2}',
    'ss': (c, s) => s ? '[0-9]{2}' : '[0-9]{1,2}',
    's': () => '[0-9]{1,2}',
    'l': () => '[0-9]{3}',
    'L': () => '[0-9]{2}',
    'f': () => '[0-9]{1}',
    'ff': () => '[0-9]{2}',
    'fff': () => '[0-9]{3}',
    'ffff': () => '[0-9]{4}',
    'fffff': () => '[0-9]{5}',
    'ffffff': () => '[0-9]{6}',
    'fffffff': () => '[0-9]{7}',
    'F': () => '[0-9]{0,1}',
    'FF': () => '[0-9]{0,2}',
    'FFF': () => '[0-9]{0,3}',
    'FFFF': () => '[0-9]{0,4}',
    'FFFFF': () => '[0-9]{0,5}',
    'FFFFFF': () => '[0-9]{0,6}',
    'FFFFFFF': () => '[0-9]{0,7}',
    '.F': () => ['(?:\\.([0-9]{0,1}))?', true],
    '.FF': () => ['(?:\\.([0-9]{0,2}))?', true],
    '.FFF': () => ['(?:\\.([0-9]{0,3}))?', true],
    '.FFFF': () => ['(?:\\.([0-9]{0,4}))?', true],
    '.FFFFF': () => ['(?:\\.([0-9]{0,5}))?', true],
    '.FFFFFF': () => ['(?:\\.([0-9]{0,6}))?', true],
    '.FFFFFFF': () => ['(?:\\.([0-9]{0,7}))?', true],
    'tt': (c) => {
        const am1 = c['am_lower'] || 'am';
        const pm1 = c['pm_lower'] || 'pm';
        const am2 = c['am_upper'] || 'AM';
        const pm2 = c['pm_upper'] || 'PM';

        let all = generateAllCasePermutations(am1)
            .concat(generateAllCasePermutations(pm1));

        if (am1.toLowerCase() !== am2.toLowerCase()) {
            all = all.concat(generateAllCasePermutations(am2));
        }

        if (pm1.toLowerCase() !== pm2.toLowerCase()) {
            all = all.concat(generateAllCasePermutations(pm2));
        }

        return arrayToRegex(all);
    },
    't': (c) => {
        const am1 = c['am_short_lower'] || 'a';
        const pm1 = c['pm_short_lower'] || 'p';
        const am2 = c['am_short_upper'] || 'A';
        const pm2 = c['pm_short_upper'] || 'P';

        let all = generateAllCasePermutations(am1)
            .concat(generateAllCasePermutations(pm1));

        if (am1.toLowerCase() !== am2.toLowerCase()) {
            all = all.concat(generateAllCasePermutations(am2));
        }

        if (pm1.toLowerCase() !== pm2.toLowerCase()) {
            all = all.concat(generateAllCasePermutations(pm2));
        }

        return arrayToRegex(all);
    },
    'TT': (c, s) => DATE_PARSER_MAP['tt'](c, s),
    'T': (c, s) => DATE_PARSER_MAP['t'](c, s),
    'Z': () => 'Z|(?:GMT|UTC)?[+-][0-9]{2}(?:\\:?[0-9]{2})(?:\\([a-zA-Z ]+ (?:Standard|Daylight|Prevailing) Time\\))?',
    'UTC': () => '[+-][0-9]{2,4}',
    'o': () => '[+-][0-9]{4}',
    'S': () => 'th|st|nd|rd',
    'q': () => '[0-9]',
};

export {
    DATE_FORMAT_REGEX,
    DATE_FLAG_SUBMAP_LOCAL,
    DATE_FLAG_SUBMAP_UTC,
    DATE_FLAG_MAP,
    DATE_PARSER_FORMAT_REGEX,
    DATE_PARSER_MAP,
};


