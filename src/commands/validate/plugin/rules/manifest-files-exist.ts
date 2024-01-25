import { existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { type JsonElement } from "../../../../common/json";
import { colorize } from "../../../../common/stdout";
import { aggregate } from "../../../../common/utils";
import { rule } from "../../rule";
import { type PluginContext } from "../contexts/plugin";

/**
 * Validates the files defined within the manifest exist.
 */
export const manifestFilesExist = rule<PluginContext>(function (plugin: PluginContext) {
	const missingHighRes = new Set<string>();

	/**
	 * Validates the specified {@link elem} file exists, and is valid based on the file options specified within the manifest's JSON schema.
	 * @param elem JSON element that contains information about the file to validate.
	 */
	const validate = (elem: JsonElement<string> | undefined): void => {
		// When there is no value, we have nothing to validate.
		if (elem?.value === undefined) {
			return;
		}

		// Validate the file is nested within the plugin directory.
		if (elem.value.startsWith("../")) {
			this.addError(plugin.manifest.path, "must not reference file outside plugin directory", elem);
			return;
		}

		// Determine if there are file path options associated with the element.
		const opts = plugin.manifest.schema?.getFilePathOptions(elem.location.instancePath);
		const possiblePaths = typeof opts === "object" && !opts.includeExtension ? opts.extensions.map((ext) => `${elem.value}${ext}`) : [elem.value];

		// Attempt to resolve the possible paths the value can represent.
		let resolvedPath: string | undefined = undefined;
		for (const possiblePath of possiblePaths) {
			const path = resolve(this.path, possiblePath);
			if (existsSync(path)) {
				// If the path has already been resolved, there are files with duplicate names, e.g. "my-image.png" and "my-image.svg". Warn, and highlighted the resolved path.
				if (resolvedPath !== undefined) {
					this.addWarning(plugin.manifest.path, `multiple files named ${colorize(elem.value)} found, using ${colorize(resolvedPath)}`, elem);
					break;
				}

				resolvedPath = possiblePath;
			}
		}

		// Validate there is a resolved path, when there isn't, it means a file was not found.
		if (resolvedPath === undefined) {
			this.addError(plugin.manifest.path, `file not found, ${colorize(elem.value)}`, {
				...elem,
				suggestion: typeof opts === "object" ? `File must be ${aggregate(opts.extensions, "or")}` : undefined
			});

			return;
		}

		// Validate there is a high-res version of the image, when the resolved path is a .png file.
		if (extname(resolvedPath) === ".png" && !existsSync(join(this.path, `${elem.value}@2x.png`)) && !missingHighRes.has(resolvedPath)) {
			this.addWarning(resolvedPath, "Missing high-resolution (@2x) variant");
			missingHighRes.add(resolvedPath);
		}
	};

	// Top-level.
	validate(plugin.manifest.value.CodePath);
	validate(plugin.manifest.value.CodePathMac);
	validate(plugin.manifest.value.CodePathWin);
	validate(plugin.manifest.value.Icon);
	validate(plugin.manifest.value.CategoryIcon);
	validate(plugin.manifest.value.PropertyInspectorPath);

	// Action files.
	plugin.manifest.value.Actions?.forEach((action) => {
		validate(action?.Icon);
		validate(action?.Encoder?.background);
		validate(action?.Encoder?.Icon);
		validate(action.PropertyInspectorPath);
		if (!isPredefinedLayout(action.Encoder?.layout)) {
			validate(action.Encoder?.layout);
		}

		action.States?.forEach((state) => {
			validate(state?.Image);
			validate(state?.MultiActionImage);
		});
	});

	// Profile files.
	plugin.manifest.value.Profiles?.forEach((profile) => validate(profile.Name));
});

/**
 * Determines whether the {@link elem} represents a pre-defined layout; this is guarded by the manifest's JSON schema validation.
 * @param elem JSON element that contains the information about the layout.
 * @returns `true` when the value represents a pre-defined layout.
 */
function isPredefinedLayout(elem: JsonElement<string> | undefined): boolean {
	return elem?.value?.startsWith("$") === true && !elem.value.endsWith(".json");
}
