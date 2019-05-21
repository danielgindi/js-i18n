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

export {extendDotted, regexEscape, arrayToRegex, padLeft};