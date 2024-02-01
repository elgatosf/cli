import type { ValidationResult } from "../result";
import { validate } from "../validator";
import { createContext, type PluginContext } from "./plugin";
import { layoutItemsAreWithinBoundsAndNoOverlap } from "./rules/layout-item-bounds";
import { layoutItemKeysAreUnique } from "./rules/layout-item-keys";
import { layoutsExistAndSchemasAreValid } from "./rules/layout-schema";
import { actionUuidIsUniqueAndPrefixed } from "./rules/manifest-action-uuids";
import { categoryMatchesName } from "./rules/manifest-category";
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
	return validate<PluginContext>(path, createContext(path), [
		pathIsDirectoryAndUuid,
		manifestExistsAndSchemaIsValid,
		manifestFilesExist,
		manifestUrlsExist,
		actionUuidIsUniqueAndPrefixed,
		categoryMatchesName,
		layoutsExistAndSchemasAreValid,
		layoutItemKeysAreUnique,
		layoutItemsAreWithinBoundsAndNoOverlap
	]);
}
