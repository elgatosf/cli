import { existsSync } from "node:fs";
import { extname, join } from "node:path";
import { type JsonElement } from "../../../../common/json";
import { ImagePathResolution, imagePathResolution, resolveImagePath } from "../../../../stream-deck";
import { rule } from "../../rule";
import { type PluginContext } from "../contexts/plugin";

/**
 * Validates the images associated with an action exist.
 */
export const actionImagesExist = rule<PluginContext>(function (plugin: PluginContext) {
	/**
	 * Validates the specified {@link elem} image file exists.
	 * @param elem JSON element that contains information about the image to validate.
	 * @param type Image path resolution type.
	 */
	const validate = (elem: JsonElement<string> | undefined, type: ImagePathResolution = imagePathResolution.default): void => {
		if (elem?.value === undefined) {
			return;
		}

		const path = resolveImagePath(this.path, elem.value, type);
		if (path === undefined) {
			this.addError(plugin.manifest.path, `${elem.pointer}: '${elem.value}' file not found`, {
				suggestion: `Image must be ${type.join(", ")}`,
				position: elem.location
			});
		} else if (extname(path) === ".png" && !existsSync(join(this.path, `${elem.value}@2x.png`))) {
			this.addWarning(path, "Missing high-resolution (@2x) variant");
		}
	};

	plugin.manifest.manifest.Actions?.forEach((action) => {
		validate(action?.Icon);
		validate(action?.Encoder?.background, imagePathResolution.encoderBackground);
		validate(action?.Encoder?.Icon);

		action.States?.forEach((state) => {
			validate(state?.Image);
			validate(state?.MultiActionImage);
		});
	});
});
