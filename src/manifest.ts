import fs from "node:fs";
import { dirname } from "node:path";

/**
 * Provides information and methods for working with the `manifest.json` file that supports a Stream Deck plugin.
 */
export default class Manifest {
	/**
	 * Collection of actions that define the functionality available to the user provided by the plugin. Actions are the primary method of interaction between the user, and the
	 * plugin, with action information being provided by events emitted by the Stream Deck.
	 * @example
	 * "Mute Microphone"
	 * @example
	 * "Turn Lights On"
	 */
	public Actions?: {
		/**
		 * Unique identifier used to identify the action as part of events emitted by the Stream Deck. Identifiers should use reverse DNS format, and may only contain lowercase
		 * alphanumeric characters (a-z, 0-9), hyphens (-), underscores (_), or periods (.).
		 * @example
		 * com.elgato.wavelink.mixermute
		 * @example
		 * com.elgato.controlcenter.lights-on-off
		 */
		UUID?: string;
	}[];

	/**
	 * Author of the plugin; this can be a user, or an organization.
	 */
	public Author?: string;

	/**
	 * Category used to group the plugin's actions together in the action's list, in Stream Deck.
	 */
	public Category?: string;

	/**
	 * General description of what the plugin does.
	 */
	public Description?: string;

	/**
	 * Name of the plugin; this is displayed to user's in the Marketplace, and is used to easily identify the plugin.
	 */
	public Name?: string;

	/**
	 * Collection of supported operating systems, and the minimum version required for the plugin to run.
	 */
	public OS?: {
		/**
		 * Minimum version of the operating system required for the plugin to run.
		 */
		MinimumVersion: number;

		/**
		 * Operating system platform identifier, e.g. mac for macOS, or Windows.
		 */
		Platform: "mac" | "windows";
	}[];

	/**
	 * Plugin's unique identifier.
	 */
	public UUID?: string;

	/**
	 * Gets the source path of the manifest file.
	 */
	private readonly __sourcePath: string;

	/**
	 * Gets the working directory of the plugin; this is typically the development environment.
	 */
	private readonly __workingDir: string;

	/**
	 * Initializes a new instance of {@link Manifest}.
	 * @param path Path of the manifest file.
	 */
	constructor(path: string) {
		this.__sourcePath = path;
		this.__workingDir = dirname(path);

		if (fs.existsSync(this.__sourcePath)) {
			if (!fs.statSync(this.__sourcePath).isFile()) {
				throw new Error("The specified path is not a valid Manifest file as it is a directory.");
			}

			Object.assign(this, JSON.parse(fs.readFileSync(this.__sourcePath).toString()));
		}
	}

	/**
	 * Generates a UUID from the `Author` and `Name`; both values are parsed to ensure they result in a whole valid UUID. When one or more value cannot be parsed, the resulting UUID is `undefined`.
	 * @returns UUID that represents the plugin, from information found in the manifest.json file; otherwise `undefined`.
	 */
	public generateUUID(): string | undefined {
		return generateUUID(this.Author, this.Name);
	}

	/**
	 * Gets the working directory of the plugin; this is typically the development environment.
	 * @returns Path to the working directory of the plugin.
	 */
	public workingDir() {
		return this.__workingDir;
	}

	/**
	 * Writes the information to the manifest.json file.
	 */
	public writeFile() {
		const data = JSON.stringify(this, (key, value) => (key.startsWith("__") ? undefined : value), 2);
		fs.writeFileSync(this.__sourcePath, data);
	}
}

/**
 * Generates a UUID from the `author` and `name` values. Values are parsed to ensure valid sections, resulting in a complete UUID; when a value cannot be parsed, the resulting UUID is `undefined`.
 * @param author Author of the plugin.
 * @param name Name of the plugin.
 * @returns UUID that represents the plugin, from information found in the manifest.json file; otherwise `undefined`.
 */
export function generateUUID(author: string | undefined, name: string | undefined): string | undefined {
	const sections = {
		author: formatSection(author),
		name: formatSection(name)
	};

	if (sections.author === undefined || sections.name === undefined) {
		return;
	}

	return `com.${sections.author}.${sections.name}`;

	/**
	 * Attempts to format the specified `value` as a section of the plugin's UUID; when the `value` results in an empty string, `undefined` is returned.
	 * @param value Value to parse, and make UUID safe.
	 * @returns Value that is safe for a UUID section; otherwise `undefined`.
	 */
	function formatSection(value: string | undefined): string | undefined {
		if (value === undefined) {
			return undefined;
		}

		const safeValue = value
			.toLowerCase()
			.replaceAll(" ", "-")
			.replaceAll(/[^\-a-z0-9_]/g, "");

		return safeValue !== "" ? safeValue : undefined;
	}
}

/**
 * Determines whether the specified `uuid` is a valid unique-identifier.
 * @param uuid UUID being checked.
 * @returns `true` when the `uuid` represents a valid unique-identifier; otherwise `false`.
 */
export function isValidUUID(uuid: string | undefined): boolean {
	if (uuid === undefined) {
		return false;
	}

	return /^([a-z0-9\-_.]+)$/.test(uuid);
}
