/**
 * Provides a utility type that recursively applies {@link Partial} to all properties that are objects.
 */
export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;
