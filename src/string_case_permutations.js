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

export {generateAllCasePermutations};