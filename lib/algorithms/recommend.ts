import { ISong } from "@/models/Song";

type RecommendationOptions = {
  userCategory?: string;
  limit?: number;
  likedIds?: Set<string>;
};

const PLAY_WEIGHT = 0.6;
const CATEGORY_WEIGHT = 0.3;
const LIKED_WEIGHT = 0.1;

const getSongId = (song: ISong): string => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawId = (song as any)?._id;
  if (typeof rawId === "string") return rawId;
  if (rawId && typeof rawId.toString === "function") return rawId.toString();
  return String(rawId ?? "");
};

/**
 * Calculate recommendation score for a song
 * Score = play popularity (60%) + category match (30%) + liked bonus (10%)
 * If no category preference, the category weight is redistributed to play score.
 */
function calculateScore(
  song: ISong,
  maxPlayCount: number,
  options?: RecommendationOptions
): number {
  const userCategory = options?.userCategory;
  const likedIds = options?.likedIds;

  const basePlay = Math.min(song.playCount / Math.max(maxPlayCount, 1), 1);
  const playCountScore =
    userCategory === undefined
      ? Math.min(basePlay * ((PLAY_WEIGHT + CATEGORY_WEIGHT) / PLAY_WEIGHT), 1)
      : basePlay * PLAY_WEIGHT;

  let categoryScore = 0;
  if (
    userCategory &&
    song.category?.toLowerCase() === userCategory.toLowerCase()
  ) {
    categoryScore = CATEGORY_WEIGHT;
  }

  const likedScore =
    likedIds && likedIds.has(getSongId(song)) ? LIKED_WEIGHT : 0;

  return playCountScore + categoryScore + likedScore;
}

/**
 * Get recommended songs based on user preferences
 */
export function getRecommendations(
  songs: ISong[],
  userCategory?: string,
  limit: number = 10,
  likedIds?: Set<string>
): ISong[] {
  if (songs.length === 0) {
    return [];
  }

  const maxPlayCount = Math.max(...songs.map((song) => song.playCount), 1);
  const options: RecommendationOptions = { userCategory, limit, likedIds };

  const songsWithScores = songs.map((song) => ({
    song,
    score: calculateScore(song, maxPlayCount, options),
  }));

  songsWithScores.sort((a, b) => b.score - a.score);

  return songsWithScores.slice(0, limit).map((item) => item.song);
}
