import { ISong } from '@/models/Song';

/**
 * Recommendation Algorithm
 * Simple content-based recommendation system
 * Score = (playCount * 0.6) + (categoryMatch * 0.4)
 */

/**
 * Calculate recommendation score for a song
 * @param song - Song to calculate score for
 * @param userCategory - User's preferred category (optional)
 * @param maxPlayCount - Maximum play count in the dataset (for normalization)
 * @returns Recommendation score (0-1)
 */
function calculateScore(
  song: ISong,
  userCategory?: string,
  maxPlayCount: number = 100
): number {
  // Normalize play count (0-1 range)
  const playCountScore = Math.min(song.playCount / maxPlayCount, 1) * 0.6;

  // Category match score (0-1)
  let categoryScore = 0;
  if (userCategory && song.category.toLowerCase() === userCategory.toLowerCase()) {
    categoryScore = 0.4;
  } else if (!userCategory) {
    // If no user category, give equal weight to play count
    categoryScore = 0.4 * (playCountScore / 0.6);
  }

  return playCountScore + categoryScore;
}

/**
 * Get recommended songs based on user preferences
 * @param songs - Array of all songs
 * @param userCategory - User's preferred category (optional)
 * @param limit - Maximum number of recommendations (default: 10)
 * @returns Array of recommended songs sorted by score
 */
export function getRecommendations(
  songs: ISong[],
  userCategory?: string,
  limit: number = 10
): ISong[] {
  if (songs.length === 0) {
    return [];
  }

  // Find maximum play count for normalization
  const maxPlayCount = Math.max(...songs.map((song) => song.playCount), 1);

  // Calculate scores for all songs
  const songsWithScores = songs.map((song) => ({
    song,
    score: calculateScore(song, userCategory, maxPlayCount),
  }));

  // Sort by score (descending)
  songsWithScores.sort((a, b) => b.score - a.score);

  // Return top recommendations
  return songsWithScores.slice(0, limit).map((item) => item.song);
}

