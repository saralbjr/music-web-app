import { Category } from "@/models/Song";

/**
 * Audio Feature Estimation Algorithm
 *
 * Computer Science Concept: Rule-Based Feature Extraction
 *
 * This algorithm uses decision rules to estimate audio features (tempo, energy, valence)
 * based on music category/genre. This is a simple, explainable approach suitable for
 * academic projects that avoids heavy audio analysis libraries.
 *
 * Algorithm Approach:
 * - Rule-Based Mapping: Category → Estimated Audio Features
 * - No Machine Learning: Pure rule-based for simplicity and transparency
 * - No Heavy Dependencies: Uses only category metadata, no audio analysis libraries
 */

/**
 * Estimate tempo (BPM - Beats Per Minute) from category
 * Rule-based mapping: Each category has a typical tempo range
 */
export function estimateTempoFromCategory(category: Category): number {
  const tempoMap: Record<Category, number> = {
    Pop: 120, // Typical pop tempo (120-140 BPM)
    Rock: 130, // Rock is usually faster (120-150 BPM)
    "Hip Hop": 95, // Hip hop is typically slower (80-110 BPM)
    Jazz: 110, // Jazz varies but often moderate (100-130 BPM)
    Electronic: 128, // Electronic/dance music (120-140 BPM)
    Classical: 90, // Classical varies widely, use moderate (60-120 BPM)
    Country: 115, // Country music tempo (100-130 BPM)
    "R&B": 100, // R&B is often slower and smooth (80-120 BPM)
    Indie: 85, // Indie/alt often mid-slow and melancholic
  };

  return tempoMap[category] || 110; // Default to moderate tempo
}

/**
 * Estimate energy level (0-1 scale) from category
 * Higher energy = more intense, energetic music
 */
export function estimateEnergyFromCategory(category: Category): number {
  const energyMap: Record<Category, number> = {
    Pop: 0.8, // Pop is energetic
    Rock: 0.9, // Rock is very energetic
    "Hip Hop": 0.7, // Hip hop has good energy
    Jazz: 0.5, // Jazz is moderate energy
    Electronic: 0.85, // Electronic is high energy
    Classical: 0.4, // Classical is lower energy
    Country: 0.7, // Country has moderate-high energy
    "R&B": 0.6, // R&B is smooth, moderate energy
    Indie: 0.55, // Indie/alt tends to be mid-low energy
  };

  return energyMap[category] || 0.6; // Default to moderate energy
}

/**
 * Estimate valence (0-1 scale) from category
 * Higher valence = more positive, happy music
 * Lower valence = more negative, sad music
 */
export function estimateValenceFromCategory(category: Category): number {
  const valenceMap: Record<Category, number> = {
    Pop: 0.75, // Pop is generally positive/happy
    Rock: 0.65, // Rock can be positive but varies
    "Hip Hop": 0.6, // Hip hop varies, often neutral-positive
    Jazz: 0.55, // Jazz is often neutral, sophisticated
    Electronic: 0.8, // Electronic/dance is very positive
    Classical: 0.5, // Classical is neutral, varies by piece
    Country: 0.7, // Country is often positive/uplifting
    "R&B": 0.6, // R&B is smooth, neutral-positive
    Indie: 0.35, // Indie often leans melancholic/bittersweet
  };

  return valenceMap[category] || 0.6; // Default to neutral-positive
}

/**
 * Estimate all audio features from category
 * Returns an object with tempo, energy, and valence
 */
export function estimateAudioFeaturesFromCategory(category: Category): {
  tempo: number;
  energy: number;
  valence: number;
} {
  return {
    tempo: estimateTempoFromCategory(category),
    energy: estimateEnergyFromCategory(category),
    valence: estimateValenceFromCategory(category),
  };
}

