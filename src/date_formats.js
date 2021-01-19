import { generateAllCasePermutations } from './string_case_permutations';
import { padLeft, arrayToRegex } from './utils';

const DATE_FORMAT_REGEX = /[dM]{1,4}|yy(?:yy)?|([HhmsTt])\1?|[LloSZ]|[fF]{1,7}|UTC|('[^'\\]*(?:\\.[^'\\]*)*')|("[^"\\]*(?:\\.[^"\\]*)*")|(\[[^\]\\]*(?:\\.[^\]\\]*)*])/g;
const DATE_TIMEZONE_REGEX = /\b(?:[PMCEA][SDP]T|[a-zA-Z ]+ (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)?(?:[-+]\d{4})?)\b/g;
const DATE_TIMEZONE_CLIP_REGEX = /[^-+\dA-Z]/g;

/** @typedef {{d: function, D: function, M: function, y: function, H: function, m: function, s: function, L: function, o: function, utcd: function, utc: function}} FlagMap */

/** @type {FlagMap} */
const DATE_FLAG_SUBMAP_LOCAL = {
    /** @param {Date} d */
    /** @returns {number} */ 'd': d => d.getDate(),
    /** @param {Date} d */
    /** @returns {number} */ 'D': d => d.getDay(),
    /** @param {Date} d */
    /** @returns {number} */ 'M': d => d.getMonth(),
    /** @param {Date} d */
    /** @returns {number} */ 'y': d => d.getFullYear(),
    /** @param {Date} d */
    /** @returns {number} */ 'H': d => d.getHours(),
    /** @param {Date} d */
    /** @returns {number} */ 'm': d => d.getMinutes(),
    /** @param {Date} d */
    /** @returns {number} */ 's': d => d.getSeconds(),
    /** @param {Date} d */
    /** @returns {number} */ 'L': d => d.getMilliseconds(),
    /** @param {Date} d */
    /** @returns {number} */ 'o': () => 0,
    /** @param {Date} d */
    /** @returns {string} */ 'utcd': d => ((d + '').match(DATE_TIMEZONE_REGEX) || ['']).pop().replace(DATE_TIMEZONE_CLIP_REGEX, ''),
    /** @param {Date} d */
    /** @returns {string} */ 'utc': d => {
        let z = d.getTimezoneOffset();
        const s = (z > 0 ? '-' : '+');
        z = z < 0 ? -z : z;
        const zm = z % 60;
        return s + padLeft((z - zm) / 60, 2, '0') + (zm ? padLeft(zm, 2, '0') : '');
    },
};

/** @type {FlagMap} */
const DATE_FLAG_SUBMAP_UTC = {
    /** @param {Date} d */ /** @returns {number} */ 'd': d => d.getUTCDate(),
    /** @param {Date} d */ /** @returns {number} */ 'D': d => d.getUTCDay(),
    /** @param {Date} d */ /** @returns {number} */ 'M': d => d.getUTCMonth(),
    /** @param {Date} d */ /** @returns {number} */ 'y': d => d.getUTCFullYear(),
    /** @param {Date} d */ /** @returns {number} */ 'H': d => d.getUTCHours(),
    /** @param {Date} d */ /** @returns {number} */ 'm': d => d.getUTCMinutes(),
    /** @param {Date} d */ /** @returns {number} */ 's': d => d.getUTCSeconds(),
    /** @param {Date} d */ /** @returns {number} */ 'L': d => d.getUTCMilliseconds(),
    /** @param {Date} d */ /** @returns {number} */ 'o': d => d.getTimezoneOffset(),
    /** @param {Date} d */ /** @returns {string} */ 'utcd': () => "UTC",
    /** @param {Date} d */ /** @returns {string} */ 'utc': () => "Z",
};

