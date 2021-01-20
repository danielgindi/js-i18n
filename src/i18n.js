'use strict';

import { extendDotted, regexEscape, supportsRegexLookbehind } from './utils';
import {
    DATE_FORMAT_REGEX,
    DATE_FLAG_SUBMAP_LOCAL,
    DATE_FLAG_SUBMAP_UTC,
    DATE_FLAG_MAP,
    DATE_PARSER_FORMAT_REGEX,
    DATE_PARSER_MAP,
} from './date_formats';
import { applySpecifiers } from './printf_specs';

const hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 *
 * To add a language, call i18n.add('language-code', {translation}, {options})
 * Where options takes the following keys:
 * "plural": function that takes a number, and returns a key suffix for plural form of that count.
 * "decimal": decimal separator character. The default is auto-detected from the browser locale
 * "thousands": thousands separator character. The default is auto-detected from the browser locale
 *
 */

const DEFAULT_DECIMAL_SEPARATOR = (1.1).toLocaleString().substr(1, 1);
const EMPTY_ARRAY = [];

let activeLanguage = '';
let fallbackLanguage = '';
let active = null;

let locs = {}; // Here we will keep i18n objects, each key is a language code
let originalLocs = {}; // Here we will keep original localizations before using extendLanguage

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
        value = (value == null ? '' : (value + '')).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;").replace(/"/g, "&quot;");
    }
    else if (encoding === 'htmll') {
        value = (value == null ? '' : (value + '')).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;").replace(/"/g, "&quot;").replace(/\n/g, "<br />");
    }
    else if (encoding === 'json') {
        value = JSON.stringify(value);
    }
    else if (encoding === 'url') {
        value = encodeURIComponent(value);
    }
    else if (encoding === 'lower') {
        value = (value + '').toLowerCase();
    }
    else if (encoding === 'upper') {
        value = (value + '').toUpperCase();
    }
    else if (encoding === 'upperfirst') {
        value = value + '';
        value = value[0].toUpperCase() + value.substr(1).toLowerCase();
    }
    else if (encoding.substr(0, 7) === 'printf ') {
        const localeOptions = active.options;
        value = applySpecifiers(value, encoding.substr(7), localeOptions.decimal, localeOptions.thousands);
    }

    return value;
};

