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

/**
 * Calculate search relevance score for a song
 * Higher score = better match
 * @param song - Song object with title and artist
 * @param pattern - Search pattern
 * @returns Relevance score (0-100)
 */
export function calculateSearchScore(
  song: { title: string; artist: string },
  pattern: string
): number {
  if (!pattern || pattern.length === 0) return 0;

  const normalizedPattern = pattern.toLowerCase().trim();
  const title = song.title.toLowerCase();
  const artist = song.artist.toLowerCase();

  let score = 0;

  // Exact match in title (highest priority)
  if (title === normalizedPattern) {
    score += 100;
  } else if (title.startsWith(normalizedPattern)) {
    score += 80;
  } else {
    const titleMatches = kmpSearch(title, normalizedPattern);
    if (titleMatches.length > 0) {
      score += 60;
      // Bonus for multiple matches
      score += Math.min(titleMatches.length * 5, 20);
    }
  }

  // Exact match in artist
  if (artist === normalizedPattern) {
    score += 50;
  } else if (artist.startsWith(normalizedPattern)) {
    score += 40;
  } else {
    const artistMatches = kmpSearch(artist, normalizedPattern);
    if (artistMatches.length > 0) {
      score += 30;
      // Bonus for multiple matches
      score += Math.min(artistMatches.length * 3, 15);
    }
  }

  // Bonus for word boundary matches (starts of words)
  const titleWords = title.split(/\s+/);
  const artistWords = artist.split(/\s+/);

  titleWords.forEach((word) => {
    if (word.startsWith(normalizedPattern)) {
      score += 10;
    }
  });

  artistWords.forEach((word) => {
    if (word.startsWith(normalizedPattern)) {
      score += 5;
    }
  });

  return Math.min(score, 100);
}

