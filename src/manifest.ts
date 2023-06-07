import fs from "node:fs";

/**
 * Provides information and methods for working with the `manifest.json` file that supports a Stream Deck plugin.
 */
export class Manifest {
	/**
	 * Author of the plugin; this can be a user, or an organization.
	 */
	public Author?: string;

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
	 * The source path of the manifest file.
	 */
	private readonly __sourcePath: string;

	/**
	 * Initializes a new instance of {@link Manifest}.
	 * @param path Path of the manifest file.
	 */
	constructor(path: string) {
		this.__sourcePath = path;

		if (fs.existsSync(this.__sourcePath)) {
			if (!fs.statSync(this.__sourcePath).isFile()) {
				throw new Error("The specified path is not a valid Manifest file as it is a directory.");
			}

			Object.assign(this, JSON.parse(fs.readFileSync(this.__sourcePath).toString()));
		}
	}

	/**
	 * Writes the information to the manifest.json file.
	 */
	public writeFile() {
		const data = JSON.stringify(this, (key, value) => (key === "__sourcePath" ? undefined : value), 2);
		fs.writeFileSync(this.__sourcePath, data);
	}
}
