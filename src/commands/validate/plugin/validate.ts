import type { ValidationResult } from "../result";
import { validate } from "../validator";
import { PluginContext } from "./contexts/plugin";
import { actionUuidIsUniqueAndPrefixed } from "./rules/manifest-action-uuids";
import { manifestFilesExist } from "./rules/manifest-files-exist";
import { manifestExistsAndSchemaIsValid } from "./rules/manifest-schema";
import { manifestUrlsExist } from "./rules/manifest-urls-exist";
import { pathIsDirectoryAndUuid } from "./rules/path-input";

/**
 * Validates the Stream Deck plugin as the specified {@link path}.
 * @param path Path to the plugin.
 * @returns The validation result.
 */
export function validatePlugin(path: string): Promise<ValidationResult> {
	return validate<PluginContext>(path, new PluginContext(path), [pathIsDirectoryAndUuid, manifestExistsAndSchemaIsValid, manifestFilesExist, manifestUrlsExist, actionUuidIsUniqueAndPrefixed]);
}