const BASE_REGEX = (() => {
    if (supportsRegexLookbehind()) {
        return new RegExp('(\\\\*)({{1,2})((?:[^|{}]|(?<!\\\\)(?:\\\\\\\\)*[^|{}])+)((?:\\|[^|{}]+)*?)((?<!\\\\)(?:\\\\\\\\)*}{1,2})', 'g');
    } else {
        return /(\\*)({{1,2})([^|{}]+)((?:\|[^|{}]+)*?)(}{1,2})/g;
    }
})();

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
        locOptions.decimal = options.decimal || DEFAULT_DECIMAL_SEPARATOR;
        locOptions.thousands = options.thousands || (locOptions.decimal === ',' ? '.' : ',');
        locOptions.decimalOrThousandsRegex = new RegExp(
            '(' + regexEscape(locOptions.decimal) +
            ')|(' + regexEscape(locOptions.thousands) + ')', 'g');

        locs[langCode] = {
            code: langCode,
            data: data,
            options: locOptions,
        };

        delete originalLocs[langCode];

        if (!activeLanguage) {
            activeLanguage = langCode;
            active = locs[langCode];
        }

        return this;
    },

    /**
     * Remove all languages
     */
    reset: function () {
        locs = {};
        originalLocs = {};
        activeLanguage = '';
        active = null;
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
                if ((found = locs[lang])) break;

                let idx = lang.lastIndexOf('-');

                if (idx < 0)
                    idx = lang.lastIndexOf('_');

                if (idx > 0)
                    lang = lang.substr(0, idx);
                else break;
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
        while (true) { // eslint-disable-line no-constant-condition

            if (options && typeof options['count'] === 'number') { // Try for plural form

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

                if (hasOwnProperty.call(locs, fallbackLanguage)) {
                    locale = locs[fallbackLanguage];
                    loc = locale.data;
                    continue;
                }
            }

            break;
        }

        if (options) {

            if (typeof options['gender'] === 'string') { // Try for gender form

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
            (typeof loc === 'string' && (loc.indexOf('{') > -1 || loc.indexOf('t(') > -1))) {
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
            let i = 0, meta;
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
            if (!hasOwnProperty.call(locs, key)) continue;
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
        if (locs[lang]) {
            if (!originalLocs[lang]) { // Back it up first
                originalLocs[lang] = JSON.parse(JSON.stringify(locs[lang]));
            }
            extendDotted(locs[lang].data, data);
        }
        return this;
    },

    /**
     * Extend the entire languages array, with the help of the extendLanguage function.
     * @public
     * @param {Object} data the localization extension object. each language as the key and extension object as the value.
     * @returns {i18n} self
     */
    extendLanguages: function (data) {
        for (let lang in data) {
            if (!hasOwnProperty.call(data, lang)) continue;
            if (locs[lang]) {
                if (!originalLocs[lang]) { // Back it up first
                    originalLocs[lang] = JSON.parse(JSON.stringify(locs[lang]));
                }
                extendDotted(locs[lang].data, data[lang]);
            }
        }
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
        if (bytes < 100) ret = { size: bytes, name: loc['b'] };
        else if (bytes < 101376) ret = { size: bytes / 1024.0, name: loc['kb'] };
        else if (bytes < 103809024) ret = { size: bytes / 1024.0 / 1024.0, name: loc['mb'] };
        else if (bytes < 106300440576) ret = { size: bytes / 1024.0 / 1024.0 / 1024.0, name: loc['gb'] };
        else ret = { size: bytes / 1024.0 / 1024.0 / 1024.0 / 1024.0, name: loc['tb'] };
        ret.size = (Math.ceil(ret.size * 100) / 100); // Max two decimal points
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
        } else if (date instanceof Date) {
            // date = new Date(date);
        } else if (typeof date === 'number') {
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
                token => (token in DATE_FLAG_MAP)
                    ? (DATE_FLAG_MAP[token])(date, f, culture)
                    : token.slice(1, token.length - 1),
        );
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
                let parsed = this.parseDate(date, 'yyyy-MM-dd\'T\'HH:mm:ss.FFFFFFFZ', culture, true);
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
                    // optional part
                    regex += '(?:';
                    processFormat(part.substr(1, part.length - 2));
                    regex += ')?';
                }
                else if (hasOwnProperty.call(DATE_PARSER_MAP, part)) {
                    // An actually recognized part
                    shouldStrict = strict || // We are specifically instructed to use strict mode
                        (i > 0 && hasOwnProperty.call(DATE_PARSER_MAP, formatParts[i - 1])) || // Previous part is not some kind of a boundary
                        (i < count - 1 && hasOwnProperty.call(DATE_PARSER_MAP, formatParts[i + 1])); // Next part is not some kind of a boundary

                    let parserOption = DATE_PARSER_MAP[part](culture, shouldStrict);
                    let isRaw = false;
                    if (Array.isArray(parserOption)) {
                        parserOption = parserOption[0];
                        isRaw = !!parserOption[1];
                    }

                    regex += isRaw ? parserOption : ('(' + parserOption + ')');
                    regexParts.push(part);
                }
                else {
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
        const baseYear = Math.floor((new Date()).getFullYear() / 100) * 100;

        // Return a parser function
        return date => {
            date = date + '';
            const parts = date.match(regex);
            if (!parts) return null;

            parts.splice(0, 1); // Remove main capture group 0

            const now = new Date(),
                nowYear = now.getFullYear();
            let year = null, month = null, day = null,
                hours = null, hours12 = false, hoursTT, minutes = null,
                seconds = null, milliseconds = null,
                timezone = null;

            let i = 0;
            const len = parts.length;
            let part, tmp;
            for (; i < len; i++) {
                part = parts[i];
                if (part === undefined) continue;
                
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
                    case '.F':
                    case '.FF':
                    case '.FFF':
                    case '.FFFF':
                    case '.FFFFF':
                    case '.FFFFFF':
                    case '.FFFFFFF':
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
                    case 'o': {
                        const tz = part.match(/(Z)|(?:GMT|UTC)?([+-][0-9]{2}(?::?[0-9]{2}))(?:\([a-zA-Z ]+ (?:Standard|Daylight|Prevailing) Time\))?/);
                        if (tz[1] === 'Z') {
                            timezone = 0;
                        } else if (tz[2]) {
                            let z1 = tz[2].substr(1, 2);
                            let z2 = tz[2].substr(3);
                            if (z2[0] === ':')
                                z2 = z2.substr(1);

                            timezone = (parseInt(z1, 10) || 0) * 60 + (parseInt(z2, 10) || 0);
                            if (tz[2].charAt(0) === '-') {
                                timezone = -timezone;
                            }
                        }
                        break;
                    }
                    
                    case 'K': {
                        const tz = part.match(/(Z)|([+-][0-9]{2}(?::[0-9]{2}))|/);
                        if (tz[1] === 'Z') {
                            timezone = 0;
                        } else if (tz[2]) {
                            let z1 = tz[2].substr(1, 2);
                            let z2 = tz[2].substr(3);
                            if (z2[0] === ':')
                                z2 = z2.substr(1);

                            timezone = (parseInt(z1, 10) || 0) * 60 + (parseInt(z2, 10) || 0);
                            if (tz[2].charAt(0) === '-') {
                                timezone = -timezone;
                            }
                        }
                        break;
                    }
                }
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

        return new Date(2013, 1, 1).toLocaleDateString()
            .replace(/\b2013\b/, 'yyyy').replace(/\b13\b/, 'yy')
            .replace(/\b02\b/, 'MM').replace(/\b2\b/, 'M')
            .replace(/\b01\b/, 'dd').replace(/\b1\b/, 'd');
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
                let fromIndex = 0, toIndex = major.length % 3;
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
                }),
            );
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
     *                For e, E, f, g it forces the written output to contain a decimal point even if no more digits follow
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

        value = value.replace(BASE_REGEX, function () {

            const precedingBackslahes = arguments[1];
            const openingBrackets = arguments[2];
            let closingBrackets = arguments[5];
            let key = arguments[3];

            let escPos = closingBrackets.lastIndexOf('\\');
            if (escPos !== -1) {
                key += closingBrackets.substr(0, (escPos + 1) / 2);
                closingBrackets = closingBrackets.substr(escPos + 1);
            }

            if ((precedingBackslahes.length & 1) === 1) {
                return arguments[0].substr(precedingBackslahes.length - (precedingBackslahes.length - 1) / 2);
            }

            if (openingBrackets.length > closingBrackets.length) {
                return arguments[0];
            }

            let value;
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

        value = value.replace(/t\(("[^"]+?"|'[^']+?'|[^,)]+?)(?:,\s*({.*?}))?\)/g, function () {

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

    },

};

/**
 * @typedef {Object} LocalizedPhysicalFileSize
 * @property {number} size
 * @property {string} name
 * */
/** */

/**
 * This function returns a key suffix for plural form, for the specified count.
 * @typedef {function(count:number):string} PluralFormFunction
 * @param {number} count the number that we need to inspect
 * @returns {string}
 * */
/** */

/**
 * @typedef {Object} AddLanguageOptions
 * @property {PluralFormFunction} plural - function that takes a number, and returns a key suffix for plural form of that count.
 * @property {string} [decimal='.'] - decimal separator character. The default is auto-detected from the browser locale
 * @property {string} [thousands=','] - thousands separator character. The default is auto-detected from the browser locale
 * */
/** */

export default i18n;
export const t = i18n.t;
