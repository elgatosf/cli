import type { Manifest } from "@elgato/streamdeck";
import type { DocumentNode } from "@humanwhocodes/momoa";
import type { ValidationResult } from "../result";
import { validate } from "../validator";
import { actionImagesExist } from "./rules/action-images-exist";
import { directoryNameIsIdentifier } from "./rules/directory-name-is-uuid";
import { manifestExists } from "./rules/manifest-exists";
import { manifestSchema } from "./rules/manifest-schema";
import { pathIsDirectory } from "./rules/path-is-directory";

/**
 * Validates the Stream Deck plugin as the specified {@link path}.
 * @param path Path to the plugin.
 * @returns The validation result.
 */
export function validatePlugin(path: string): ValidationResult {
	return validate<PluginContext>(path, new PluginContext(), [pathIsDirectory, directoryNameIsIdentifier, manifestExists, manifestSchema, actionImagesExist]);
}

/**
 * Provides information about the plugin.
 */
export class PluginContext {
	/**
	 * Manifest associated with the plugin; when undefined, the manifest should be considered invalid or not present.
	 */
	public manifest: ManifestMetadata = {};

	/**
	 * Asserts the information associated with the manifest is present and valid.
	 */
	public hasManifest(): asserts this is PluginMetadataWithManifest {
		if (this.manifest?.path === undefined) {
			throw new Error("Manifest path is not defined.");
		}

		if (this.manifest?.json === undefined) {
			throw new Error("Manifest JSON is not defined.");
		}

		if (this.manifest?.jsonAst === undefined) {
			throw new Error("Manifest JSON abstract-syntax free is not defined.");
		}

		if (this.manifest?.value === undefined) {
			throw new Error("Manifest is not defined.");
		}
	}
}

/**
 * Provides information about the manifest associated with the plugin.
 */
export class ManifestMetadata {
	/**
	 * Raw JSON that was used to parse the manifest.
	 */
	public json?: string;

	/**
	 * Abstract syntax tree that represents the {@link json}.
	 */
	public jsonAst?: DocumentNode;

	/**
	 * Path to the manifest.
	 */
	public path?: string;

	/**
	 * Manifest parsed from the {@link json}; this is a valid manifest.
	 */
	public value?: Manifest;
}

/**
 * {@link PluginMetadata} with a validated {@link ManifestMetadata}.
 */
type PluginMetadataWithManifest = {
	/**
	 * Manifest associated with the plugin; when undefined, the manifest should be considered invalid or not present.
	 */
	manifest: {
		readonly [K in keyof ManifestMetadata]-?: ManifestMetadata[K];
	};
};
