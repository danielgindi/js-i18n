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

    /**
     * Acts the same as i18n.$, but this is the function that is copied to retrieved objects.
     * Takes the value path as argument array . each part in the part as a separate argument
     * @private
     * @returns {*} localized value or object
     */
    var perObject$ = function () {
        var loc = this;
        for (var i = 0, len = arguments.length; i < len; i++) {
            loc = loc[arguments[i]];
        }
        if (loc instanceof Object) {
            loc['$'] = perObject$; // Copy the $ function. Specified using square brackets to force the compilers' hands.
            if (Object.defineProperty) { // If possible, mark the $ function as not enumerable
                Object.defineProperty(loc, '$', { enumerable: false })
            }
        }
        return loc;
    };

    /**
     * The default plural form specifier.
     * This function returns a specifier for plural form, for the specified count.
     * @param {Number} count the number that we need to inspect
     * @returns {string}
     */
    var defaultPlural = function (count) {
        if (count === 0) return 'zero';
        if (count === 1) return 'one';
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
            value = value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;").replace(/"/g, "&quot;");
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
     * @param {String} char the character to use for the padding
     * @returns {*}
     */
    var padLeft = function (value, length, char) {
        value = value.toString();
        while (value.length < length) {
            value = char + value;
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
            thousandsSign = thousandsSign || DEFAULT_DECIMAL_SEPARATOR;
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
                    value = padZero(value, precision, '0');
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
                value = padLeft(value, padCount - sign.length - radiiSign.length , '0');
            }

            value = sign + radiiSign + value;

            // Space padding - should be like "    0x5" for length of 7, where the radii sign is after padding
            if (padCount && !padZero) {
                value = padLeft(value, padCount, ' ');
            }
        }

        return value;
    };

    /**
     * Post process a localization value.
     * Pass 1:
     *      Look for localization value specified in the form of:
     *          {key.subkey}
     *          {key.subkey:html}
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
     * localization format is {key.path[:html|json|url]}
     * Placeholder format is {{key.path[:printf-specifier][:html|json|url]}} and accepts a printf specifier
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
    var postProcessValue = function (value, data) {

        var localeOptions = active['__options__'];

        value = value.replace(/(\{([^"\{}]+?)(:(html|json|url))?})|(\{\{([^"\{}]+?)(:([+# 0-9\.,]*[bcdieEfgouxXs]))?(:(html|json|url))?}})/g, function () {
            var key, encoding;

            if (arguments[1]) {
                key = arguments[2];
                encoding = arguments[4];

                return encodeValue(i18n.t(key), encoding);
            } else if (arguments[5]) {
                key = arguments[6];
                encoding = arguments[10];
                var specifiers = arguments[8];

                var keys = key.split('.');
                var value = data;
                for (var i = 0, len = keys.length; i < len; i++) {
                    value = value[keys[i]];
                }

                value = applySpecifiers(value, specifiers, localeOptions.decimal, localeOptions.thousands);
                value = encodeValue(value, encoding);

                return value;
            }
        });

        value = value.replace(/t\(("[^"]+?"|'[^']+?'|[^,)]+?)(,\s*(\{.*?}))?\)/g, function () {

            var key = arguments[1],
                options = arguments[3];
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
        * @returns {Object} language object
        */
        getLanguage: function (lang) {
            return locs[lang];
        },

        /**
         * Retrieve a i18n value/object
         * @public
         * @expose
         * @param {String} key the path for the localized value. each part is separated by a period.
         * @param {Object?} options data for postprocessing the returned string
         * @returns {*} localized value or object
         */
        t: function (key, options) {
            key = key || '';

            // If not key is specified, return the root namespace
            if (key.length === 0) {
                return active;
            }

            var keys = key.split('.'),
                loc = active,
                i, len;

            if (options && typeof options['count'] === 'number') { // Try for plural form

                // Loop on all of them except the last. We are going to test the last key combined with plural specifiers
                for (i = 0, len = keys.length - 1; i < len; i++) {
                    loc = loc[keys[i]];
                }

                var pluralSpec = active['__options__'].plural;
                pluralSpec = pluralSpec(options['count']);

                key = keys[keys.length - 1]; // This is the last key in the keys array

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
                loc = postProcessValue(loc, options);
            }

            return loc;
        },

        /**
        * Retrieve a i18n value/object
         * Takes the value path as argument array . each part in the part as a separate argument
        * If returning an object - that object will have a $ function property, to retrieve sub-values.
        * @public
        * @expose
        * @returns {*} localized value or object
        */
        $: function () {
            if (!active) return '';
            var loc = active;
            for (var i = 0, len = arguments.length; i < len; i++) {
                loc = loc[arguments[i]];
            }
            if (loc instanceof Object) {
                loc['$'] = perObject$; // Copy the $ function. Specified using square brackets to force the compilers' hands.
                if (Object.defineProperty) { // If possible, mark the $ function as not enumerable
                    Object.defineProperty(loc, '$', { enumerable: false })
                }
            }
            return loc;
        },

        /**
        * Similar to $, but bypass extensions (first read from _originalLocs)
        * Takes the value path as argument array . each part in the part as a separate argument
        * @public
        * @expose
        * @returns {*} localized value or object
        */
        $$: function () {
            if (!active) return '';
            var loc = originalLocs[activeLanguage] || active;
            for (var i = 0, len = arguments.length; i < len; i++) {
                loc = loc[arguments[i]];
            }
            if (loc instanceof Object) {
                loc['$'] = perObject$; // Copy the $ function. Specified using square brackets to force the compilers' hands.
                if (Object.defineProperty) { // If possible, mark the $ function as not enumerable
                    Object.defineProperty(loc, '$', { enumerable: false })
                }
            }
            return loc;
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
            if (lang === 'iw') lang = 'he'; // Fallback from Google's old spec, if the setting came from an old Android device
            if (!lang) {
                lang = this.getAvailableLanguages()[0];
            }
            while (typeof lang === 'string') {
                if (active = locs[lang]) break;
                var idx = lang.lastIndexOf('-');
                if (idx < 0) {
                    idx = lang.lastIndexOf('_');
                }
                if (idx > 0) {
                    lang = lang.substr(0, idx);
                }
                else break;
            }
            if (!active) {
                lang = this.getAvailableLanguages()[0];
                active = locs[lang];
            }
            activeLanguage = lang;
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
                loc = active('size_abbrs');
            if (bytes < 100) ret = { size: bytes, name: loc['b'] };
            else if (bytes < 101376) ret = { size: bytes / 1024.0, name: loc['kb'] };
            else if (bytes < 103809024) ret = { size: bytes / 1024.0 / 1024.0, name: loc['mb'] };
            else if (bytes < 106300440576) ret = { size: bytes / 1024.0 / 1024.0 / 1024.0, name: loc['gb'] };
            else ret = { size: bytes / 1024.0 / 1024.0 / 1024.0 / 1024.0, name: loc['b'] };
            ret.size = (Math.ceil(ret.size * 100) / 100); // Max two decimal points
            return ret;
        },

        /**
        * Format a date to a localized string, assuming that the "calendar" key is available.
        * Supports only the following codes: d dd ddd dddd M MM MMM MMMM yy yyyy
        * @public
        * @expose
        * @param {Date} date the date to format
        * @param {String} format the format
        * @returns {String} a localized date
        */
        formatDate: (function (date, format) {

            var formatMatcher = /d{1,4}|M{1,4}|yy(?:yy)?|"[^"]*"|'[^']*'/g,
			    pad = function (val, len) {
			        val = String(val);
			        len = len || 2;
			        while (val.length < len) val = '0' + val;
			        return val;
			    };

            var loc = null;

            /** @expose */
            var flags = {
                /** @expose */d: function (date) { return date.getDate(); },
                /** @expose */dd: function (date) { return pad(date.getDate()); },
                /** @expose */ddd: function (date) { return loc['weekdays_short'][date.getDay()]; },
                /** @expose */dddd: function (date) { return loc['weekdays'][date.getDay()]; },
                /** @expose */M: function (date) { return date.getMonth() + 1; },
                /** @expose */MM: function (date) { return pad(date.getMonth() + 1); },
                /** @expose */MMM: function (date) { return loc['months_short'][date.getDay()]; },
                /** @expose */MMMM: function (date) { return loc['months'][date.getDay()]; },
                /** @expose */yy: function (date) { return String(date.getFullYear()).slice(2); },
                /** @expose */yyyy: function (date) { return date.getFullYear(); }
            };

            /** @expose */
            return function (date, format) {
                if (!format) {
                    format = 'yyyy-MM-dd'; // ISO
                }

                var self = this;
                loc = active['calendar'];

                return format.replace(formatMatcher, function (token) {
                    return (token in flags) ?
                        flags[token].call(self, date) : // Real token, like dddd or YY
                        token.slice(1, token.length - 1); // Quoted token, like "dd"
                });

            };

        })(),

        /**
        * Parses a date from user input, based on a supplied format. This is *not* the counterpart of the formatDate function.
        * Supports only the numerical date codes (d dd M MM y yy).
        * Will automatically fall back if missing a digit i.e 1/2/34 for dd/MM/yyyy.
        * Forgiving behavior with "incorrect" separators, i.e 01.05 instead of 01/05...
        * Any missing values will default to today. So a missing year will default to current year, etc.
        * @public
        * @expose
        * @param {Date} date the date to format
        * @param {String} format the format
        * @returns {Date} the parsed date
        */
        parseDate: function (date, format, hours, minutes, seconds, milliseconds) {
            if (date instanceof Date) return date;
            if (!date) return null;

            var now = new Date,
                values = {
                    year: now.getFullYear(),
                    month: now.getMonth() + 1,
                    day: now.getDate()
                },
                baseYear = values.year;

            var parts = [], lastChar = '', c;
            for (var i = 0; i < format.length; i++) {
                c = format.charAt(i);
                if (c !== lastChar) {
                    if (c === 'd' || c === 'M' || c === 'y') {
                        parts.push(c);
                    }
                }
                lastChar = c;
            }

            var partIndex = 0, lastIndex = -1, c, slice;
            for (var i = 0; i < date.length + 1; i++) {
                c = date.charAt(i);
                if (c >= '0' && c <= '9') {
                    if (lastIndex === -1) {
                        lastIndex = i;
                    }
                } else if (lastIndex > -1) {
                    slice = date.substr(lastIndex, i - lastIndex);
                    var part = parts[partIndex++];
                    if (part === 'd') {
                        values.day = parseFloat(slice);
                    } else if (part === 'M') {
                        values.month = parseFloat(slice);
                    } else if (part === 'y') {
                        values.year = parseFloat(slice);
                        if (values.year < 100 && slice.length <= 2) {
                            values.year += Math.floor(baseYear / 100) * 100;
                            if (values.year - baseYear >= 50) {
                                values.year -= 100;
                            }
                        }
                    } else {
                        break;
                    }
                    lastIndex = -1;
                }
            }

            return new Date(values.year, values.month - 1, values.day, hours || 0, minutes || 0, seconds || 0, milliseconds || 0);
        },

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
        * @returns {String} The formatted number as string. 
        *                   If null or empty string is supplied, then an empty string is returned. 
        *                   If a string was supplied, it is returned as-is.
        */
        displayNumber: function (value, thousands) {
            if (value === '' || value == null) return '';
            if (typeof value === 'number') {
                value = value.toString()

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
        * Localize a template string using the {key.anotherKey} syntax
        * We can specify encoding too, like {key:html}, {key:json}, {key:url}
        * @public
        * @expose
        * @param {String} template the template to localized
        * @returns {String} a localized template
        */
        localizeTemplate: function (template) {
            var loc = this;
            return template.replace(/\{([^"\{}]+?)(:(html|json|url))?}/g, function () {
                var key = arguments[1],
                    encoding = arguments[3],
                    value = loc.t(key);
                return encodeValue(value, encoding);
            });
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

    /** @expse */
    this.i18n = i18n;

})();