const DATE_FLAG_MAP = {
    /** @param {FlagMap} fmap */ /** @return {string} */
    'd': (o, fmap) => fmap.d(o),

    /** @param {FlagMap} fmap */ /** @return {string} */
    'dd': (o, fmap) => padLeft(fmap.d(o), 2, '0'),

    /** @param {FlagMap} fmap */ /** @return {string} */
    'ddd': (o, fmap, culture) => culture['weekdays_short'][fmap.D(o)],

    /** @param {FlagMap} fmap */ /** @return {string} */
    'dddd': (o, fmap, culture) => culture['weekdays'][fmap.D(o)],

    /** @param {FlagMap} fmap */ /** @return {string} */
    'M': (o, fmap) => fmap.M(o) + 1,

    /** @param {FlagMap} fmap */ /** @return {string} */
    'MM': (o, fmap) => padLeft(fmap.M(o) + 1, 2, '0'),

    /** @param {FlagMap} fmap */ /** @return {string} */
    'MMM': (o, fmap, culture) => culture['months_short'][fmap.M(o)],

    /** @param {FlagMap} fmap */ /** @return {string} */
    'MMMM': (o, fmap, culture) => culture['months'][fmap.M(o)],

    /** @param {FlagMap} fmap */ /** @return {string} */
    'yy': (o, fmap) => String(fmap.y(o)).slice(2),

    /** @param {FlagMap} fmap */ /** @return {string} */
    'yyyy': (o, fmap) => fmap.y(o),

    /** @param {FlagMap} fmap */ /** @return {number} */
    'h': (o, fmap) => fmap.H(o) % 12 || 12,

    /** @param {FlagMap} fmap */ /** @return {string} */
    'hh': (o, fmap) => padLeft(fmap.H(o) % 12 || 12, 2, '0'),

    /** @param {FlagMap} fmap */ /** @return {string} */
    'H': (o, fmap) => fmap.H(o),

    /** @param {FlagMap} fmap */ /** @return {string} */
    'HH': (o, fmap) => padLeft(fmap.H(o), 2, '0'),

    /** @param {FlagMap} fmap */ /** @return {string} */
    'm': (o, fmap) => fmap.m(o),

    /** @param {FlagMap} fmap */ /** @return {string} */
    'mm': (o, fmap) => padLeft(fmap.m(o), 2, '0'),

    /** @param {FlagMap} fmap */ /** @return {string} */
    's': (o, fmap) => fmap.s(o),

    /** @param {FlagMap} fmap */ /** @return {string} */
    'ss': (o, fmap) => padLeft(fmap.s(o), 2, '0'),

    /** @param {FlagMap} fmap */ /** @return {string} */
    'l': (o, fmap) => padLeft(fmap.L(o), 3, '0'),

    /** @param {FlagMap} fmap */ /** @return {string} */
    'L': (o, fmap) => {
        const L = fmap.L(o);
        return padLeft(L > 99 ? Math.round(L / 10) : L, 2, '0');
    },

    /** @param {FlagMap} fmap */ /** @return {string} */
    'f': (o, fmap) => Math.floor(fmap.L(o) / 100).toString(),

    /** @param {FlagMap} fmap */ /** @return {string} */
    'ff': (o, fmap) => padLeft(Math.floor(fmap.L(o) / 10), 2, '0'),

    /** @param {FlagMap} fmap */ /** @return {string} */
    'fff': (o, fmap) => padLeft(fmap.L(o), 3, '0'),

    /** @param {FlagMap} fmap */ /** @return {string} */
    'ffff': (o, fmap) => padLeft(fmap.L(o), 3, '0') + '0',

    /** @param {FlagMap} fmap */ /** @return {string} */
    'fffff': (o, fmap) => padLeft(fmap.L(o), 3, '0') + '00',

    /** @param {FlagMap} fmap */ /** @return {string} */
    'ffffff': (o, fmap) => padLeft(fmap.L(o), 3, '0') + '000',

    /** @param {FlagMap} fmap */ /** @return {string} */
    'fffffff': (o, fmap) => padLeft(fmap.L(o), 3, '0') + '0000',

    /** @param {FlagMap} fmap */ /** @return {string} */
    'F': (o, fmap) => {
        const v = Math.floor(fmap.L(o) / 100);
        if (v === 0) return '';
        return v.toString();
    },

    /** @param {FlagMap} fmap */ /** @return {string} */
    'FF': (o, fmap) => {
        const v = Math.floor(fmap.L(o) / 10);
        if (v === 0) return '';
        return padLeft(v, 2, '0');
    },

    /** @param {FlagMap} fmap */ /** @return {string} */
    'FFF': (o, fmap) => {
        const v = fmap.L(o);
        if (v === 0) return '';
        return padLeft(v, 3, '0');
    },

    /** @param {FlagMap} fmap */ /** @return {string} */
    'FFFF': (o, fmap) => {
        const v = fmap.L(o);
        if (v === 0) return '';
        return padLeft(v, 3, '0') + '0';
    },

    /** @param {FlagMap} fmap */ /** @return {string} */
    'FFFFF': (o, fmap) => {
        const v = fmap.L(o);
        if (v === 0) return '';
        return padLeft(v, 3, '0') + '00';
    },

    /** @param {FlagMap} fmap */ /** @return {string} */
    'FFFFFF': (o, fmap) => {
        const v = fmap.L(o);
        if (v === 0) return '';
        return padLeft(v, 3, '0') + '000';
    },

    /** @param {FlagMap} fmap */ /** @return {string} */
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

    /** @param {FlagMap} fmap */ /** @return {string} */
    'Z': (o, fmap) => fmap.utc(o),

    /** @param {FlagMap} fmap */ /** @return {string} */
    'UTC': (o, fmap) => fmap.utcd(o),

    /** @param {FlagMap} fmap */ /** @return {string} */
    'o': (o, fmap) => {
        o = fmap.o(o);
        return (o > 0 ? "-" : "+") + padLeft(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4, '0');
    },

    /** @param {FlagMap} fmap */ /** @return {string} */
    'S': (o, fmap) => {
        const d = /**@type number*/fmap.d(o);
        return ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 !== 10) * d % 10];
    },
};

const DATE_PARSER_FORMAT_REGEX = /('[^'\\]*(?:\\.[^'\\]*)*')|("[^"\\]*(?:\\.[^"\\]*)*")|(\[[^\]\\]*(?:\\.[^\]\\]*)*])|yy(?:yy)?|[dM]{1,4}|[HhmsTt]{1,2}|[LloSZ]|[fF]{1,7}|UTC|.+?/g;

const DATE_PARSER_MAP = {
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
    'Z': () => 'Z|(?:GMT|UTC)?[+-][0-9]{2,4}(?:\\([a-zA-Z ]+ (?:Standard|Daylight|Prevailing) Time\\))?',
    'UTC': () => '[+-][0-9]{2,4}',
    'o': () => '[+-][0-9]{4}',
    'S': () => 'th|st|nd|rd',
};

export {
    DATE_FORMAT_REGEX,
    DATE_FLAG_SUBMAP_LOCAL,
    DATE_FLAG_SUBMAP_UTC,
    DATE_FLAG_MAP,
    DATE_PARSER_FORMAT_REGEX,
    DATE_PARSER_MAP,
};
