import chalk from "chalk";
import inquirer from "inquirer";
import fs from "node:fs";
import path from "node:path";

import { getOSPluginsPath, PluginInfo } from "../plugin.js";

/**
 * Creates a symbolic link between the Elgato Stream Deck plugins folder, and the development environment.
 */
export default async function link() {
	const plugin = new PluginInfo();
	const osPluginsPath = getOSPluginsPath();
	const installationPath = path.join(osPluginsPath, `${plugin.manifest.UUID}.sdPlugin`);

	const status = await validatePaths(plugin, installationPath);

	// When the user opted to abort linking, bail out.
	if (status === ValidationResult.Abort) {
		console.log("Linking aborted.");
		return;
	}

	// Otherwise, when the result was okay, establish the symlink.
	if (status === ValidationResult.CanLink) {
		fs.symlinkSync(plugin.path, installationPath, "junction");
	}

	console.log(`Successfully linked ${chalk.green(plugin.manifest.UUID)} -> ${chalk.green(plugin.path)}`);
}

/**
 * Ensures the specified `installationPath` can be linked to the `plugin`.
 * When the path already exists as a symlink to another plugin, the user is prompted to replace it.
 * When the path already exists as a directory of another plugin, the user is prompted (twice) to overwrite it.
 * @param plugin Information about the plugin being linked to.
 * @param installationPath Installation path that wil link to the plugin.
 * @returns The {@link ValidationResult} based on the current state of the `installationPath`, and the user's input.
 */
async function validatePaths(plugin: PluginInfo, installationPath: string): Promise<ValidationResult> {
	// When the installation path does not exist, we can create a link.
	if (!fs.existsSync(installationPath)) {
		return ValidationResult.CanLink;
	}

	// When the installation path is an existing symlink, validate it against the plugin path.
	if (fs.lstatSync(installationPath).isSymbolicLink()) {
		return validateExistingSymlink(plugin, installationPath);
	}

	// Otherwise, prompt the user (twice) to replace the installation directory, with the link.
	console.log(`Plugin ${chalk.yellow(plugin.manifest.UUID)} is an existing directory.`);
	console.log();

	let answers = await inquirer.prompt({
		name: "confirm",
		message: "Would you like to overwrite the directory?",
		default: false,
		type: "confirm"
	});

	if (answers.confirm) {
		answers = await inquirer.prompt({
			name: "confirm",
			message: "Creating the link may result in data loss, are you sure?",
			default: false,
			type: "confirm"
		});
	}

	// Only remove the directory when the user has double-checked.
	if (answers.confirm) {
		fs.rmdirSync(installationPath);
		return ValidationResult.CanLink;
	}

	return ValidationResult.Abort;
}

/**
 * Ensures the specified `installationPath`, that is an existing symlink, can be linked to the `plugin`. When the existing link does not point to the plugin,
 * the user is prompted to confirm redirecting the current link.
 * @param plugin Information about the plugin being linked to.
 * @param installationPath Installation path that wil link to the plugin.
 * @returns The {@link ValidationResult} based on the current state of the `installationPath`, and the user's input.
 */
async function validateExistingSymlink(plugin: PluginInfo, installationPath: string): Promise<ValidationResult> {
	const existingSymlink = fs.readlinkSync(installationPath);

	// Check if the existing symlink already points to the plugin.
	if (path.resolve(existingSymlink) === path.resolve(plugin.path)) {
		return ValidationResult.AlreadyLinked;
	}

	// Otherwise prompt the user to replace the existing symlink.
	console.log(`Plugin ${chalk.yellow(plugin.manifest.UUID)} is already linked to another directory.`);
	console.log();
	console.log(`    old:  ${chalk.red(existingSymlink)}`);
	console.log(`    new:  ${chalk.green(plugin.path)}`);
	console.log();

	const answers = await inquirer.prompt({
		name: "confirm",
		message: "Would you like to redirect to the new link?",
		default: false,
		type: "confirm"
	});

	// Remove the existing link after the user has confirmed to do so.
	if (answers.confirm) {
		fs.unlinkSync(installationPath);
		return ValidationResult.CanLink;
	}

	// The user opted to not replace the existing symlink, so abort.
	return ValidationResult.Abort;
}

/**
 * Possible results that occur from validating the user's current environment prior to linking
 */
enum ValidationResult {
	/**
	 * Environment is already linked to the desired plugin, and no further action is required.
	 */
	AlreadyLinked,

	/**
	 * Environment is okay, and ready for linking.
	 */
	CanLink,

	/**
	 * User aborted linking.
	 */
	Abort
}
