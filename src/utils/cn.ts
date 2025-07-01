import { clsx, ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names into a single string.
 *
 * This function takes any number of arguments, which can be strings, arrays, or objects,
 * and merges them into a single class name string. It uses the `clsx` library to handle
 * the merging and the `twMerge` function to handle Tailwind CSS class name conflicts.
 *
 * @param {...ClassValue[]} args - The class names to combine. These can be strings, arrays, or objects.
 * @returns {string} The combined class name string.
 */

export default function cn(...args: ClassValue[]) {
  return twMerge(clsx(args));
}
