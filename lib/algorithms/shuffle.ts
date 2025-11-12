/**
 * Fisher-Yates Shuffle Algorithm
 * Efficient algorithm for generating a random permutation of an array
 * Time complexity: O(n)
 * Used for shuffling playlists
 */

/**
 * Fisher-Yates Shuffle implementation
 * Randomly shuffles an array in-place
 * @param array - Array to shuffle
 * @returns Shuffled array (original array is modified)
 */
export function fisherYatesShuffle<T>(array: T[]): T[] {
  // Create a copy to avoid mutating the original array
  const shuffled = [...array];
  let currentIndex = shuffled.length;
  let randomIndex: number;

  // While there remain elements to shuffle
  while (currentIndex > 0) {
    // Pick a remaining element (random index from 0 to currentIndex-1)
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // Swap it with the current element
    [shuffled[currentIndex], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[currentIndex],
    ];
  }

  return shuffled;
}

