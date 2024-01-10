import chalk from "chalk";
import { existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { type JsonElement } from "../../../../common/json";
import { ImagePathResolution, imagePathResolution, resolveImagePath } from "../../../../stream-deck";
import { rule } from "../../rule";
import { type PluginContext } from "../contexts/plugin";

/**
 * Validates the files defined within the manifest exist.
 */
export const manifestFilesExist = rule<PluginContext>(function (plugin: PluginContext) {
	const missingHighRes = new Set<string>();

	/**
	 * Validates the specified {@link elem} file exists.
	 * @param elem JSON element that contains information about the file to validate.
	 * @param ext File extension.
	 */
	const fileExists = (elem: JsonElement<string> | undefined, ext: string = ""): void => {
		if (elem?.value === undefined) {
			return;
		}

		const path = resolve(this.path, elem.value, ext);
		if (!existsSync(path)) {
			this.addError(plugin.manifest.path, `file not found: ${chalk.green(`'${elem.value}'`)}`, {
				...elem,
				suggestion: ext !== "" ? `File must be ${ext}` : undefined
			});
		}
	};

	/**
	 * Validates the specified {@link elem} image file exists.
	 * @param elem JSON element that contains information about the image to validate.
	 * @param type Image path resolution type.
	 */
	const imageExists = (elem: JsonElement<string> | undefined, type: ImagePathResolution = imagePathResolution.default): void => {
		if (elem?.value === undefined) {
			return;
		}

		const path = resolveImagePath(this.path, elem.value, type);
		if (path === undefined) {
			this.addError(plugin.manifest.path, `file not found: ${chalk.green(`'${elem.value}'`)}`, {
				...elem,
				suggestion: `Image must be ${type.join(", ")}, and value must not contain extension`
			});
		} else if (extname(path) === ".png" && !existsSync(join(this.path, `${elem.value}@2x.png`)) && !missingHighRes.has(path)) {
			this.addWarning(path, "Missing high-resolution (@2x) variant");
			missingHighRes.add(path);
		}
	};

	// Top-level.
	fileExists(plugin.manifest.manifest.CodePath);
	fileExists(plugin.manifest.manifest.CodePathMac);
	fileExists(plugin.manifest.manifest.CodePathWin);
	imageExists(plugin.manifest.manifest.Icon);
	imageExists(plugin.manifest.manifest.CategoryIcon);
	fileExists(plugin.manifest.manifest.PropertyInspectorPath);

	// Action files.
	plugin.manifest.manifest.Actions?.forEach((action) => {
		imageExists(action?.Icon);
		imageExists(action?.Encoder?.background, imagePathResolution.encoderBackground);
		imageExists(action?.Encoder?.Icon);
		fileExists(action.PropertyInspectorPath);
		if (!isPredefinedLayout(action.Encoder?.layout)) {
			fileExists(action.Encoder?.layout);
		}

		action.States?.forEach((state) => {
			imageExists(state?.Image);
			imageExists(state?.MultiActionImage);
		});
	});

	// Profile files.
	plugin.manifest.manifest.Profiles?.forEach((profile) => fileExists(profile.Name, ".streamDeckProfile"));
});

/**
 * Determines whether the {@link elem} represents a pre-defined layout; this is guarded by the manifest's JSON schema validation.
 * @param elem JSON element that contains the information about the layout.
 * @returns `true` when the value represents a pre-defined layout.
 */
function isPredefinedLayout(elem: JsonElement<string> | undefined): boolean {
	return elem?.value?.startsWith("$") === true && !elem.value.endsWith(".json");
}
