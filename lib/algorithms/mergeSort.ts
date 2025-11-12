/**
 * Merge Sort Algorithm
 * Efficient sorting algorithm with O(n log n) time complexity
 * Used for sorting songs by various criteria (title, duration, date, playCount)
 */

/**
 * Merge two sorted arrays
 * @param left - Left sorted array
 * @param right - Right sorted array
 * @param key - Key to sort by (e.g., 'title', 'duration', 'playCount', 'createdAt')
 * @param order - 'asc' for ascending, 'desc' for descending
 * @returns Merged sorted array
 */
function merge<T>(
  left: T[],
  right: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  const result: T[] = [];
  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < left.length && rightIndex < right.length) {
    const leftValue = left[leftIndex][key];
    const rightValue = right[rightIndex][key];

    let comparison = 0;
    if (typeof leftValue === 'string' && typeof rightValue === 'string') {
      comparison = leftValue.localeCompare(rightValue);
    } else if (leftValue instanceof Date && rightValue instanceof Date) {
      comparison = leftValue.getTime() - rightValue.getTime();
    } else if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      comparison = leftValue - rightValue;
    }

    const shouldTakeLeft = order === 'asc' ? comparison <= 0 : comparison >= 0;

    if (shouldTakeLeft) {
      result.push(left[leftIndex]);
      leftIndex++;
    } else {
      result.push(right[rightIndex]);
      rightIndex++;
    }
  }

  // Add remaining elements
  return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
}

/**
 * Merge Sort implementation
 * @param array - Array to sort
 * @param key - Key to sort by
 * @param order - 'asc' for ascending, 'desc' for descending
 * @returns Sorted array
 */
export function mergeSort<T>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  // Base case: array with 0 or 1 element is already sorted
  if (array.length <= 1) {
    return array;
  }

  // Divide: split array into two halves
  const middle = Math.floor(array.length / 2);
  const left = array.slice(0, middle);
  const right = array.slice(middle);

  // Conquer: recursively sort both halves
  const sortedLeft = mergeSort(left, key, order);
  const sortedRight = mergeSort(right, key, order);

  // Combine: merge the sorted halves
  return merge(sortedLeft, sortedRight, key, order);
}

