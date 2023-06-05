/**
 * Manifest information used to define a plugin.
 */
export type Manifest = {
	/**
	 * Author's name.
	 */
	Author?: string;

	/**
	 * Plugin name; this is the value displayed in the Stream Deck, Marketplace, etc.
	 */
	Name?: string;

	/**
	 * Plugin's unique identifier.
	 */
	UUID?: string;
};
