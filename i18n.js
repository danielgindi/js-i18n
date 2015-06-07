/*
 Written by Daniel Cohen Gindi (danielgindi@gmail.com)
 https://github.com/danielgindi/js-i18n

 The MIT License (MIT)

 Copyright (c) 2014 Daniel Cohen Gindi

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */
(function () {
    'use strict';

    /**
     *
     * To add a language, call i18n.add('language-code', {translation}, {options})
     * Where options takes the following keys:
     * "plural": function that takes a number, and returns a key suffix for plural form of that count.
     * "decimal": decimal separator character. The default is auto-detected from the browser locale
     * "thousands": thousands separator character. The default is auto-detected from the browser locale
     *
     */

    /** @const */
    var DEFAULT_DECIMAL_SEPARATOR = (1.1).toLocaleString().substr(1, 1);

    /** @const */
    var DEFAULT_THOUSANDS_SEPARATOR = DEFAULT_DECIMAL_SEPARATOR === ',' ? '.' : ',';

    /** @const */
    var DEFAULT_DECIMAL_SEPARATOR_REGEX = new RegExp('\\' + DEFAULT_DECIMAL_SEPARATOR, 'g');

    /** @const */
    var DECIMAL_SEPARATOR_REGEX_PERIOD = new RegExp('\\.g');

    /** @const */
    var DECIMAL_SEPARATOR_REGEX_COMMA = new RegExp('\\,g');

    var activeLanguage = '';
    var active = null;
    var locs = {}; // Here we will keep i18n objects, each key is a language code
    var originalLocs = {}; // Here we will keep original localizations before using extendLanguage

    var _escapeRgx = /([\/()[\]?{}|*+-\\:])/g;
    var regexEscape = function (string) {
        return string.replace(_escapeRgx, '\\$1');
    };
    var arrayIndexOf = function (array, searchElement, fromIndex) {
        var k, o = array;
        var len = o.length >>> 0;
        if (len === 0) {
            return -1;
        }
        var n = +fromIndex || 0;
        if (Math.abs(n) === Infinity) {
            n = 0;
        }
        if (n >= len) {
            return -1;
        }
        k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
        while (k < len) {
            if (k in o && o[k] === searchElement) {
                return k;
            }
            k++;
        }
        return -1;
    };

    /**
     * The default plural form specifier.
     * This function returns a specifier for plural form, for the specified count.
     * @param {Number} count the number that we need to inspect
     * @returns {string}
     */
    var defaultPlural = function (count) {
        if (count == 0) return 'zero';
        if (count == 1) return 'one';
        return 'plural';
    };

    /**
     * Encodes the value {value} using the specified {encoding}
     * @param {String} value the value to encode
     * @param {String} encoding either html, json or url
     * @returns {*}
     */
    var encodeValue = function (value, encoding) {
        if (encoding === 'html') {
            value = (value == null ? '' : (value + '')).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        } else if (encoding === 'htmll') {
            value = (value == null ? '' : (value + '')).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;").replace(/"/g, "&quot;").replace(/\n/g, "<br />");
        } else if (encoding === 'json') {
            value = JSON.stringify(value);
        } else if (encoding === 'url') {
            value = encodeURIComponent(value);
        }
        return value;
    };

    /**
     * Pad a value with characters on the left
     * @param {String} value the value to pad
     * @param {Number} length minimum length for the output
     * @param {String} ch the character to use for the padding
     * @returns {*}
     */
    var padLeft = function (value, length, ch) {
        value = value.toString();
        while (value.length < length) {
            value = ch + value;
        }
        return value;
    };

    /**
     * This will process value with printf specifier format
     * @param {*} value the value to process
     * @param {String?} specifiers the printf style specifiers. i.e. '2.5f', 'E', '#x'
     * @param {String?} decimalSign the decimal separator character to use
     * @param {String?} thousandsSign the thousands separator character to use
     * @returns {String}
     */
    var applySpecifiers = function (value, specifiers, decimalSign, thousandsSign) {
        if (!specifiers) return value;

        var type = specifiers[specifiers.length - 1];
        specifiers = specifiers.substr(0, specifiers.length - 1);

        var isNumeric =
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
        var isDecimalNumeric =
            type === 'e' ||
            type === 'E' ||
            type === 'f' ||
            type === 'g';
        var isUpperCase =
            type === 'E' ||
            type === 'X';

        if (isNumeric) {
            if (typeof value !== 'number') {
                value = parseInt(value, 10);
            }
            if (type === 'u') {
                value = value >>> 0;
            }

            var parsedSpecifiers = specifiers.match(/(\+)?( )?(#)?(0)?([0-9]+)?(,)?(.([0-9]+))?/);
            var forceSign = parsedSpecifiers[1] === '+',
                spaceSign = parsedSpecifiers[2] === ' ',
                radiiOrDecimalSign = parsedSpecifiers[3] === '#',
                padZero = parsedSpecifiers[4] === '0',
                padCount = parsedSpecifiers[5] ? parseInt(parsedSpecifiers[5], 10) : 0,
                hasThousands = parsedSpecifiers[6],
                precision = parsedSpecifiers[8];

            if (precision) {
                precision = parseInt(precision, 10);
            }

            decimalSign = decimalSign || DEFAULT_DECIMAL_SEPARATOR;
            thousandsSign = thousandsSign || DEFAULT_THOUSANDS_SEPARATOR;
        }

        if (type === 'b') {
            value = value.toString(2);
        } else if (type === 'c') {
            value = String.fromCharCode(value);
        } else if (type === 'd' || type === 'i' || type === 'u') {
            value = value.toString();
        } else if (type === 'e' || type === 'E') {
            value = (precision !== undefined ? value.toExponential(parseInt(precision, 10)) : value.toExponential()).toString();
        } else if (type === 'f') {
            value = (precision !== undefined ? parseFloat(value).toFixed(parseInt(precision, 10)) : parseFloat(value)).toString();
        } else if (type === 'g') {
            value = parseFloat(value).toString();
            if (precision !== undefined) {
                var decimalIdx = value.indexOf('.');
                if (decimalIdx > -1) {
                    value = value.substr(0, decimalIdx + (precision > 0 ? 1 : 0) + precision);
                }
            }
        } else if (type === 'o') {
            value = value.toString(8);
        } else if (type === 'x' || type === 'X') {
            value = value.toString(16);
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
            var decIndex = value.indexOf(decimalSign);
            if (decIndex === -1) {
                decIndex = value.length;
            }
            var signIndex = value.charAt(0) === '-' ? 1 : 0;
            if (decIndex - signIndex > 3) {
                var sepValue = '';
                var major = value.substr(signIndex, decIndex - signIndex);
                var fromIndex = 0, toIndex = major.length % 3;
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
            var sign = (value.charAt(0) === '-' ? '-' : (forceSign ? '+' : '')) || (spaceSign ? ' ' : '');

            // Remove the - sign
            if (sign === '-') {
                value = value.substr(1);
            }

            var radiiSign = '';

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
    };

    /** @typedef i18n */
    var i18n = {

        /**
         * Add a language to the localization object
         * @public
         * @expose
         * @param {String} lang language code
         * @param {Object} loc localization object
         * @param {ADD_LANGUAGE_OPTIONS?} options options for this language
         * @returns {i18n} self
         */
        add: function (lang, loc, options) {
            locs[lang] = loc;
            options = options || {};
            var locOptions = loc['__options__'] = {};
            locOptions.plural = options.plural || defaultPlural;
            locOptions.decimal = options.decimal || DEFAULT_DECIMAL_SEPARATOR;
            locOptions.thousands = options.thousands || (locOptions.decimal === ',' ? '.' : ',');
            locOptions.decimalRegex = locOptions.decimal === '.' ? DECIMAL_SEPARATOR_REGEX_PERIOD :
                (locOptions.decimal === ',' ? DECIMAL_SEPARATOR_REGEX_COMMA : new RegExp('\\' + locOptions.decimal + 'g'));
            return this;
        },

        /**
         * Get a language object from the localization
         * @public
         * @expose
         * @param {String} lang language code
         * @param {Boolean?} tryFallbacks should we try to search in fallback scenarios i.e. 'en' for 'en-US'
         * @param {Boolean?} returnCode should we return the language code as well
         * @returns {Object} language object
         */
        getLanguage: function (lang, tryFallbacks, returnCode) {
            if (tryFallbacks) {
                if (lang === 'iw') lang = 'he'; // Fallback from Google's old spec, if the setting came from an old Android device
                if (!lang) {
                    lang = this.getAvailableLanguages()[0];
                }
                var found = null;
                while (typeof lang === 'string') {
                    if (found = locs[lang]) break;
                    var idx = lang.lastIndexOf('-');
                    if (idx < 0) {
                        idx = lang.lastIndexOf('_');
                    }
                    if (idx > 0) {
                        lang = lang.substr(0, idx);
                    }
                    else break;
                }
                if (!found) {
                    lang = this.getAvailableLanguages()[0];
                    found = locs[lang];
                }
                if (returnCode) {
                    return { 'code': lang, 'lang': found };
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
         * "options" contains values that can be used in the localization, and possibly the "count" property which is used for plural values.
         *
         * @public
         * @expose
         * @param {...}
         * @returns {*} localized value or object
         */
        t: function () {
            var args = arguments,
                argIndex = 0,
                keys,
                useOriginal = false,
                loc,
                options,
                i,
                len;

            if (typeof args[0] === 'string' && typeof args[1] !== 'string') {
                keys = args[argIndex++];
                if (keys.length === 0) {
                    keys = [];
                } else {
                    keys = keys.split('.');
                }
            } else if (typeof args[0] === 'object' && 'length' in args[0]) {
                keys = args[argIndex++];
            } else if (typeof args[0] === 'string' && typeof args[1] === 'string') {
                var arg;
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

            options = args[argIndex++];
            if (typeof options === 'boolean') {
                useOriginal = options;
                options = args[argIndex];
            }

            if (useOriginal) {
                loc = originalLocs[activeLanguage] || active;
            } else {
                loc = active;
            }

            // If not key is specified, return the root namespace
            if (!keys.length) {
                return loc;
            }

            if (options && typeof options['count'] === 'number') { // Try for plural form

                // Loop on all of them except the last. We are going to test the last key combined with plural specifiers
                for (i = 0, len = keys.length - 1; i < len; i++) {
                    loc = loc[keys[i]];
                }

                var pluralSpec = active['__options__'].plural;
                pluralSpec = pluralSpec(options['count']);

                var key = keys[keys.length - 1]; // This is the last key in the keys array

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
                }
            }

            if (options) {
                loc = i18n.processLocalizedString(loc, options);
            }

            return loc;
        },

        /**
         * Get the decimal seperator for the active locale
         * @public
         * @expose
         * @returns {String} decimal separator
         */
        getDecimalSeparator: function () {
            return active['__options__'].decimal;
        },

        /**
         * Get the thousands seperator for the active locale
         * @public
         * @expose
         * @returns {String} thousands separator
         */
        getThousandsSeparator: function () {
            return active['__options__'].thousands;
        },

        /**
         * Set current active language using a language code.
         * The function will fall back from full to two-letter ISO codes (en-US to en) and from bad Android like codes (en_US to en).
         * @public
         * @expose
         * @param {String} lang the language code to use
         * @returns {i18n} self
         */
        setActiveLanguage: function (lang) {
            var found = this.getLanguage(lang, true, true);
            active = found.lang;
            activeLanguage = found.code;
            return this;
        },

        /**
         * Set current active language using a language code found in the document's lang attribute or a relevant meta tag.
         * Calls setActiveLanguage to do the dirty work after detecting language code.
         * @public
         * @expose
         * @returns {i18n} self
         */
        setActiveLanguageFromMetaTag: function () {
            var lang = document.documentElement.getAttribute('lang') || document.documentElement.getAttribute('xml:lang');
            if (!lang) {
                var metas = document.getElementsByTagName('meta');
                for (var i = 0, meta; i < metas.length; i++) {
                    meta = metas[i];
                    if ((meta.getAttribute('http-equiv') || '').toLowerCase() == 'content-language') {
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
         * @expose
         * @returns {String} current active language code
         */
        getActiveLanguage: function () {
            return activeLanguage;
        },

        /**
         * Get an array of the available language codes
         * @public
         * @expose
         * @returns {Array<String>} array of the available language codes
         */
        getAvailableLanguages: function () {
            var langs = [];
            for (var key in locs) {
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
         * @expose
         * @param {String} lang language code
         * @param {Object} data localization object
         * @returns {i18n} self
         */
        extendLanguage: function (lang, data) {
            try {
                if (locs[lang]) {
                    if (!originalLocs[lang]) { // Back it up first
                        originalLocs[lang] = JSON.parse(JSON.stringify(locs[lang]));
                    }
                    extendDotted(locs[lang], data);
                }
            } catch (e) { }
            return this;
        },

        /**
         * Extend the entire languages array, with the help of the extendLanguage function.
         * @public
         * @expose
         * @param {Object} data the localization extension object. each language as the key and extension object as the value.
         * @returns {i18n} self
         */
        extendLanguages: function (data) {
            try {
                for (var lang in data) {
                    if (!data.hasOwnProperty(lang)) continue;
                    if (locs[lang]) {
                        if (!originalLocs[lang]) { // Back it up first
                            originalLocs[lang] = JSON.parse(JSON.stringify(locs[lang]));
                        }
                        extendDotted(locs[lang], data[lang]);
                    }
                }
            } catch (e) { }
            return this;
        },

        /**
         * Retrieve a localized string of a physical file size, assuming that the "size_abbrs" key is available.
         * @public
         * @expose
         * @param {Number} bytes the number of bytes
         * @returns {LOCALIZED_PHYSICAL_FILE_SIZE} localized size
         */
        physicalSize: function (bytes) {
            var ret,
                loc = active['size_abbrs'];
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
         * @expose
         * @param {Date} date The date to format
         * @param {String} format The format
         * @param {String|Object|null|?} culture Can accept a culture code, a culture object,
         *                                       or a simple "calendar" object which contains the keys "months", "months_short", "days" and "days_short"
         * @returns {String} A localized date
         */
        formatDate: (function () {

            var formatMatcher = /d{1,4}|M{1,4}|yy(?:yy)?|([HhmsTt])\1?|[LloSZ]|UTC|"[^"]*"|'[^']*'/g,
                timezone = /\b(?:[PMCEA][SDP]T|[a-zA-Z ]+ (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)?(?:[-+]\d{4})?)\b/g,
                timezoneClip = /[^-+\dA-Z]/g,
                pad = function (val, len) {
                    val = val + '';
                    while (val.length < len) val = '0' + val;
                    return val;
                };

            /** @typedef {FlagMap} */
            var FlagMap = { d: null, D: null, M: null, y: null, H: null, m: null, s: null, L: null, o: null, utcd: null, utc: null };

            /** @type {FlagMap} */
            var flagSubMapLocal = {
                /** @param {Date} d */ /** @returns {Number} */d: function (d) { return d.getDate(); },
                /** @param {Date} d */ /** @returns {Number} */D: function (d) { return d.getDay(); },
                /** @param {Date} d */ /** @returns {Number} */M: function (d) { return d.getMonth(); },
                /** @param {Date} d */ /** @returns {Number} */y: function (d) { return d.getFullYear(); },
                /** @param {Date} d */ /** @returns {Number} */H: function (d) { return d.getHours(); },
                /** @param {Date} d */ /** @returns {Number} */m: function (d) { return d.getMinutes(); },
                /** @param {Date} d */ /** @returns {Number} */s: function (d) { return d.getSeconds(); },
                /** @param {Date} d */ /** @returns {Number} */L: function (d) { return d.getMilliseconds(); },
                /** @param {Date} d */ /** @returns {Number} */o: function (d) { return 0; },
                /** @param {Date} d */ /** @returns {String} */utcd: function (d) { return ((d + '').match(timezone) || ['']).pop().replace(timezoneClip, ''); },
                /** @param {Date} d */ /** @returns {String} */utc: function (d) { var z = d.getTimezoneOffset(), s = (z > 0 ? '-' : '+'); z = z < 0 ? -z : z; var zm = z % 60; return s + pad((z - zm) / 60, 2) + (zm ? pad(zm, 2) : ''); }
            };

            /** @type {FlagMap} */
            var flagSubMapUtc = {
                /** @param {Date} d */ /** @returns {Number} */d: function (d) { return d.getUTCDate(); },
                /** @param {Date} d */ /** @returns {Number} */D: function (d) { return d.getUTCDay(); },
                /** @param {Date} d */ /** @returns {Number} */M: function (d) { return d.getUTCMonth(); },
                /** @param {Date} d */ /** @returns {Number} */y: function (d) { return d.getUTCFullYear(); },
                /** @param {Date} d */ /** @returns {Number} */H: function (d) { return d.getUTCHours(); },
                /** @param {Date} d */ /** @returns {Number} */m: function (d) { return d.getUTCMinutes(); },
                /** @param {Date} d */ /** @returns {Number} */s: function (d) { return d.getUTCSeconds(); },
                /** @param {Date} d */ /** @returns {Number} */L: function (d) { return d.getUTCMilliseconds(); },
                /** @param {Date} d */ /** @returns {Number} */o: function (d) { return d.getTimezoneOffset(); },
                /** @param {Date} d */ /** @returns {String} */utcd: function (d) { return "UTC" },
                /** @param {Date} d */ /** @returns {String} */utc: function (d) { return "Z" }
            };

            /** @expose */
            var flagMap = {
                /** @expose @param {FlagMap} fmap */ /** @return {string} */d: function (o, fmap) { return fmap.d(o); },
                /** @expose @param {FlagMap} fmap */ /** @return {string} */dd: function (o, fmap) { return pad(fmap.d(o), 2); },
                /** @expose @param {FlagMap} fmap */ /** @return {string} */ddd: function (o, fmap, culture) { return culture['weekdays_short'][fmap.D(o)]; },
                /** @expose @param {FlagMap} fmap */ /** @return {string} */dddd: function (o, fmap, culture) { return culture['weekdays'][fmap.D(o)]; },
                /** @expose @param {FlagMap} fmap */ /** @return {string} */M: function (o, fmap) { return fmap.M(o) + 1; },
                /** @expose @param {FlagMap} fmap */ /** @return {string} */MM: function (o, fmap) { return pad(fmap.M(o) + 1, 2); },
                /** @expose @param {FlagMap} fmap */ /** @return {string} */MMM: function (o, fmap, culture) { return culture['months_short'][fmap.M(o)]; },
                /** @expose @param {FlagMap} fmap */ /** @return {string} */MMMM: function (o, fmap, culture) { return culture['months'][fmap.M(o)]; },
                /** @expose @param {FlagMap} fmap */ /** @return {string} */yy: function (o, fmap) { return String(fmap.y(o)).slice(2); },
                /** @expose @param {FlagMap} fmap */ /** @return {string} */yyyy: function (o, fmap) { return fmap.y(o); },
                /** @expose @param {FlagMap} fmap */ /** @return {Number} */h: function (o, fmap) { return fmap.H(o) % 12 || 12; },
                /** @expose @param {FlagMap} fmap */ /** @return {string} */hh: function (o, fmap) { return pad(fmap.H(o) % 12 || 12, 2); },
                /** @expose @param {FlagMap} fmap */ /** @return {string} */H: function (o, fmap) { return fmap.H(o); },
                /** @expose @param {FlagMap} fmap */ /** @return {string} */HH: function (o, fmap) { return pad(fmap.H(o), 2); },
                /** @expose @param {FlagMap} fmap */ /** @return {string} */m: function (o, fmap) { return fmap.m(o); },
                /** @expose @param {FlagMap} fmap */ /** @return {string} */mm: function (o, fmap) { return pad(fmap.m(o), 2); },
                /** @expose @param {FlagMap} fmap */ /** @return {string} */s: function (o, fmap) { return fmap.s(o); },
                /** @expose @param {FlagMap} fmap */ /** @return {string} */ss: function (o, fmap) { return pad(fmap.s(o), 2); },
                /** @expose @param {FlagMap} fmap */ /** @return {string} */l: function (o, fmap) { return pad(fmap.L(o), 3); },
                /** @expose @param {FlagMap} fmap */ /** @return {string} */L: function (o, fmap) { var L = fmap.L(o); return pad(L > 99 ? Math.round(L / 10) : L, 2); },
                /** @expose @param {FlagMap} fmap */ /** @return {string} */t: function (o, fmap) { return fmap.H(o) < 12 ? "a" : "p" },
                /** @expose @param {FlagMap} fmap */ /** @return {string} */tt: function (o, fmap) { return fmap.H(o) < 12 ? "am" : "pm" },
                /** @expose @param {FlagMap} fmap */ /** @return {string} */T: function (o, fmap) { return fmap.H(o) < 12 ? "A" : "P" },
                /** @expose @param {FlagMap} fmap */ /** @return {string} */TT: function (o, fmap) { return fmap.H(o) < 12 ? "AM" : "PM" },
                /** @expose @param {FlagMap} fmap */ /** @return {string} */Z: function (o, fmap) { return fmap.utc(o) },
                /** @expose @param {FlagMap} fmap */ /** @return {string} */UTC: function (o, fmap) { return fmap.utcd(o) },
                /** @expose @param {FlagMap} fmap */ /** @return {string} */o: function (o, fmap) { o = fmap.o(o); return (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4) },
                /** @expose @param {FlagMap} fmap */ /** @return {string} */S: function (o, fmap) { var d = fmap.d(o); return ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10] }
            };

            return function (date, format, culture) {
                if (culture && typeof culture === 'string') {
                    culture = i18n.getLanguage(culture, true);
                }
                if (!culture) {
                    culture = active;
                }
                culture = culture['calendar'] ? culture['calendar'] : culture;

                // Passing date through Date applies Date.parse, if necessary
                if (!date) {
                    date = new Date();
                } else if (typeof date === 'string') {
                    date = i18n.parse(date, null, culture);
                } else if (date instanceof Date) {
                    // date = new Date(date);
                } else if (typeof date === 'number') {
                    date = new Date(date);
                } else {
                    date = NaN;
                }

                if (isNaN(date)) throw new SyntaxError("invalid date");

                var utc = false;

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

                var f = utc ? flagSubMapUtc : flagSubMapLocal;

                return format.replace(formatMatcher, function (token) {
                    return (token in flagMap) ? (flagMap[token])(date, f, culture) : token.slice(1, token.length - 1);
                });
            };
        })(),

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
         * @param {Date} date The date to format
         * @param {String?} format The format. Defaults to UTC ISO. (yyyy-MM-DD'T'HH:mm:ssZ)
         * @param {String|Object|null|?} culture Can accept a culture code, a culture object,
         *                                       or a simple "calendar" object which contains the keys "months", "months_short", "days" and "days_short"
         * @param {Boolean?} strict Should the parser be strict? false by default, forgiving missing digits etc.
         * @returns {Date} The parsed date
         */
        parseDate: function (date, format, culture, strict) {
            if (culture && typeof culture === 'string') {
                culture = i18n.getLanguage(culture, true);
            }
            if (!culture) {
                culture = active;
            }
            culture = culture['calendar'] ? culture['calendar'] : culture;

            if (!format) {
                if ('parse' in Date) {
                    return new Date(date);
                } else {
                    var parsed = this.parseDate(date, 'yyyy-MM-dd\'T\'HH:mm:ss[.l]Z', culture, true);
                    if (isNaN(+parsed)) parsed = this.parseDate(date, 'yyyy-MM-dd', culture, true);
                    if (isNaN(+parsed)) parsed = this.parseDate(date, 'ddd, dd, MMM yyyy HH:mm:ss Z', culture, true);
                    if (isNaN(+parsed)) parsed = this.parseDate(date, 'dddd, dd-MMM-yy HH:mm:ss Z', culture, true);
                    if (isNaN(+parsed)) parsed = this.parseDate(date, 'ddd MMM d HH:mm:ss yyyy', culture, true);
                    return parsed;
                }
            }

            var compiled = culture[strict ? '_compiledParsersE' : '_compiledParsers'];
            if (!compiled) culture[strict ? '_compiledParsersE' : '_compiledParsers'] = compiled = {};

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
         * @param {String} format The format
         * @param {Object} culture An object which contains the keys "months", "months_short", "days" and "days_short"
         * @param {Boolean} strict Should the parser be strict? false by default, forgiving missing digits etc.
         * @returns {function(String):Date} The parser function
         */
        createDateParser: (function () {
            var partsRgx = /('[^'\\]*(?:\\.[^'\\]*)*')|(\[[^\]\\]*(?:\\.[^\]\\]*)*])|yyyy|yy|MMMM|MMM|MM|M|dddd|ddd|dd|d|HH|H|hh|h|mm|m|ss|s|l|L|tt|t|TT|T|Z|UTC|o|S|.+?/g;

            var arrayToRegex = function (array) {
                var regex = '';
                for (var i = 0; i < array.length; i++) {
                    if (i > 0) regex += '|';
                    regex += regexEscape(array[i]);
                }
                return regex;
            };

            var regexMap = {
                'yyyy': function (c, s) { return s ? '[0-9]{4}' : '[0-9]{2}|[0-9]{4}'; },
                'yy': function (c, s) { return '[0-9]{2}'; },
                'MMMM': function (c, s) { return arrayToRegex(c['months']); },
                'MMM': function (c, s) { return arrayToRegex(c['months_short']); },
                'MM': function (c, s) { return s ? '[0-9]{2}' : '[0-9]{1,2}'; },
                'M': function (c, s) { return '[0-9]{1,2}'; },
                'dddd': function (c, s) { return arrayToRegex(c['days']); },
                'ddd': function (c, s) { return arrayToRegex(c['days_short']); },
                'dd': function (c, s) { return s ? '[0-9]{2}' : '[0-9]{1,2}'; },
                'd': function (c, s) { return '[0-9]{1,2}'; },
                'HH': function (c, s) { return s ? '[0-9]{2}' : '[0-9]{1,2}'; },
                'H': function (c, s) { return '[0-9]{1,2}'; },
                'hh': function (c, s) { return s ? '[0-9]{2}' : '[0-9]{1,2}'; },
                'h': function (c, s) { return '[0-9]{1,2}'; },
                'mm': function (c, s) { return s ? '[0-9]{2}' : '[0-9]{1,2}'; },
                'm': function (c, s) { return '[0-9]{1,2}'; },
                'ss': function (c, s) { return s ? '[0-9]{2}' : '[0-9]{1,2}'; },
                's': function (c, s) { return '[0-9]{1,2}'; },
                'l': function (c, s) { return '[0-9]{3}'; },
                'L': function (c, s) { return '[0-9]{2}'; },
                'tt': function (c, s) { return 'am|Am|aM|AM|pm|Pm|pM|PM'; },
                't': function (c, s) { return 'a|A|p|P'; },
                'TT': function (c, s) { return 'am|Am|aM|AM|pm|Pm|pM|PM'; },
                'T': function (c, s) { return 'a|A|p|P'; },
                'Z': function (c, s) { return 'Z|(?:GMT|UTC)?[+-][0-9]{2,4}(?:\\([a-zA-Z ]+ (?:Standard|Daylight|Prevailing) Time\\))?'; },
                'UTC': function (c, s) { return '[+-][0-9]{2,4}'; },
                'o': function (c, s) { return '[+-][0-9]{4}'; },
                'S': function (c, s) { return 'th|st|nd|rd'; }
            };

            return function (format, culture, strict) {

                var regex = '';
                var regexParts = [];

                var processFormat = function (format) {
                    var formatParts = format.match(partsRgx);

                    var i, count, part, shouldStrict;

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
                        } else if (regexMap.hasOwnProperty(part)) {
                            // An actually recognized part
                            shouldStrict = strict || // We are specifically instructed to use strict mode
                            (i > 0 && regexMap.hasOwnProperty(formatParts[i - 1])) || // Previous part is not some kind of a boundary
                            (i < count - 1 && regexMap.hasOwnProperty(formatParts[i + 1])); // Next part is not some kind of a boundary

                            regex += '(' + regexMap[part](culture, shouldStrict) + ')';
                            regexParts.push(part);
                        } else {
                            // A free text node
                            part = part.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/, '$1'); // Remove enclosing quotes if there are...
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
                var baseYear = Math.floor((new Date()).getFullYear() / 100) * 100;

                // Return a parser function
                return function (date) {
                    date = date + '';
                    var parts = date.match(regex);
                    if (!parts) return null;

                    parts.splice(0, 1); // Remove main capture group 0

                    var now = new Date(),
                        nowYear = now.getFullYear();
                    var year = null, month = null, day = null,
                        hours = null, hours12 = false, hoursTT, minutes = null,
                        seconds = null, milliseconds = null,
                        timezone = null;

                    for (var i = 0, len = parts.length, part, tmp; i < len; i++) {
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
                                tmp = arrayIndexOf(culture['months'], part);
                                if (tmp > -1) month = tmp;
                                break;
                            case 'MMM':
                                tmp = arrayIndexOf(culture['months_short'], part);
                                if (tmp > -1) month = tmp;
                                break;
                            case 'MM':
                            case 'M':
                                month = parseInt(part, 10) - 1;
                                break;
                            case 'dddd':
                                tmp = arrayIndexOf(culture['days'], part);
                                if (tmp > -1) day = tmp;
                                break;
                            case 'ddd':
                                tmp = arrayIndexOf(culture['days_short'], part);
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
                            case 'tt':
                            case 't':
                            case 'TT':
                            case 'T':
                                if (hours12) {
                                    hoursTT = part.toLowerCase();
                                    hours12 = false;
                                }
                                break;
                            case 'Z':
                            case 'UTC':
                            case 'o':
                                var tz = part.match(/(Z)|(?:GMT|UTC)?([+-][0-9]{2,4})(?:\([a-zA-Z ]+ (?:Standard|Daylight|Prevailing) Time\))?/);
                                if (tz[1] === 'Z') {
                                    timezone = 0;
                                } else if (tz[2]) {
                                    timezone = (parseInt(tz[2].substr(1, 2), 10) || 0) * 60 + (parseInt(tz[2].substr(3), 10) || 0);
                                    if (tz[2].charAt(0) === '-') {
                                        timezone = -timezone;
                                    }
                                }
                                break;
                        }
                    }

                    if (year === null) year = now.getFullYear();
                    if (month === null) month = now.getMonth();
                    if (day === null) day = 1;
                    if (hours12) {
                        if (hoursTT === 'am' || hoursTT === 'a') {
                            if (hours === 12) hours = 0;
                        } else if (hoursTT === 'pm' || hoursTT === 'p') {
                            if (hours < 12) hours += 12;
                        }
                    }
                    var parsedDate = new Date(year, month, day, hours || 0, minutes || 0, seconds || 0, milliseconds || 0);
                    if (timezone !== null) {
                        timezone += parsedDate.getTimezoneOffset();
                    }
                    parsedDate.setMinutes(parsedDate.getMinutes() - timezone);

                    return parsedDate;
                };
            };

        })(),

        /**
         * Try to detect, based on the browser's localization, which is the short date format appropriate.
         * So allegedly, a US user will have MM/dd/yyyy and GB will have d/MM/yyyy.
         * Currently browsers do not seem to behave and use the correct formats of the OS!
         * @public
         * @expose
         * @param {String} fallback a fallback date for a case where the browser does not support this functionality.
         * @returns {String} the detected format, the fallback, or dd/MM/yyyy as default.
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
         * @param {Number|String|null} value the value to format.
         * @param {Number=} thousands should we add a thousands separator
         * @returns {String} The formatted number as string.
         *                   If null or empty string is supplied, then an empty string is returned.
         *                   If a string was supplied, it is returned as-is.
         */
        displayNumber: function (value, thousands) {
            if (value === '' || value == null) return '';
            if (typeof value === 'number') {
                value = value.toString();

                var decimalSep = active['__options__'].decimal,
                    thousandsSep = active['__options__'].thousands;

                if (decimalSep !== '.') {
                    value = value.replace(/\./g, decimalSep);
                }
                if (thousands) {
                    var decIndex = value.indexOf(decimalSep);
                    if (decIndex === -1) {
                        decIndex = value.length;
                    }
                    var sign = value.charAt(0) === '-' ? 1 : 0;
                    if (decIndex - sign > 3) {
                        var sepValue = '';
                        var major = value.substr(sign, decIndex - sign);
                        var fromIndex = 0, toIndex = major.length % 3;
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
            }
            return value.toLocaleString();
        },

        /**
         * Parses a number from user input using the correct decimal separator detected from the browser.
         * @public
         * @expose
         * @param {Number|String|null} value the value to parse.
         * @returns {Number|null} The parsed number.
         *                   If null or empty string is supplied, then null is returned.
         *                   If a number was supplied, it is returned as-is.
         */
        parseNumber: function (value) {
            if (value === '' || value == null) return null;

            var decimalRegex = active['__options__'].decimalRegex;

            if (typeof value !== 'number') {
                return parseFloat(value.replace(decimalRegex, '.'));
            }

            return value;
        },

        /**
         * Process a localized string.
         *
         * Pass 1:
         *      Look for localization value specified in the form of:
         *          {key.subkey}
         *          {key.subkey:html}
         *          {key.subkey:htmll} multiline HTML. replaces \n with <br />
         *          {key.subkey:json}
         *          {key.subkey:url}
         * Pass 2:
         *      Then look for placeholders from the passed options, in the form of:
         *          {{count}}
         *          {{data.value:2.5f:html}}
         *          {{data.value:html}} etc.
         * Pass 3:
         *      Look for i18n calls in the form of:
         *          t("key.path") t('key.path') t(key.path) or t("key.path", {"count": 5})
         *      Where the options part must be a valid JSON
         *      This stage is affected by previous stages (i.e placeholders can be JSON encoded for t(...) calls
         *
         * localization format is {key.path[:html|htmll|json|url]}
         * Placeholder format is {{key.path[:printf-specifier][:html|htmll|json|url]}} and accepts a printf specifier
         *
         * Printf specifiers are in this order:
         *
         *  "[+][ ][#][0][width][,][.precision]"
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
         * @param {String} value the value to process
         * @param {Object?} data the data for post processing
         * @returns {string} the processed value
         */
        processLocalizedString: function (value, data) {

            if (typeof value !== 'string') return value;

            var localeOptions = active['__options__'];

            value = value.replace(/(\{([^"\\{}]+?)(?::(html|htmll|json|url))?})|(\{\{([^"\\{}]+?)(?::([+# 0-9\.,]*[bcdieEfgouxXs]))?(?::(html|htmll|json|url))?}})|\\[{}\\]/g, function () {
                var key, encoding;

                if (arguments[0] === '\\{') {
                    return '{';
                }
                else if (arguments[0] === '\\}') {
                    return '}';
                }
                else if (arguments[0] === '\\\\') {
                    return '\\';
                }

                if (arguments[1]) {
                    key = arguments[2];
                    encoding = arguments[3];

                    return encodeValue(i18n.t(key), encoding);
                } else if (arguments[4]) {
                    key = arguments[5];
                    encoding = arguments[7];
                    var specifiers = arguments[6];

                    var keys = key.split('.');
                    var value = data;
                    for (var i = 0, len = keys.length; i < len; i++) {
                        value = value[keys[i]];
                    }

                    var processedValue = applySpecifiers(value, specifiers, localeOptions.decimal, localeOptions.thousands);
                    processedValue = encodeValue(processedValue, encoding);

                    return processedValue;
                }
            });

            value = value.replace(/t\(("[^"]+?"|'[^']+?'|[^,)]+?)(?:,\s*(\{.*?}))?\)/g, function () {

                var key = arguments[1],
                    options = arguments[2];
                try {
                    key = JSON.parse(key);
                }
                catch (e) {
                    return arguments[0];
                }
                if (options) {
                    try {
                        options = JSON.parse(options);
                    }
                    catch (e) {
                        options = null;
                    }
                }

                return i18n.t(key, options);

            });

            return value;

        }

    };

    // Helper function to extend an object using a synthetic object structure from dotted syntax to a real nested structure.
    function extendDotted(target, data) {
        if (data == null) return;
        var dotted, targetDotted, i;
        for (var key in data) {
            if (!data.hasOwnProperty(key) || !data[key]) continue;
            dotted = key.split('.');
            targetDotted = target;
            for (i = 0; i < dotted.length - 1; i++) {
                targetDotted = targetDotted[dotted[i]];
            }
            targetDotted[dotted[dotted.length - 1]] = data[key];
        }
    }

    /**
     * @typedef LOCALIZED_PHYSICAL_FILE_SIZE
     * */
    var LOCALIZED_PHYSICAL_FILE_SIZE = {
        /**
         * @expose
         * @type {Number}
         * */
        size: 0,

        /**
         * @expose
         * @type {String}
         * */
        name: ''
    };


    /**
     * This function returns a key suffix for plural form, for the specified count.
     * @function PLURAL_FORM_FUNCTION
     * @param {Number} count the number that we need to inspect
     * @returns {string}
     */
    function PLURAL_FORM_FUNCTION(count) { }

    /**
     * @typedef ADD_LANGUAGE_OPTIONS
     * */
    var ADD_LANGUAGE_OPTIONS = {
        /**
         * function that takes a number, and returns a key suffix for plural form of that count.
         * @expose
         * @type {PLURAL_FORM_FUNCTION}
         * */
        plural: null,

        /**
         * decimal separator character. The default is auto-detected from the browser locale
         * @expose
         * @type {String}
         * */
        decimal: '.',

        /**
         * thousands separator character. The default is auto-detected from the browser locale
         * @expose
         * @type {String}
         * */
        thousands: ','
    };

    if (this['window'] && this['window'] === this) {
        // Export for browser

        /** @expose */
        this.i18n = i18n;
    } else {
        // Export for node.js

        /** @expose */
        module.exports = i18n;
    }

}).call(this);
