import { existsSync } from "node:fs";
import { extname, join } from "node:path";
import { ImagePathResolution, imagePathResolution, resolveImagePath } from "../../../../stream-deck";
import { rule } from "../../rule";
import { type PluginContext } from "../validate";

/**
 * Validates the images associated with an action exist.
 */
export const actionImagesExist = rule<PluginContext>(function () {
	if (this.manifest.path === undefined || this.manifest.value === undefined) {
		throw new Error("Validating action images exist requires a manifest");
	}

	/**
	 * Validates the specified {@link value} image file exists.
	 * @param jsonPointer JSON pointer.
	 * @param value Image path.
	 * @param type Image path resolution type.
	 */
	const validate = (jsonPointer: string, value: string | undefined, type: ImagePathResolution = imagePathResolution.default): void => {
		if (value === undefined) {
			return;
		}

		const path = resolveImagePath(this.path, value, type);
		if (path === undefined) {
			this.addError(this.manifest.path!, `${jsonPointer}: "${value}" file not found`, { suggestion: `Image must be ${type.join(", ")}` });
		} else if (extname(path) === ".png" && !existsSync(join(this.path, `${value}@2x.png`))) {
			this.addWarning(path, "Missing high-resolution (@2x) variant");
		}
	};

	this.manifest.value.Actions.forEach((action, i) => {
		validate(`/Actions/${i}/Icon`, action.Icon);
		validate(`/Actions/${i}/Encoder.background`, action.Encoder?.background, imagePathResolution.encoderBackground);
		validate(`/Actions/${i}/Encoder.Icon`, action.Encoder?.Icon);

		action.States.forEach((state, j) => {
			validate(`/Actions/${i}/States/${j}/Image`, state?.Image);
			validate(`/Actions/${i}/States/${j}/MultiActionImage`, state?.MultiActionImage);
		});
	});
});
