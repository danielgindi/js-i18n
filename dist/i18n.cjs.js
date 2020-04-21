/*!
 * js-i18n 1.1.9
 * https://github.com/danielgindi/js-i18n
 */
'use strict';

// Helper function to extend an object using a synthetic object structure from dotted syntax to a real nested structure.
function extendDotted(target, data) {
  if (data == null) return;
  let dotted, targetDotted, i;
  for (let key in data) {
    if (!data.hasOwnProperty(key) || !data[key]) continue;
    dotted = key.split('.');
    targetDotted = target;
    for (i = 0; i < dotted.length - 1; i++) {
      targetDotted = targetDotted[dotted[i]];
    }
    targetDotted[dotted[dotted.length - 1]] = data[key];
  }
}

const ESCAPE_REGEX = /([\/()[\]?{}|*+-\\:])/g;

function regexEscape(string) {
  return string.replace(ESCAPE_REGEX, '\\$1');
}

function arrayToRegex(array) {
  let regex = '';
  for (let i = 0; i < array.length; i++) {
    if (i > 0) regex += '|';
    regex += regexEscape(array[i]);
  }
  return regex;
}

/**
   * Pad a value with characters on the left
   * @param {string|Number} value the value to pad
   * @param {Number} length minimum length for the output
   * @param {string} ch the character to use for the padding
   * @returns {*}
   */
function padLeft(value, length, ch) {
  value = value.toString();
  while (value.length < length)
  value = ch + value;
  return value;
}

function recurse(results, lower, upper, hasCase, pre) {

  const len = lower.length;
  let currenLen = pre.length;

  while (currenLen < len && !hasCase[currenLen]) {
    pre += lower[currenLen++];
  }

  if (currenLen === len) {
    return results.push(pre);
  }

  recurse(results, lower, upper, hasCase, pre + lower[currenLen]);
  recurse(results, lower, upper, hasCase, pre + upper[currenLen]);
}

/**
   * Generate an array of all lowercase-uppercase combinations of a given string
   * @param {string} text
   * @returns {string[]}
   */
function generateAllCasePermutations(text) {
  text = text + '';
  if (!text) return null;

  const results = [];
  const lower = text.split('');
  const upper = [];
  const hasCase = [];

  let i = 0;
  const len = text.length;
  for (; i < len; i++) {
    lower[i] = lower[i].toLowerCase();
    upper[i] = lower[i].toUpperCase();
    hasCase[i] = upper[i] !== lower[i];
  }

  recurse(results, lower, upper, hasCase, '');

  return results;
}

const DATE_FORMAT_REGEX = /d{1,4}|M{1,4}|yy(?:yy)?|([HhmsTt])\1?|[LloSZ]|UTC|('[^'\\]*(?:\\.[^'\\]*)*')|("[^"\\]*(?:\\.[^"\\]*)*")|(\[[^\]\\]*(?:\\.[^\]\\]*)*])/g;
const DATE_TIMEZONE_REGEX = /\b(?:[PMCEA][SDP]T|[a-zA-Z ]+ (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)?(?:[-+]\d{4})?)\b/g;
const DATE_TIMEZONE_CLIP_REGEX = /[^-+\dA-Z]/g;

/** @typedef {{d: function, D: function, M: function, y: function, H: function, m: function, s: function, L: function, o: function, utcd: function, utc: function}} FlagMap */

/** @type {FlagMap} */
const DATE_FLAG_SUBMAP_LOCAL = {
  /** @param {Date} d */
  /** @returns {number} */'d': d => d.getDate(),
  /** @param {Date} d */
  /** @returns {number} */'D': d => d.getDay(),
  /** @param {Date} d */
  /** @returns {number} */'M': d => d.getMonth(),
  /** @param {Date} d */
  /** @returns {number} */'y': d => d.getFullYear(),
  /** @param {Date} d */
  /** @returns {number} */'H': d => d.getHours(),
  /** @param {Date} d */
  /** @returns {number} */'m': d => d.getMinutes(),
  /** @param {Date} d */
  /** @returns {number} */'s': d => d.getSeconds(),
  /** @param {Date} d */
  /** @returns {number} */'L': d => d.getMilliseconds(),
  /** @param {Date} d */
  /** @returns {number} */'o': d => 0,
  /** @param {Date} d */
  /** @returns {string} */'utcd': d => ((d + '').match(DATE_TIMEZONE_REGEX) || ['']).pop().replace(DATE_TIMEZONE_CLIP_REGEX, ''),
  /** @param {Date} d */
  /** @returns {string} */'utc': d => {
    let z = d.getTimezoneOffset();
    const s = z > 0 ? '-' : '+';
    z = z < 0 ? -z : z;
    const zm = z % 60;
    return s + padLeft((z - zm) / 60, 2, '0') + (zm ? padLeft(zm, 2, '0') : '');
  } };


/** @type {FlagMap} */
const DATE_FLAG_SUBMAP_UTC = {
  /** @param {Date} d */ /** @returns {number} */'d': d => d.getUTCDate(),
  /** @param {Date} d */ /** @returns {number} */'D': d => d.getUTCDay(),
  /** @param {Date} d */ /** @returns {number} */'M': d => d.getUTCMonth(),
  /** @param {Date} d */ /** @returns {number} */'y': d => d.getUTCFullYear(),
  /** @param {Date} d */ /** @returns {number} */'H': d => d.getUTCHours(),
  /** @param {Date} d */ /** @returns {number} */'m': d => d.getUTCMinutes(),
  /** @param {Date} d */ /** @returns {number} */'s': d => d.getUTCSeconds(),
  /** @param {Date} d */ /** @returns {number} */'L': d => d.getUTCMilliseconds(),
  /** @param {Date} d */ /** @returns {number} */'o': d => d.getTimezoneOffset(),
  /** @param {Date} d */ /** @returns {string} */'utcd': () => "UTC",
  /** @param {Date} d */ /** @returns {string} */'utc': () => "Z" };


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
  } };


