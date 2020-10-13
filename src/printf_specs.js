import { padLeft } from './utils';

const DEFAULT_DECIMAL_SEPARATOR = (1.1).toLocaleString().substr(1, 1);

const DEFAULT_THOUSANDS_SEPARATOR = (1000).toLocaleString().length === 5
    ? (1000).toLocaleString().substr(1, 1)
    : (DEFAULT_DECIMAL_SEPARATOR === ',' ? '.' : ',');

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
        value = (/**@type number*/value).toString(2);
    } else if (type === 'c') {
        value = String.fromCharCode(value);
    } else if (type === 'd' || type === 'i' || type === 'u') {
        value = (/**@type number*/value).toString();
    } else if (type === 'e' || type === 'E') {
        value = (precision !== undefined
            ? (/**@type number*/value).toExponential(parseInt(precision, 10))
            : (/**@type number*/value).toExponential()).toString();
    } else if (type === 'f') {
        value = (precision !== undefined
            ? parseFloat(value).toFixed(parseInt(precision, 10))
            : parseFloat(value)).toString();
    } else if (type === 'g') {
        value = parseFloat(value).toString();
        if (precision !== undefined) {
            const decimalIdx = value.indexOf('.');
            if (decimalIdx > -1) {
                value = value.substr(0, decimalIdx + (precision > 0 ? 1 : 0) + precision);
            }
        }
    } else if (type === 'o') {
        value = (/**@type number*/value).toString(8);
    } else if (type === 'x' || type === 'X') {
        value = (/**@type number*/value).toString(16);
    } else if (type === 's') {
        value = value.toString();
    } else {
        value = value.toString();
    }

    if (type === 'd' || type === 'i' || type === 'u' || type === 'x' || type === 'X' || type === 'o') {
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
            let fromIndex = 0, toIndex = major.length % 3;
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
        const sign = (value.charAt(0) === '-' ? '-' : (forceSign ? '+' : '')) || (spaceSign ? ' ' : '');

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
        if (padCount > 0 && padZero) {
            value = padLeft(value, padCount - sign.length - radiiSign.length, '0');
        }

        value = sign + radiiSign + value;

        // Space padding - should be like "    0x5" for length of 7, where the radii sign is after padding
        if (padCount > 0 && !padZero) {
            value = padLeft(value, padCount, ' ');
        }
    }

    return value;
}

export { applySpecifiers };
