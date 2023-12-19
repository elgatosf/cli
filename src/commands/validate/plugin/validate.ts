import type { Manifest } from "@elgato/streamdeck";
import { Validator, type ValidationContext, type ValidationResult } from "../validator";
import rootDirectoryRule from "./rules/root-directory";

/**
 * Validates a Stream Deck plugin.
 */
class PluginValidator extends Validator<PluginContext> {
	/**
	 * @inheritdoc
	 */
	public manifest?: Manifest;

	/**
	 * Initializes a new instance of the {@link PluginValidator} class.
	 * @param path Path to validate.
	 */
	constructor(path: string) {
		super(path);

		this.rules.push(rootDirectoryRule);
	}

	/**
	 *  @inheritdoc
	 */
	protected getContext(): PluginValidator {
		return this;
	}
}

/**
 * Validation context that enables validation of a plugin.
 */
export interface PluginContext extends ValidationContext {
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
	const pluginValidator = new PluginValidator(path);
	return pluginValidator.validate();
}
