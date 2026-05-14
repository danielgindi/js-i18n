// Helper function to extend an object using a synthetic object structure from dotted syntax to a real nested structure.
function extendDotted(
    target: Record<string, unknown> | null | undefined,
    data: Record<string, unknown> | null | undefined,
): void {
    if (data == null) return;
    let dotted: string[];
    let targetDotted: any;
    let i: number;
    for (const key of Object.keys(data)) {
        dotted = key.split('.');
        targetDotted = target;
        for (i = 0; i < dotted.length - 1; i++) {
            if (targetDotted == null) break;
            targetDotted = targetDotted[dotted[i]];
        }
        if (targetDotted == null) continue;
        targetDotted[dotted[dotted.length - 1]] = data[key];
    }
}

const ESCAPE_REGEX = /([/()[\]?{}|*+-\\:])/g;

function regexEscape(string: string): string {
    return string.replace(ESCAPE_REGEX, '\\$1');
}

function arrayToRegex(array: readonly string[]): string {
    let regex = '';
    for (let i = 0; i < array.length; i++) {
        if (i > 0) regex += '|';
        regex += regexEscape(array[i]);
    }
    return regex;
}

/**
 * Pad a value with characters on the left
 * @param value the value to pad
 * @param length minimum length for the output
 * @param ch the character to use for the padding
 * @returns The padded string
 */
function padLeft(value: string | number, length: number, ch: string): string {
    value = value.toString();
    while (value.length < length)
        value = ch + value;
    return value;
}

function supportsRegexLookbehind(): boolean {
    try {
        return '-'.replace(new RegExp('(?<!\\\\)-', 'gi'), '=') === '=';
    } catch (ignore: unknown) {
        // ignored
    }
    return false;
}

export { extendDotted, regexEscape, arrayToRegex, padLeft, supportsRegexLookbehind };

