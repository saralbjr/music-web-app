import { ISong } from "@/models/Song";

/**
 * Mood Detection Algorithm
 *
 * Computer Science Concept: Rule-Based Classification
 *
 * This algorithm uses decision rules (if/else statements) to classify songs into moods
 * based on their category/genre. This is a simple, explainable approach suitable for
 * academic projects.
 *
 * Algorithm Approach:
 * - Content-Based Filtering: Uses song metadata (category) to determine mood
 * - Decision Tree Logic: Clear if/else rules for classification
 * - No Machine Learning: Pure rule-based for simplicity and transparency
 */

export type Mood = "Happy" | "Sad" | "Relaxed" | "Focused";

/**
 * Rule-based mood classification based on song category/genre
 *
 * Decision Rules:
 * - Happy: Upbeat genres (Pop, Dance, Electronic, Rock, Hip-Hop)
 * - Sad: Emotional genres (Blues, Ballad, Indie, Alternative)
 * - Relaxed: Calm genres (Jazz, Acoustic, Ambient, Classical, Chill)
 * - Focused: Instrumental/background genres (Instrumental, Lo-Fi, Classical)
 *
 * If category doesn't match any rule, defaults to Happy (most common mood)
 */
export function detectMoodFromCategory(category: string): Mood {
  const normalizedCategory = category.toLowerCase().trim();

  // Happy Mood Rules: Upbeat and energetic genres
  const happyGenres = [
    "pop",
    "dance",
    "electronic",
    "edm",
    "rock",
    "hip-hop",
    "hip hop",
    "rap",
    "reggae",
    "country",
    "funk",
    "disco",
  ];

  // Sad Mood Rules: Emotional and melancholic genres
  const sadGenres = [
    "blues",
    "ballad",
    "indie",
    "alternative",
    "emo",
    "goth",
    "punk",
    "metal",
  ];

  // Relaxed Mood Rules: Calm and soothing genres
  const relaxedGenres = [
    "jazz",
    "acoustic",
    "ambient",
    "chill",
    "lounge",
    "soul",
    "r&b",
    "rnb",
    "folk",
  ];

  // Focused Mood Rules: Instrumental and background music
  const focusedGenres = [
    "instrumental",
    "lo-fi",
    "lofi",
    "classical",
    "piano",
    "study",
    "background",
  ];

  // Apply decision rules (if/else classification)
  if (happyGenres.some((genre) => normalizedCategory.includes(genre))) {
    return "Happy";
  }

  if (sadGenres.some((genre) => normalizedCategory.includes(genre))) {
    return "Sad";
  }

  if (relaxedGenres.some((genre) => normalizedCategory.includes(genre))) {
    return "Relaxed";
  }

  if (focusedGenres.some((genre) => normalizedCategory.includes(genre))) {
    return "Focused";
  }

  // Default rule: If no match, classify as Happy (most common mood)
  return "Happy";
}

/**
 * Auto-detect and assign mood to a song if not already set
 * Uses rule-based classification based on category
 */
export function assignMoodToSong(song: ISong): Mood {
  // If mood is already set, return it
  if (song.mood && ["Happy", "Sad", "Relaxed", "Focused"].includes(song.mood)) {
    return song.mood as Mood;
  }

  // Otherwise, detect from category using decision rules
  return detectMoodFromCategory(song.category || "");
}


