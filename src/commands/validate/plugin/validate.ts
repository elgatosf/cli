import type { ValidationResult } from "../result";
import { validate } from "../validator";
import { PluginContext } from "./contexts/plugin";
import { actionImagesExist } from "./rules/action-images-exist";
import { directoryNameIsIdentifier } from "./rules/directory-name-is-uuid";
import { manifestExistsAndSchemaIsValid } from "./rules/manifest-exists-and-schema-valid";
import { pathIsDirectory } from "./rules/path-is-directory";

/**
 * Validates the Stream Deck plugin as the specified {@link path}.
 * @param path Path to the plugin.
 * @returns The validation result.
 */
export function validatePlugin(path: string): ValidationResult {
	return validate<PluginContext>(path, new PluginContext(path), [pathIsDirectory, directoryNameIsIdentifier, manifestExistsAndSchemaIsValid, actionImagesExist]);
}
