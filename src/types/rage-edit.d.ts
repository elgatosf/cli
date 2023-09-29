declare module "rage-edit" {
	export const Registry: {
		/**
		 * Sets the specified registry key.
		 * @param path Path to the registry entry.
		 * @param name Name of the registry entry.
		 * @param data Data to be stored.
		 */
		set(path: string, name: string, data: unknown): Promise<void>;
	};
}
