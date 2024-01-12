import { rule } from "../../rule";
import { type PluginContext } from "../contexts/plugin";

import { existsSync } from "node:fs";
import { imagePathResolution } from "../../../../stream-deck";

const mustOmitExtension = "must reference file with extension omitted";

// TODO: update validation to also validate file paths.

/**
 * When the value starts with "..", must not be outside root directory.
 * When the value starts with "/"  or "\", must not start with a slash.
 * When the value has an extension (and should), must reference file with extension omitted.
 */

/**
 * Validates the JSON schema of the manifest.
 */
export const manifestExistsAndSchemaIsValid = rule<PluginContext>(function (plugin: PluginContext) {
	if (!existsSync(plugin.manifest.path)) {
		this.addError(plugin.manifest.path, "Manifest not found");
	}

	plugin.manifest.errors.forEach(({ message, location, source: { instancePath, keyword } }) => {
		const add = (message: string, suggestion?: string): void => {
			this.addError(plugin.manifest.path, message, { location, suggestion });
		};

		// Generic error.
		if (keyword !== "pattern") {
			return add(message);
		}

		// Action identifier
		if (instancePath.match(/\/Actions\/\d+\/UUID/)) {
			return add("must conform to reverse-DNS format", "Identifier may contain lowercase alphanumeric characters (a-z, 0-9), hyphens (-), underscores (_), and periods (.)");
		}

		// Colors
		if (instancePath.match(/\/Actions\/\d+\/States\/\d+\/TitleColor/) || instancePath.match(/\/Actions\/\d+\/Encoder\/StackColor/)) {
			return add("must be hexadecimal color");
		}

		// Images (".gif", ".svg", ".png").
		if (
			instancePath.match(/\/Actions\/\d+\/Icon/) ||
			instancePath.match(/\/Actions\/\d+\/Encoder\/Icon/) ||
			instancePath.match(/\/Actions\/\d+\/States\/\d+\/Image/) ||
			instancePath.match(/\/Actions\/\d+\/States\/\d+\/MultiActionImage/) ||
			instancePath.match(/\/Icon/)
		) {
			return add(mustOmitExtension, `Image must be ${imagePathResolution.default.join(", ")}`);
		}

		// Images (".svg", ".png").
		if (instancePath.match(/\/CategoryIcon/)) {
			return add(mustOmitExtension, `Image must be ${imagePathResolution.categoryIcon.join(", ")}`);
		}

		// Images (".png", ".svg").
		if (instancePath.match(/\/Actions\/\d+\/Encoder\/background/)) {
			return add(mustOmitExtension, `Image must be ${imagePathResolution.encoderBackground.join(", ")}`);
		}

		// Layout file.
		if (instancePath.match(/\/Actions\/\d+\/Encoder\/layout/)) {
			return add("must reference JSON file with .json extension, or pre-defined layout", "Pre-defined layouts: $X1, $A0, A1, B1, $B2, $C1");
		}

		// Profiles.
		if (instancePath.match(/\/Profiles\/\d+\/Name/)) {
			return add(mustOmitExtension);
		}

		// Property inspectors.
		if (instancePath.match(/\/PropertyInspectorPath/) || instancePath.match(/\/Actions\/\d+\/PropertyInspectorPath/)) {
			return add("must reference HTML file with .htm or .html extension");
		}
	});
});
