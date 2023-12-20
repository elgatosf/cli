import type { Manifest } from "@elgato/streamdeck";
import { validate, type ValidationResult } from "../validator";
import { directoryNameIsIdentifier } from "./rules/directory-name-is-uuid";
import { manifestExists } from "./rules/manifest-exists";
import { manifestSchema } from "./rules/manifest-schema";
import { pathIsDirectory } from "./rules/path-is-directory";

/**
 * Validation context that enables validation of a plugin.
 */
export interface PluginContext {
	/**
	 * Path to the root of the plugin.
	 */
	path: string;

	/**
	 * Manifest associated with the plugin; when undefined, the manifest should be considered invalid.
	 */
	manifest?: Manifest;
}

/**
 * Validates the Stream Deck plugin as the specified {@link path}.
 * @param path Path to the plugin.
 * @returns The validation result.
 */
export function validatePlugin(path: string): ValidationResult {
	return validate<PluginContext>({ path }, [pathIsDirectory, directoryNameIsIdentifier, manifestExists, manifestSchema]);
}
