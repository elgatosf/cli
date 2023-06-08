import chalk from "chalk";
import inquirer from "inquirer";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import Manifest, { isValidUUID } from "../manifest.js";
import * as questions from "../questions.js";

/**
 * Creates a symbolic link between the Elgato Stream Deck plugins folder, and the development environment. The command validates the plugin's path exists, and there is a valid
 * UUID prior to attempting to establish a link. When establishing a link, if a folder or link already exists in the Stream Deck plugins folder, the user is prompted to confirm
 * replacing / re-routing to the current plugin's path.
 */
export default async function link() {
	const manifest = new Manifest(path.join(process.cwd(), "manifest.json"));

	// Prompts the user to generate a valid UUID.
	if (!isValidUUID(manifest.UUID)) {
		await promptForUUID(manifest);
	}

	const installationPath = path.join(getOSPluginsPath(), `${manifest.UUID}.sdPlugin`);
	const validation = await validatePaths(manifest, installationPath);

	// When the user opted to abort linking, bail out.
	if (validation === ValidationResult.Abort) {
		console.log("Linking aborted.");
		return;
	}

	// Otherwise, when the result was okay, establish the symlink.
	if (validation === ValidationResult.CanLink) {
		fs.symlinkSync(manifest.workingDir(), installationPath, "junction");
	}

	console.log(`Successfully linked ${chalk.green(manifest.UUID)} to ${chalk.green(manifest.workingDir())}.`);
}

/**
 * Gets the path, specific to the user's operating system, that identifies where Stream Decks plugins are installed.
 * @returns Path to the Stream Deck plugins directory.
 */
export function getOSPluginsPath(): string {
	if (os.platform() === "darwin") {
		return path.join(os.homedir(), "Library/Application Support/com.elgato.StreamDeck/Plugins");
	}

	const appData = process.env.APPDATA ?? path.join(os.homedir(), "AppData/Roaming");
	return path.join(appData, "Elgato/StreamDeck/Plugins");
}

/**
 * Prompts the user to specify a UUID to associate with the plugin; this is a required step prior to linking.
 * @param manifest Manifest associated with the plugin.
 */
async function promptForUUID(manifest: Manifest): Promise<void> {
	console.log(`The UUID (unique-identifier) for the plugin must be set before linking.`);
	const answers = await inquirer.prompt(questions.uuid(manifest.generateUUID()));

	manifest.UUID = answers.uuid;
	manifest.writeFile();
	console.log(`Successfully set plugin ${chalk.green("UUID")} to ${chalk.green(answers.uuid)}.`);
}

/**
 * Ensures the specified `installationPath` can be linked to the plugin defined by the `manifest`.
 * When the path already exists as a symlink to another plugin, the user is prompted to replace it.
 * When the path already exists as a directory of another plugin, the user is prompted (twice) to overwrite it.
 * @param manifest Manifest associated with the plugin.
 * @param installationPath Installation path that wil link to the plugin.
 * @returns The {@link ValidationResult} based on the current state of the `installationPath`, and the user's input.
 */
async function validatePaths(manifest: Manifest, installationPath: string): Promise<ValidationResult> {
	// When the installation path does not exist, we can create a link.
	if (!fs.existsSync(installationPath)) {
		return ValidationResult.CanLink;
	}

	// When the installation path is an existing symlink, validate it against the plugin path.
	if (fs.lstatSync(installationPath).isSymbolicLink()) {
		return validateExistingSymlink(manifest, installationPath);
	}

	// Otherwise, prompt the user (twice) to replace the installation directory, with the link.
	console.log(`Plugin ${chalk.yellow(manifest.UUID)} is an existing directory.`);
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
 * Ensures the specified `installationPath`, that is an existing symlink, can be linked to the plugin. When the existing link does not point to the plugin, the user is prompted to
 * confirm redirecting the current link.
 * @param manifest Manifest associated with the plugin.
 * @param installationPath Installation path that wil link to the plugin.
 * @returns The {@link ValidationResult} based on the current state of the `installationPath`, and the user's input.
 */
async function validateExistingSymlink(manifest: Manifest, installationPath: string): Promise<ValidationResult> {
	const existingSymlink = fs.readlinkSync(installationPath);

	// Check if the existing symlink already points to the plugin.
	if (path.resolve(existingSymlink) === path.resolve(manifest.workingDir())) {
		return ValidationResult.AlreadyLinked;
	}

	// Otherwise prompt the user to replace the existing symlink.
	console.log(`Plugin ${chalk.yellow(manifest.UUID)} is already linked to another directory.`);
	console.log();
	console.log(`    old:  ${chalk.red(existingSymlink)}`);
	console.log(`    new:  ${chalk.green(manifest.workingDir())}`);
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
