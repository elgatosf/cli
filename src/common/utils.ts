/**
 * Compare {@link a} to {@link b}, and returns a numerical representation of the comparison.
 * @param a The first item.
 * @param b The second item.
 * @returns -1 when {@link a} is less than {@link b}, 1 when {@link a} is greater than {@link b}, otherwise 0.
 */
export function compare<T>(a: T | undefined, b: T | undefined): number {
	const x = a === undefined || a === null ? Infinity : a;
	const y = b === undefined || b === null ? Infinity : b;

	return x === y ? 0 : x < y ? -1 : 1;
}
