function recurse(results: string[], lower: string[], upper: string[], hasCase: boolean[], pre: string): void {

    const len = lower.length;
    let currenLen = pre.length;

    while (currenLen < len && !hasCase[currenLen]) {
        pre += lower[currenLen++];
    }

    if (currenLen === len) {
        results.push(pre);
        return;
    }

    recurse(results, lower, upper, hasCase, pre + lower[currenLen]);
    recurse(results, lower, upper, hasCase, pre + upper[currenLen]);
}

/**
 * Generate an array of all lowercase-uppercase combinations of a given string
 * @param text Source text
 * @returns All lowercase-uppercase combinations for each cased character
 */
function generateAllCasePermutations(text: string): string[] {
    text = text + '';
    if (!text) return null;

    const results: string[] = [];
    const lower = text.split('');
    const upper: string[] = [];
    const hasCase: boolean[] = [];

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

export { generateAllCasePermutations };

