import { ISong, Category } from "@/models/Song";

/**
 * Mood Detection Algorithm
 *
 * Computer Science Concept: Rule-Based Classification
 *
 * This algorithm uses decision rules (if/else statements) to classify songs into moods
 * based on audio features (tempo, energy, valence) or category/genre. This is a simple,
 * explainable approach suitable for academic projects.
 *
 * Algorithm Approach:
 * - Audio Feature-Based: Uses tempo, energy, valence to determine mood (Method 2)
 * - Category-Based Fallback: Uses song metadata (category) if audio features unavailable
 * - Decision Tree Logic: Clear if/else rules for classification
 * - No Machine Learning: Pure rule-based for simplicity and transparency
 */

export type Mood = "Happy" | "Sad" | "Relaxed" | "Focused";

/**
 * Rule-based mood classification based on song category/genre
 *
 * Decision Rules (Category-Based):
 * - Happy: Upbeat genres (Pop, Rock, Electronic, Hip Hop, Country)
 * - Sad: Melancholic/alt genres (Indie)
 * - Relaxed: Calm genres (Jazz, R&B)
 * - Focused: Instrumental/background genres (Classical)
 *
 * If category doesn't match any rule, defaults to Happy (most common mood)
 */
export function detectMoodFromCategory(category: Category | string): Mood {
  const normalizedCategory = category.toLowerCase().trim();

  // Happy Mood Rules: Upbeat and energetic genres
  const happyGenres = ["pop", "rock", "electronic", "hip hop", "country"];

  // Sad Mood Rules: Melancholic/indie genres
  const sadGenres = ["indie"];

  // Relaxed Mood Rules: Calm and soothing genres
  const relaxedGenres = ["jazz", "r&b"];

  // Focused Mood Rules: Instrumental and background music
  const focusedGenres = ["classical"];

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
 * Rule-based mood classification based on audio features (tempo, energy, valence)
 *
 * Decision Rules (Audio Feature-Based):
 * - Sad: Very low valence (≤0.3) OR low valence (≤0.4) + slow tempo (≤90 BPM)
 * - Happy: High valence (≥0.6) + High energy (≥0.6) + Fast tempo (≥100 BPM)
 * - Relaxed: Medium valence (0.4-0.7) + Low energy (≤0.5) + Slow tempo (≤100 BPM)
 * - Focused: Medium valence + Low energy (≤0.6) + Medium tempo (80-120 BPM)
 *
 * If audio features are missing, falls back to category-based detection
 */
export function detectMoodFromAudioFeatures(
  tempo?: number,
  energy?: number,
  valence?: number
): Mood {
  // If any feature is missing, return undefined (caller should use fallback)
  if (tempo === undefined || energy === undefined || valence === undefined) {
    throw new Error("All audio features (tempo, energy, valence) are required");
  }

  // Rule 1: Sad - Very low valence (most specific, check first)
  if (valence <= 0.3) {
    return "Sad";
  }

  // Rule 2: Sad - Low valence + Slow tempo
  if (valence <= 0.4 && tempo <= 90) {
    return "Sad";
  }

  // Rule 3: Focused - Very low energy + Medium tempo (study/work music like Classical)
  // Check before Relaxed to catch Classical (energy=0.4, tempo=90)
  if (energy <= 0.45 && tempo >= 70 && tempo <= 120) {
    return "Focused";
  }

  // Rule 4: Relaxed - Medium valence + Low-medium energy + Moderate tempo
  // Catches Jazz (energy=0.5, valence=0.55, tempo=110), R&B (energy=0.6, valence=0.6, tempo=100)
  // and Hip Hop (energy=0.7, valence=0.6, tempo=95)
  if (
    valence >= 0.4 &&
    valence <= 0.7 &&
    energy <= 0.7 &&
    tempo >= 80 &&
    tempo <= 115
  ) {
    return "Relaxed";
  }

  // Rule 5: Happy - Very high valence (catches Electronic with valence=0.8)
  if (valence >= 0.75) {
    return "Happy";
  }

  // Rule 6: Happy - High valence + High energy + Fast tempo
  // Catches Pop, Rock, Country, Electronic
  if (valence >= 0.6 && energy >= 0.65 && tempo >= 100) {
    return "Happy";
  }

  // Rule 7: Happy - Medium-high valence + Very high energy (catches Rock)
  if (valence >= 0.6 && energy >= 0.85) {
    return "Happy";
  }

  // Rule 8: Focused - Medium energy + Medium tempo (fallback for study music)
  if (energy <= 0.7 && tempo >= 80 && tempo <= 120) {
    return "Focused";
  }

  // Default: If no specific rule matches, classify as Happy (most common mood)
  return "Happy";
}

/**
 * Auto-detect and assign mood to a song if not already set
 * Prefers audio feature-based detection, falls back to category-based
 */
export function assignMoodToSong(song: ISong): Mood {
  // If mood is already set, return it
  if (song.mood && ["Happy", "Sad", "Relaxed", "Focused"].includes(song.mood)) {
    return song.mood as Mood;
  }

  // Prefer audio feature-based detection if all features are available
  if (
    song.tempo !== undefined &&
    song.energy !== undefined &&
    song.valence !== undefined
  ) {
    return detectMoodFromAudioFeatures(song.tempo, song.energy, song.valence);
  }

  // Fallback: detect from category using decision rules
  return detectMoodFromCategory(song.category || "");
}