const DATE_PARSER_FORMAT_REGEX = /('[^'\\]*(?:\\.[^'\\]*)*')|("[^"\\]*(?:\\.[^"\\]*)*")|(\[[^\]\\]*(?:\\.[^\]\\]*)*])|yyyy|yy|MMMM|MMM|MM|M|dddd|ddd|dd|d|HH|H|hh|h|mm|m|ss|s|l|L|f|ff|fff|ffff|fffff|ffffff|fffffff|F|FF|FFF|FFFF|FFFFF|FFFFFF|FFFFFFF|tt|t|TT|T|Z|UTC|o|S|.+?/g;

const DATE_PARSER_MAP = {
  'yyyy': (c, s) => s ? '[0-9]{4}' : '[0-9]{2}|[0-9]{4}',
  'yy': () => '[0-9]{2}',
  'MMMM': c => arrayToRegex(c['months']),
  'MMM': c => arrayToRegex(c['months_short']),
  'MM': (c, s) => s ? '[0-9]{2}' : '[0-9]{1,2}',
  'M': () => '[0-9]{1,2}',
  'dddd': c => arrayToRegex(c['days']),
  'ddd': c => arrayToRegex(c['days_short']),
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
  'tt': c => {
    const am1 = c['am_lower'] || 'am';
    const pm1 = c['pm_lower'] || 'pm';
    const am2 = c['am_upper'] || 'AM';
    const pm2 = c['pm_upper'] || 'PM';

    let all = generateAllCasePermutations(am1).
    concat(generateAllCasePermutations(pm1));

    if (am1.toLowerCase() !== am2.toLowerCase()) {
      all = all.concat(generateAllCasePermutations(am2));
    }

    if (pm1.toLowerCase() !== pm2.toLowerCase()) {
      all = all.concat(generateAllCasePermutations(pm2));
    }

    return arrayToRegex(all);
  },
  't': c => {
    const am1 = c['am_short_lower'] || 'a';
    const pm1 = c['pm_short_lower'] || 'p';
    const am2 = c['am_short_upper'] || 'A';
    const pm2 = c['pm_short_upper'] || 'P';

    let all = generateAllCasePermutations(am1).
    concat(generateAllCasePermutations(pm1));

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
  'S': () => 'th|st|nd|rd' };

const DEFAULT_DECIMAL_SEPARATOR = 1.1.toLocaleString().substr(1, 1);

const DEFAULT_THOUSANDS_SEPARATOR = 1000 .toLocaleString().length === 5 ?
1000 .toLocaleString().substr(1, 1) :
DEFAULT_DECIMAL_SEPARATOR === ',' ? '.' : ',';

//const DEFAULT_DECIMAL_SEPARATOR_REGEX = new RegExp('\\' + DEFAULT_DECIMAL_SEPARATOR, 'g');

/**
 * This will process value with printf specifier format
 * @param {*} value the value to process
 * @param {string?} specifiers the printf style specifiers. i.e. '2.5f', 'E', '#x'
 * @param {string?} decimalSign the decimal separator character to use
 * @param {string?} thousandsSign the thousands separator character to use
 * @returns {string}
 */
function applySpecifiers(value, specifiers, decimalSign, thousandsSign) {
  if (!specifiers) return value;

  const type = specifiers[specifiers.length - 1];
  specifiers = specifiers.substr(0, specifiers.length - 1);

  const isNumeric =
  type === 'b' ||
  type === 'c' ||
  type === 'd' ||
  type === 'i' ||
  type === 'e' ||
  type === 'E' ||
  type === 'f' ||
  type === 'g' ||
  type === 'o' ||
  type === 'u' ||
  type === 'x' ||
  type === 'X';
  const isDecimalNumeric =
  type === 'e' ||
  type === 'E' ||
  type === 'f' ||
  type === 'g';
  const isUpperCase =
  type === 'E' ||
  type === 'X';

  let forceSign, spaceSign, radiiOrDecimalSign, padZero, padCount, hasThousands, precision;

  if (isNumeric) {
    if (typeof value !== 'number') {
      value = parseInt(value, 10);
    }
    if (type === 'u') {
      value = value >>> 0;
    }

    const parsedSpecifiers = specifiers.match(/(\+)?( )?(#)?(0)?([0-9]+)?(,)?(.([0-9]+))?/);
    forceSign = parsedSpecifiers[1] === '+';
    spaceSign = parsedSpecifiers[2] === ' ';
    radiiOrDecimalSign = parsedSpecifiers[3] === '#';
    padZero = parsedSpecifiers[4] === '0';
    padCount = parsedSpecifiers[5] ? parseInt(parsedSpecifiers[5], 10) : 0;
    hasThousands = parsedSpecifiers[6];
    precision = parsedSpecifiers[8];

    if (precision) {
      precision = parseInt(precision, 10);
    }

    decimalSign = decimalSign || DEFAULT_DECIMAL_SEPARATOR;
    thousandsSign = thousandsSign || DEFAULT_THOUSANDS_SEPARATOR;
  }

  if (type === 'b') {
    value = /**@type number*/value.toString(2);
  } else if (type === 'c') {
    value = String.fromCharCode(value);
  } else if (type === 'd' || type === 'i' || type === 'u') {
    value = /**@type number*/value.toString();
  } else if (type === 'e' || type === 'E') {
    value = (precision !== undefined ?
    /**@type number*/value.toExponential(parseInt(precision, 10)) :
    /**@type number*/value.toExponential()).toString();
  } else if (type === 'f') {
    value = (precision !== undefined ?
    parseFloat(value).toFixed(parseInt(precision, 10)) :
    parseFloat(value)).toString();
  } else if (type === 'g') {
    value = parseFloat(value).toString();
    if (precision !== undefined) {
      const decimalIdx = value.indexOf('.');
      if (decimalIdx > -1) {
        value = value.substr(0, decimalIdx + (precision > 0 ? 1 : 0) + precision);
      }
    }
  } else if (type === 'o') {
    value = /**@type number*/value.toString(8);
  } else if (type === 'x' || type === 'X') {
    value = /**@type number*/value.toString(16);
  } else if (type === 's') {
    value = value.toString();
    if (precision !== undefined) {
      value.substr(0, precision);
    }
  } else {
    value = value.toString();
  }

  if (type === 'd' || type === 'i' || type === 'u' || type === 'x' || type === 'x' || type === 'X' || type === 'o') {
    if (precision !== undefined) {
      if (precision === 0 && value === '0') {
        value = '';
      } else {
        value = padLeft(value, precision, '0');
      }
    }
  }

  if (value.length === 0) {
    return value;
  }

  if (isDecimalNumeric) {
    if (radiiOrDecimalSign && value.indexOf('.') === -1) {
      value += '.';
    }
    value = value.replace(/\./g, decimalSign);
  }

  if (isUpperCase) {
    value = value.toUpperCase();
  }

  if (hasThousands) {
    let decIndex = value.indexOf(decimalSign);
    if (decIndex === -1) {
      decIndex = value.length;
    }
    const signIndex = value.charAt(0) === '-' ? 1 : 0;
    if (decIndex - signIndex > 3) {
      let sepValue = '';
      const major = value.substr(signIndex, decIndex - signIndex);
      let fromIndex = 0,toIndex = major.length % 3;
      while (fromIndex < major.length) {
        if (fromIndex > 0) {
          sepValue += thousandsSign;
        }
        sepValue += major.substring(fromIndex, toIndex);
        fromIndex = toIndex;
        toIndex = fromIndex + 3;
      }
      value = (signIndex ? '-' : '') + sepValue + value.substr(decIndex);
    }
  }

  if (isNumeric) {
    const sign = (value.charAt(0) === '-' ? '-' : forceSign ? '+' : '') || (spaceSign ? ' ' : '');

    // Remove the - sign
    if (sign === '-') {
      value = value.substr(1);
    }

    let radiiSign = '';

    // Prefix with the radii sign
    if (radiiOrDecimalSign) {
      if (type === 'x' || type === 'X') {
        radiiSign = '0x';
      } else if (type === 'o') {
        radiiSign = '0';
      }
    }

    // Zero padding - should be like "0x00005" for length of 7, where the radii sign is before padding
    if (padCount && padZero) {
      value = padLeft(value, padCount - sign.length - radiiSign.length, '0');
    }

    value = sign + radiiSign + value;

    // Space padding - should be like "    0x5" for length of 7, where the radii sign is after padding
    if (padCount && !padZero) {
      value = padLeft(value, padCount, ' ');
    }
  }

  return value;
}

/**
                                                      *
                                                      * To add a language, call i18n.add('language-code', {translation}, {options})
                                                      * Where options takes the following keys:
                                                      * "plural": function that takes a number, and returns a key suffix for plural form of that count.
                                                      * "decimal": decimal separator character. The default is auto-detected from the browser locale
                                                      * "thousands": thousands separator character. The default is auto-detected from the browser locale
                                                      *
                                                      */

const DEFAULT_DECIMAL_SEPARATOR$1 = 1.1.toLocaleString().substr(1, 1);
const EMPTY_ARRAY = [];

let activeLanguage = '';
let fallbackLanguage = '';
let active = null;

const locs = {}; // Here we will keep i18n objects, each key is a language code
const originalLocs = {}; // Here we will keep original localizations before using extendLanguage

/**
 * The default plural form specifier.
 * This function returns a specifier for plural form, for the specified count.
 * @param {Number} count the number that we need to inspect
 * @returns {string}
 */
const defaultPlural = function (count) {
  if (count === 0) return 'zero';
  if (count === 1) return 'one';
  return 'plural';
};

/**
    * Encodes the value {value} using the specified {encoding}
    * @param {string} value the value to encode
    * @param {string} encoding for filters
    * @returns {*}
    */
const encodeValue = function (value, encoding) {
  if (encoding === 'html') {
    value = (value == null ? '' : value + '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;").replace(/"/g, "&quot;");
  } else
  if (encoding === 'htmll') {
    value = (value == null ? '' : value + '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;").replace(/"/g, "&quot;").replace(/\n/g, "<br />");
  } else
  if (encoding === 'json') {
    value = JSON.stringify(value);
  } else
  if (encoding === 'url') {
    value = encodeURIComponent(value);
  } else
  if (encoding === 'lower') {
    value = (value + '').toLowerCase();
  } else
  if (encoding === 'upper') {
    value = (value + '').toUpperCase();
  } else
  if (encoding === 'upperfirst') {
    value = value + '';
    value = value[0].toUpperCase() + value.substr(1).toLowerCase();
  } else
  if (encoding.substr(0, 7) === 'printf ') {
    const localeOptions = active.options;
    value = applySpecifiers(value, encoding.substr(7), localeOptions.decimal, localeOptions.thousands);
  }

  return value;
};

/** @typedef i18n */
const i18n = {

  /**
                * Add a language to the localization object
                * @public
                * @param {string} langCode language code
                * @param {Object} data localization object
                * @param {AddLanguageOptions?} options options for this language
                * @returns {i18n} self
                */
  add: function (langCode, data, options) {
    options = options || {};

    const locOptions = {};
    locOptions.plural = options.plural || defaultPlural;
    locOptions.decimal = options.decimal || DEFAULT_DECIMAL_SEPARATOR$1;
    locOptions.thousands = options.thousands || (locOptions.decimal === ',' ? '.' : ',');
    locOptions.decimalOrThousandsRegex = new RegExp(
    '(' + regexEscape(locOptions.decimal) +
    ')|(' + regexEscape(locOptions.thousands) + ')', 'g');

    locs[langCode] = {
      code: langCode,
      data: data,
      options: locOptions };


    if (!activeLanguage) {
      activeLanguage = langCode;
      active = locs[langCode];
    }

    return this;
  },

  /**
      * Get a language object from the localization
      * @public
      * @param {string} lang language code
      * @param {boolean?} tryFallbacks should we try to search in fallback scenarios i.e. 'en' for 'en-US'
      * @returns {{ code: string, data: Object, options: Object }} language object
      */
  getLanguage: function (lang, tryFallbacks) {
    if (tryFallbacks) {
      if (lang === 'iw') lang = 'he'; // Fallback from Google's old spec, if the setting came from an old Android device
      if (!lang) {
        lang = this.getAvailableLanguages()[0];
      }
      let found = null;
      while (typeof lang === 'string') {
        if (found = locs[lang]) break;

        let idx = lang.lastIndexOf('-');

        if (idx < 0)
        idx = lang.lastIndexOf('_');

        if (idx > 0)
        lang = lang.substr(0, idx);else
        break;
      }

      if (!found) {
        lang = this.getAvailableLanguages()[0];
        found = locs[lang];
      }

      return found;
    } else {
      return locs[lang];
    }
  },

  /**
      * Retrieve a i18n value/object
      * Accepted arguments are in the following formats:
      *  (String keypath, [Boolean original], [Object options])
      *  (String key, String key, String key, [Boolean original], [Object options])
      *  (Array keypath, [Boolean original], [Object options])
      *
      * "keypath" is the path to the localized value.
      * When the keypath is a String, each part is separated by a period.
      * When the keypath is an Array, each part is a single part in the path.
      *
      * "original" specifies whether to access the original language, if the current language was extended. Default is false.
      * "options" contains values that can be used in the localization,
      *   and possibly the "count" property which is used for plural values,
      *   or the "gender" property for selecting a gender from the target value.
      *
      * @public
      * @param {...}
      * @returns {*} localized value or object
      */
  t: function () {
    const args = arguments;
    let argIndex = 0,
    keys,
    useOriginal = false,
    locale,
    tryFallback = true,
    options,
    i,
    len;

    // Normalize key(s)
    if (typeof args[0] === 'string' && typeof args[1] !== 'string') {
      keys = args[argIndex++];
      if (keys.length === 0) {
        keys = EMPTY_ARRAY;
      } else {
        keys = keys.split('.');
      }
    } else if (typeof args[0] === 'object' && 'length' in args[0]) {
      keys = args[argIndex++];
    } else if (typeof args[0] === 'string' && typeof args[1] === 'string') {
      let arg;
      keys = [];
      for (len = args.length; argIndex < len; argIndex++) {
        arg = args[argIndex];
        if (typeof arg === 'string') {
          keys.push(arg);
        } else {
          break;
        }
      }
    }

    // `useOriginal` argument
    options = args[argIndex++];
    if (typeof options === 'boolean') {
      useOriginal = options;
      options = args[argIndex];
    }

    // Choose locale
    if (useOriginal) {
      locale = originalLocs[activeLanguage] || active;
    } else {
      locale = active;
    }

    let loc = locale.data;

    // If no key is specified, return the root namespace
    if (!keys.length) {
      return loc;
    }

    // `while` because we might try multiple times,
    // like first try with active locale, second time with fallback locale.
    while (true) {

      if (options && typeof options['count'] === 'number') {// Try for plural form

        // Loop on all of them except the last. We are going to test the last key combined with plural specifiers
        for (i = 0, len = keys.length - 1; i < len; i++) {
          loc = loc[keys[i]];

          // Avoid stepping into an undefined. Make systems more stable.
          // Anyone who queries for an invalid `t(...)` should handle the `undefined` himself.
          if (loc === undefined) {
            break;
          }
        }

        let pluralSpec = locale.options.plural;
        pluralSpec = pluralSpec(options['count']);

        const key = keys[keys.length - 1]; // This is the last key in the keys array

        if (pluralSpec && loc[key + '_' + pluralSpec]) {
          // We have a match for the plural form
          loc = loc[key + '_' + pluralSpec];
        } else {
          // Take the bare one
          loc = loc[key];
        }

      } else {
        // No need for the plural form, as no 'count' was specified

        for (i = 0, len = keys.length; i < len; i++) {
          loc = loc[keys[i]];

          // Avoid stepping into an undefined. Make systems more stable.
          // Anyone who queries for an invalid `t(...)` should handle the `undefined` himself.
          if (loc === undefined) {
            break;
          }
        }
      }

      if (loc === undefined &&
      tryFallback &&
      fallbackLanguage &&
      fallbackLanguage !== activeLanguage) {

        tryFallback = false;

        if (locs.hasOwnProperty(fallbackLanguage)) {
          locale = locs[fallbackLanguage];
          loc = locale.data;
          continue;
        }
      }

      break;
    }

    if (options) {

      if (typeof options['gender'] === 'string') {// Try for gender form

        if (typeof loc === 'object' &&
        !(loc instanceof Array)) {

          const gender = options['gender'];
          let genderized;

          // Allow any gender, you can invent new ones...
          genderized = loc[gender];

          if (genderized === undefined) {

            // Fallback for male/female to m/f
            if (gender === 'male') {
              genderized = loc['m'];
            } else if (gender === 'female') {
              genderized = loc['f'];
            }

            // Fallbacks for neutral gender
            if (genderized === undefined) {
              genderized = loc['neutral'];
            }

            if (genderized === undefined) {
              genderized = loc['n'];
            }

            if (genderized === undefined) {
              genderized = loc[''];
            }

            // Default fallback

            if (genderized === undefined) {
              genderized = loc;
            }
          }

          loc = genderized;
        }

      }
    }

    // Process special value contents based on whether there are `options` provided,
    // or the value contains a special character
    if (options ||
    typeof loc === 'string' && (loc.indexOf('{') > -1 || loc.indexOf('t(') > -1)) {
      loc = i18n.processLocalizedString(loc, options);
    }

    return loc;
  },

  /**
      * Get the decimal seperator for the active locale
      * @public
      * @returns {string} decimal separator
      */
  getDecimalSeparator: function () {
    return active.options.decimal;
  },

  /**
      * Get the thousands seperator for the active locale
      * @public
      * @returns {string} thousands separator
      */
  getThousandsSeparator: function () {
    return active.options.thousands;
  },

  /**
      * Set current active language using a language code.
      * The function will fall back from full to two-letter ISO codes (en-US to en) and from bad Android like codes (en_US to en).
      * @public
      * @param {string} lang the language code to use
      * @returns {i18n} self
      */
  setActiveLanguage: function (lang) {
    const found = this.getLanguage(lang, true);
    active = found;
    activeLanguage = found.code;
    return this;
  },

  /**
      * Set the language code of the fallback language.
      * By default there's no fallback language, so <code>undefined</code> could be returned when a key is not localized.
      * The function will fall back from full to two-letter ISO codes (en-US to en) and from bad Android like codes (en_US to en).
      * Note: For performance reasons, the fallback happens only if <code>setFallbackLanguage(...)</code> is called when all languages are already added. Otherwise, the specified language code is used as it is.
      * @public
      * @param {string} lang the language code to use
      * @returns {i18n} self
      */
  setFallbackLanguage: function (lang) {
    const found = this.getLanguage(lang, true);
    fallbackLanguage = found ? found.code : lang;
    return this;
  },

  /**
      * Set current active language using a language code found in the document's lang attribute or a relevant meta tag.
      * Calls setActiveLanguage to do the dirty work after detecting language code.
      * @public
      * @returns {i18n} self
      */
  setActiveLanguageFromMetaTag: function () {
    let lang = document.documentElement.getAttribute('lang') || document.documentElement.getAttribute('xml:lang');
    if (!lang) {
      const metas = document.getElementsByTagName('meta');
      let i = 0,meta;
      for (; i < metas.length; i++) {
        meta = metas[i];
        if ((meta.getAttribute('http-equiv') || '').toLowerCase() === 'content-language') {
          lang = meta.getAttribute('content');
          break;
        }
      }
    }
    return this.setActiveLanguage(lang);
  },

  /**
      * Get the current active language code.
      * @public
      * @returns {string} current active language code
      */
  getActiveLanguage: function () {
    return activeLanguage;
  },

  /**
      * Get an array of the available language codes
      * @public
      * @returns {string[]} array of the available language codes
      */
  getAvailableLanguages: function () {
    const langs = [];
    for (let key in locs) {
      if (!locs.hasOwnProperty(key)) continue;
      langs.push(key);
    }
    return langs;
  },

  /**
      * Extend a specific language with data from a localized object.
      * In order to allow easy storage and retrieval of extensions from DBs, the extension data is built with
      *   dotted syntax instead of a hieararchy of objects. i.e {"parent.child": "value"}
      * @public
      * @param {string} lang language code
      * @param {Object} data localization object
      * @returns {i18n} self
      */
  extendLanguage: function (lang, data) {
    try {
      if (locs[lang]) {
        if (!originalLocs[lang]) {// Back it up first
          originalLocs[lang] = JSON.parse(JSON.stringify(locs[lang]));
        }
        extendDotted(locs[lang].data, data);
      }
    } catch (e) {}
    return this;
  },

  /**
      * Extend the entire languages array, with the help of the extendLanguage function.
      * @public
      * @param {Object} data the localization extension object. each language as the key and extension object as the value.
      * @returns {i18n} self
      */
  extendLanguages: function (data) {
    try {
      for (let lang in data) {
        if (!data.hasOwnProperty(lang)) continue;
        if (locs[lang]) {
          if (!originalLocs[lang]) {// Back it up first
            originalLocs[lang] = JSON.parse(JSON.stringify(locs[lang]));
          }
          extendDotted(locs[lang].data, data[lang]);
        }
      }
    } catch (e) {}
    return this;
  },

  /**
      * Retrieve a localized string of a physical file size, assuming that the "size_abbrs" key is available.
      * @public
      * @param {number} bytes the number of bytes
      * @returns {LocalizedPhysicalFileSize} localized size
      */
  physicalSize: function (bytes) {
    let ret;
    const loc = i18n.t('size_abbrs');
    if (bytes < 100) ret = { size: bytes, name: loc['b'] };else
    if (bytes < 101376) ret = { size: bytes / 1024.0, name: loc['kb'] };else
    if (bytes < 103809024) ret = { size: bytes / 1024.0 / 1024.0, name: loc['mb'] };else
    if (bytes < 106300440576) ret = { size: bytes / 1024.0 / 1024.0 / 1024.0, name: loc['gb'] };else
    ret = { size: bytes / 1024.0 / 1024.0 / 1024.0 / 1024.0, name: loc['tb'] };
    ret.size = Math.ceil(ret.size * 100) / 100; // Max two decimal points
    return ret;
  },

  /**
      * Format a date to a localized string, assuming that the "calendar" key is available.
      * Supports all formatting codes known to humanity.
      * @public
      * @param {Date|string|number} date The date to format
      * @param {string} format The format
      * @param {string|Object|null|?} culture Can accept a culture code, a culture object,
      *                                       or a simple "calendar" object which contains the keys "months", "months_short", "days" and "days_short"
      * @returns {string} A localized date
      */
  formatDate: function (date, format, culture) {

    if (culture && typeof culture === 'string') {
      culture = i18n.getLanguage(culture, true);

      if (culture) {
        culture = culture['calendar'];
      }
    }

    culture = culture || i18n.t('calendar') || {};

    // Passing date through Date applies Date.parse, if necessary
    if (date == null) {
      date = new Date();
    } else if (typeof date === 'string') {
      date = i18n.parseDate(date, null, culture);
    } else if (date instanceof Date) ; else if (typeof date === 'number') {
      date = new Date(date);
    } else {
      date = NaN;
    }

    if (isNaN(date)) throw new SyntaxError("invalid date");

    let utc = false;

    if (!format) {
      format = 'yyyy-MM-dd'; // ISO
    }

    // Allow setting the utc argument via the a special UTC: specifier
    if (format.substr(0, 4) === 'UTC:') {
      utc = true;
      format = format.slice(4);
    }

    // Allow setting the utc argument via the Z specifier
    if (format.charAt(format.length - 1) === 'Z') {
      utc = true;
    }

    const f = utc ? DATE_FLAG_SUBMAP_UTC : DATE_FLAG_SUBMAP_LOCAL;

    return format.replace(
    DATE_FORMAT_REGEX,
    token => token in DATE_FLAG_MAP ?
    DATE_FLAG_MAP[token](date, f, culture) :
    token.slice(1, token.length - 1));

  },

  /**
      * Parses a date from user input, based on a supplied format. This is the counterpart of the formatDate function.
      * Supports all formatting codes known to humanity.
      * Will automatically fall back if missing a digit i.e 1/2/34 for dd/MM/yyyy, unless `strict` is specified.
      * Forgiving behavior with "incorrect" separators, i.e 01.05 instead of 01/05, unless `strict` is specified.
      * If year is missing, it will default to current year. Anything else will default to zero.
      *
      * This function actually uses the `createDateParser(...)` function, and caches the result.
      * @public
      * @expose
      * @param {string} date The date to parse
      * @param {string?} format The format. Defaults to UTC ISO. (yyyy-MM-DD'T'HH:mm:ssZ)
      * @param {string|Object|null|?} culture Can accept a culture code, a culture object,
      *                                       or a simple "calendar" object which contains the keys "months", "months_short", "days" and "days_short"
      * @param {boolean?} strict Should the parser be strict? false by default, forgiving missing digits etc.
      * @returns {Date} The parsed date
      */
  parseDate: function (date, format, culture, strict) {

    if (culture && typeof culture === 'string') {
      culture = i18n.getLanguage(culture, true);

      if (culture) {
        culture = culture['calendar'];
      }
    }

    culture = culture || i18n.t('calendar') || {};

    if (!format) {
      if ('parse' in Date) {
        return new Date(date);
      } else {
        let parsed = this.parseDate(date, 'yyyy-MM-dd\'T\'HH:mm:ss[.FFFFFFF]Z', culture, true);
        if (isNaN(+parsed)) parsed = this.parseDate(date, 'yyyy-MM-dd', culture, true);
        if (isNaN(+parsed)) parsed = this.parseDate(date, 'ddd, dd, MMM yyyy HH:mm:ss Z', culture, true);
        if (isNaN(+parsed)) parsed = this.parseDate(date, 'dddd, dd-MMM-yy HH:mm:ss Z', culture, true);
        if (isNaN(+parsed)) parsed = this.parseDate(date, 'ddd MMM d HH:mm:ss yyyy', culture, true);
        return parsed;
      }
    }

    let compiled = culture[strict ? '_compiledParsersE' : '_compiledParsers'];
    if (!compiled) {
      culture[strict ? '_compiledParsersE' : '_compiledParsers'] = compiled = {};
    }

    if (!compiled[format]) {
      compiled[format] = i18n.createDateParser(format, culture, strict);
    }

    return compiled[format](date, culture);
  },

  /**
      * Creates a date parser. This is generally used (and cached) by `parseDate(...)`.
      * Supports all formatting codes known to humanity.
      * Will automatically fall back if missing a digit i.e 1/2/34 for dd/MM/yyyy, unless `strict` is specified.
      * Forgiving behavior with "incorrect" separators, i.e 01.05 instead of 01/05, unless `strict` is specified.
      * If year is missing, it will default to current year. Anything else will default to zero.
      * @public
      * @expose
      * @param {string} format The format
      * @param {Object} culture An object which contains the keys "months", "months_short", "days" and "days_short"
      * @param {boolean} strict Should the parser be strict? false by default, forgiving missing digits etc.
      * @returns {function(string):Date} The parser function
      */
  createDateParser: function (format, culture, strict) {

    let regex = '';
    const regexParts = [];

    const processFormat = format => {
      const formatParts = format.match(DATE_PARSER_FORMAT_REGEX);

      let i, count, part, shouldStrict;

      // Remove all empty groups
      for (i = 0, count = formatParts.length; i < count; i++) {
        if (formatParts[i].length === 0 || formatParts[i] === '[]') {
          formatParts.splice(i, 1);
          i--;
          count--;
        }
      }

      // Go over all parts in the format, and create the parser regex part by part
      for (i = 0, count = formatParts.length; i < count; i++) {
        part = formatParts[i];
        if (part[0] === '[' && part[part.length - 1] === ']') {
          regex += '(?:';
          processFormat(part.substr(1, part.length - 2));
          regex += ')?';
        } else if (DATE_PARSER_MAP.hasOwnProperty(part)) {
          // An actually recognized part
          shouldStrict = strict || // We are specifically instructed to use strict mode
          i > 0 && DATE_PARSER_MAP.hasOwnProperty(formatParts[i - 1]) || // Previous part is not some kind of a boundary
          i < count - 1 && DATE_PARSER_MAP.hasOwnProperty(formatParts[i + 1]); // Next part is not some kind of a boundary

          regex += '(' + DATE_PARSER_MAP[part](culture, shouldStrict) + ')';
          regexParts.push(part);
        } else {
          // A free text node

          // Remove enclosing quotes if there are...
          if (part[0] === "'") {
            part = part.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/, '$1');
          } else if (part[0] === '"') {
            part = part.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/, '$1');
          }

          part = part.replace(/\\\\/g, '\\'); // Unescape
          if (!strict && (part === '/' || part === '.' || part === '-')) {
            regex += '([/\\.-])';
          } else {
            regex += '(' + regexEscape(part) + ')';
          }
          regexParts.push('');
        }
      }
    };

    processFormat(format);

    regex = new RegExp('^' + regex + '$');

    // This is for calculating which side to go for 2 digit years
    const baseYear = Math.floor(new Date().getFullYear() / 100) * 100;

    // Return a parser function
    return date => {
      date = date + '';
      const parts = date.match(regex);
      if (!parts) return null;

      parts.splice(0, 1); // Remove main capture group 0

      const now = new Date(),
      nowYear = now.getFullYear();
      let year = null,month = null,day = null,
      hours = null,hours12 = false,hoursTT,minutes = null,
      seconds = null,milliseconds = null,
      timezone = null;

      let i = 0;
      const len = parts.length;
      let part, tmp;
      for (; i < len; i++) {
        part = parts[i];
        switch (regexParts[i]) {
          case 'yyyy':
          case 'yy':
            year = parseInt(part, 10);
            if (year < 100) {
              year += baseYear;
              if (year - nowYear > 50) {
                year -= 100;
              } else if (nowYear - year > 50) {
                year += 100;
              }
            }
            break;

          case 'MMMM':
            tmp = culture['months'].indexOf(part);
            if (tmp > -1) month = tmp;
            break;

          case 'MMM':
            tmp = culture['months_short'].indexOf(part);
            if (tmp > -1) month = tmp;
            break;

          case 'MM':
          case 'M':
            month = parseInt(part, 10) - 1;
            break;

          case 'dddd':
            tmp = culture['days'].indexOf(part);
            if (tmp > -1) day = tmp;
            break;

          case 'ddd':
            tmp = culture['days_short'].indexOf(part);
            if (tmp > -1) day = tmp;
            break;

          case 'dd':
          case 'd':
            day = parseInt(part, 10);
            break;

          case 'HH':
          case 'H':
            hours = parseInt(part, 10);
            hours12 = false;
            break;

          case 'hh':
          case 'h':
            hours = parseInt(part, 10);
            hours12 = true;
            break;

          case 'mm':
          case 'm':
            minutes = parseInt(part, 10);
            break;

          case 'ss':
          case 's':
            seconds = parseInt(part, 10);
            break;

          case 'l':
            milliseconds = parseInt(part, 10);
            break;

          case 'L':
            milliseconds = parseInt(part, 10);
            if (milliseconds < 10) {
              milliseconds *= 100;
            } else {
              milliseconds *= 10;
            }
            break;

          case 'f':
          case 'ff':
          case 'fff':
          case 'ffff':
          case 'fffff':
          case 'ffffff':
          case 'fffffff':
          case 'F':
          case 'FF':
          case 'FFF':
          case 'FFFF':
          case 'FFFFF':
          case 'FFFFFF':
          case 'FFFFFFF':
            if (part.length > 3) {
              part = part.substr(0, 3) + '.' + part.substr(3);
            } else if (part.length < 3) {
              while (part.length < 3) {
                part += '0';
              }
            }
            milliseconds = parseFloat(part);
            break;

          case 'tt':
          case 't':
          case 'TT':
          case 'T':
            if (hours12) {
              hoursTT = part.toLowerCase();
            }
            break;

          case 'Z':
          case 'UTC':
          case 'o':
            const tz = part.match(/(Z)|(?:GMT|UTC)?([+-][0-9]{2,4})(?:\([a-zA-Z ]+ (?:Standard|Daylight|Prevailing) Time\))?/);
            if (tz[1] === 'Z') {
              timezone = 0;
            } else if (tz[2]) {
              timezone = (parseInt(tz[2].substr(1, 2), 10) || 0) * 60 + (parseInt(tz[2].substr(3), 10) || 0);
              if (tz[2].charAt(0) === '-') {
                timezone = -timezone;
              }
            }
            break;}

      }

      if (year === null) year = now.getFullYear();
      if (month === null) month = now.getMonth();
      if (day === null) day = 1;
      if (hours12) {
        if (hoursTT === (culture['am_lower'] || 'am').toLowerCase() ||
        hoursTT === (culture['am_short_lower'] || 'a').toLowerCase()) {
          if (hours === 12) hours = 0;
        } else if (hoursTT === (culture['pm_lower'] || 'pm').toLowerCase() ||
        hoursTT === (culture['pm_short_lower'] || 'p').toLowerCase()) {
          if (hours < 12) hours += 12;
        }
      }
      const parsedDate = new Date(year, month, day, hours || 0, minutes || 0, seconds || 0, milliseconds || 0);
      if (timezone !== null) {
        timezone += parsedDate.getTimezoneOffset();
      }
      parsedDate.setMinutes(parsedDate.getMinutes() - timezone);

      return parsedDate;
    };
  },

  /**
      * Try to detect, based on the browser's localization, which is the short date format appropriate.
      * So allegedly, a US user will have MM/dd/yyyy and GB will have d/MM/yyyy.
      * Currently browsers do not seem to behave and use the correct formats of the OS!
      * @public
      * @expose
      * @param {string} fallback a fallback date for a case where the browser does not support this functionality.
      * @returns {string} the detected format, the fallback, or dd/MM/yyyy as default.
      */
  detectShortDateFormat: function (fallback) {
    if (!Date.prototype.toLocaleDateString) return fallback || 'dd/MM/yyyy';

    return new Date(2013, 1, 1).toLocaleDateString().
    replace(/\b2013\b/, 'yyyy').replace(/\b13\b/, 'yy').
    replace(/\b02\b/, 'MM').replace(/\b2\b/, 'M').
    replace(/\b01\b/, 'dd').replace(/\b1\b/, 'd');
  },

  /**
      * Format a number for display using the correct decimal separator detected from the browser.
      * @public
      * @expose
      * @param {number|null} value the value to format.
      * @param {boolean=} thousands should we add a thousands separator
      * @returns {string} The formatted number as string.
      *                   If null or empty string is supplied, then an empty string is returned.
      *                   If anything other than a `Number` was supplied, it is only processed by calling `.toLocaleString()`.
      */
  displayNumber: function (value, thousands) {
    if (value === null || value === undefined) return '';

    if (typeof value === 'number') {
      value = value.toString();
      return i18n.formatRawNumberStringForDisplay(value, thousands);
    }

    return value.toLocaleString();
  },

  /**
      * Format a stringified number for display using the correct decimal separator detected from the browser.
      * @public
      * @expose
      * @param {string} value the value to format.
      * @param {boolean=} thousands should we add a thousands separator
      * @returns {string} The formatted number as string.
      */
  formatRawNumberStringForDisplay: function (value, thousands) {
    if (value === '') return '';

    const decimalSep = active.options.decimal,
    thousandsSep = active.options.thousands;

    if (decimalSep !== '.') {
      value = value.replace(/\./g, decimalSep);
    }
    if (thousands) {
      let decIndex = value.indexOf(decimalSep);
      if (decIndex === -1) {
        decIndex = value.length;
      }
      const sign = value.charAt(0) === '-' ? 1 : 0;
      if (decIndex - sign > 3) {
        let sepValue = '';
        const major = value.substr(sign, decIndex - sign);
        let fromIndex = 0,toIndex = major.length % 3;
        while (fromIndex < major.length) {
          if (fromIndex > 0) {
            sepValue += thousandsSep;
          }
          sepValue += major.substring(fromIndex, toIndex);
          fromIndex = toIndex;
          toIndex = fromIndex + 3;
        }
        value = (sign ? '-' : '') + sepValue + value.substr(decIndex);
      }
    }

    return value;
  },

  /**
      * Parses a number from user input using the correct decimal separator detected from the browser.
      *
      * By default it will behave like `parseFloat`, where thousands separators are not supported.
      * If `thousands` is `true`, then it will allow parsing with the separator.
      * @public
      * @expose
      * @param {number|string|null} value the value to parse.
      * @param {boolean?} [thousands=false] - Don't break when there are thousands separators in the value
      * @returns {number|null} The parsed number.
      *                   If null or empty string is supplied, then null is returned.
      *                   If a number was supplied, it is returned as-is.
      */
  parseNumber: function (value, thousands) {
    if (value === '' || value == null) return null;

    if (typeof value !== 'number') {
      return parseFloat(
      value.replace(active.options.decimalOrThousandsRegex, function (g0, dec, tho) {
        if (dec) return '.';
        if (tho) return thousands ? '' : ',';
        return g0;
      }));

    }

    return value;
  },

  /**
      * Process a localized string.
      *
      * Pass 1:
      *      Look for localization value specified in the form of:
      *          {key.subkey}
      *          {key.subkey|filter|filter...}
      *
      *      Possible filters are:
      *          html
      *          htmll - multiline HTML. replaces \n with <br />
      *          json
      *          url
      *          lower
      *          upper
      *          upperfirst
      *          printf [print-specifier]
      *
      *      * `printf-specifier`s are C-style format specifiers. i.e. 2.5f
      *      * The i18n keys will receive the `data` passed to `processLocalizedString`
      *
      *      And for placeholders from the passed options, in the form of:
      *          {{count}}
      *          {{data.value|filter|filter...}}
      *
      *          etc.
      *
      * Pass 2:
      *      Look for i18n calls in the form of:
      *          t("key.path") t('key.path') t(key.path) or t("key.path", {"count": 5})
      *      Where the options part must be a valid JSON
      *      This stage is affected by previous stages (i.e placeholders can be JSON encoded for t(...) calls
      *
      * localization format is {key.path[|filter][|filter]}
      * Placeholder format is {{key.path[|filter][|filter]}}
      *
      * Printf specifiers are in this order:
      *
      *  "[+][ ][#][0][width][,][.precision]" and then one of [bcdieEfgouxXs]
      *
      * +            : Forces to precede the result with a plus or minus sign (+ or -) even for positive numbers.
      * (space)      : If no sign is going to be written, a blank space is inserted before the value.
      * #            : For o, x or X specifiers the value is prefixed with 0, 0x or 0X respectively for values different than zero.
      *                For with e, E, f, g it forces the written output to contain a decimal point even if no more digits follow
      * 0            : Left-pads the number with zeroes (0) instead of spaces when padding is specified
      * (width)      : Minimum number of characters to be printed, left-padded with spaces or zeroes.
      *                If shorter than the number, then the number is not truncated.
      * ,            : For d, i, u, f, g specifiers, adds thousand grouping characters
      * (precision)  : For integer specifiers (d, i, u, o, x, X) - specifies the minimum number of digits to be written. Does not truncate, except for 0.
      *                For e, E, f specifiers: this is the number of digits to be printed after the decimal point
      *                For g specifier: This is the maximum number of significant digits to be printed.
      *                For s: this is the maximum number of characters to be printed
      *
      * @param {string} value - the value to process
      * @param {Object?} data - the data for post processing. Passed to {...} specifiers too.
      * @returns {string} the processed value
      */
  processLocalizedString: function (value, data) {

    if (typeof value !== 'string') return value;

    value = value.replace(/(\\*)(\{{1,2})([^|{}"]+)((?:\|[^|{}]+)*?)(}{1,2})/g, function () {

      const precedingBackslahes = arguments[1];
      const openingBrackets = arguments[2];
      const closingBrackets = arguments[5];

      if ((precedingBackslahes.length & 1) === 1) {
        return arguments[0].substr(precedingBackslahes.length - (precedingBackslahes.length - 1) / 2);
      }

      if (openingBrackets.length > closingBrackets.length) {
        return arguments[0];
      }

      let value;
      const key = arguments[3];
      let i, len;

      let filters = arguments[4];
      if (filters) {
        filters = filters.length > 0 ? filters.split('|') : EMPTY_ARRAY;

        // Remove first | split (always empty) so gender could be quickly matched
        while (filters[0] === '')
        filters.shift();
      }

      if (openingBrackets.length === 1) {

        /** @type string|null */
        let gender = null;
        if (filters && filters[0][0] === 'g' && filters[0][1] === ':') {
          gender = i18n.t(filters[0].substr(2));

          if (gender === 'male') {
            gender = 'm';
          } else if (gender === 'female') {
            gender = 'f';
          }
        }

        if (gender !== null) {
          value = i18n.t(key + '.' + gender);
          if (value === undefined) value = i18n.t(key + '.neutral');
          if (value === undefined) value = i18n.t(key + '.');
          if (value === undefined) value = i18n.t(key + '.m');
          if (value === undefined) value = i18n.t(key + '.f');
        } else {
          value = i18n.t(key, data);
        }

      } else {

        const keys = key.split('.');
        value = data;
        for (i = 0, len = keys.length; i < len && value; i++) {
          value = value[keys[i]];
        }
        if (value == null) {
          value = '';
        }

      }

      for (i = 0, len = filters.length; i < len; i++) {
        if (filters[i].length === 0) continue;
        value = encodeValue(value, filters[i]);
      }

      if (closingBrackets.length > openingBrackets.length) {
        value = value + closingBrackets.substr(openingBrackets.length);
      }

      return (precedingBackslahes.length ?
      precedingBackslahes.substr(precedingBackslahes.length / 2) :
      '') + value;
    });

    value = value.replace(/t\(("[^"]+?"|'[^']+?'|[^,)]+?)(?:,\s*(\{.*?}))?\)/g, function () {

      let key = arguments[1],
      options = arguments[2];
      try {
        key = JSON.parse(key);
      } catch (e) {
        return arguments[0];
      }
      if (options) {
        try {
          options = JSON.parse(options);
        } catch (e) {
          options = null;
        }
      }

      return i18n.t(key, options);

    });

    return value;

  } };

module.exports = i18n;

//# sourceMappingURL=i18n.cjs.js.map