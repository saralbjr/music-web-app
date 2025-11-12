/**
 * KMP (Knuth-Morris-Pratt) String Search Algorithm
 * Efficient pattern matching algorithm with O(n + m) time complexity
 * Used for searching songs by title or artist
 */

/**
 * Build the failure function (partial match table) for KMP algorithm
 * This table helps skip unnecessary comparisons
 * @param pattern - The pattern to search for
 * @returns Failure function array
 */
function buildFailureFunction(pattern: string): number[] {
  const m = pattern.length;
  const failure: number[] = new Array(m).fill(0);
  let j = 0;

  for (let i = 1; i < m; i++) {
    while (j > 0 && pattern[i] !== pattern[j]) {
      j = failure[j - 1];
    }
    if (pattern[i] === pattern[j]) {
      j++;
    }
    failure[i] = j;
  }

  return failure;
}

/**
 * KMP Search Algorithm
 * Finds all occurrences of a pattern in a text
 * @param text - The text to search in
 * @param pattern - The pattern to search for
 * @returns Array of indices where pattern is found
 */
export function kmpSearch(text: string, pattern: string): number[] {
  if (!pattern || pattern.length === 0) {
    return [];
  }

  const n = text.length;
  const m = pattern.length;
  const failure = buildFailureFunction(pattern);
  const matches: number[] = [];

  let j = 0; // Index for pattern

  for (let i = 0; i < n; i++) {
    // If characters don't match, use failure function to skip
    while (j > 0 && text[i].toLowerCase() !== pattern[j].toLowerCase()) {
      j = failure[j - 1];
    }

    // If characters match, move to next character in pattern
    if (text[i].toLowerCase() === pattern[j].toLowerCase()) {
      j++;
    }

    // If entire pattern is matched, record the position
    if (j === m) {
      matches.push(i - m + 1);
      j = failure[j - 1]; // Continue searching for more matches
    }
  }

  return matches;
}

/**
 * Search for a pattern in a string (case-insensitive)
 * @param text - The text to search in
 * @param pattern - The pattern to search for
 * @returns true if pattern is found, false otherwise
 */
export function kmpMatch(text: string, pattern: string): boolean {
  return kmpSearch(text, pattern).length > 0;
}

