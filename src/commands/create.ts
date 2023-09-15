import chalk from "chalk";
import inquirer from "inquirer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { command } from "../common/command";
import { Feedback, spin } from "../common/feedback";
import { createCopier } from "../common/file-copier";
import { run } from "../common/runner";
import { generatePluginId, isValidPluginId } from "../stream-deck";
import { setDeveloperMode } from "./dev";
import { link } from "./link";

const TEMPLATE_PLUGIN_UUID = "com.elgato.template";

/**
 * Guides the user through a creation wizard, scaffolding a Stream Deck plugin.
 */
export const create = command(async (options, feedback) => {
	const destination = process.cwd();
	await validateDirIsEmpty(destination, feedback);

	showWelcome(feedback);
	const pluginInfo = await promptForPluginInfo();

	feedback.log();
	if (!(await isPluginInfoCorrect())) {
		return feedback.info("Aborted").exit();
	}

	feedback.log();
	feedback.log(`Creating ${chalk.blue(pluginInfo.name)}...`);

	// Enable developer mode, and generate the plugin from the template.
	await spin("Enabling developer mode", () => setDeveloperMode({ quiet: true }));
	await spin("Generating plugin", () => renderTemplate(destination, pluginInfo));

	// Install npm dependencies and build the plugin.
	await spin("Installing dependencies", () => run("npm", ["i"], { cwd: destination }));
	await spin("Building plugin", () => run("npm", ["run", "build"], { cwd: destination }));

	// Link the plugin to Stream Deck.
	await spin("Finalizing setup", () =>
		link({
			path: path.join(destination, `${pluginInfo.uuid}.sdPlugin`),
			quiet: true
		})
	);

	feedback.log().log(chalk.green("Successfully created plugin!"));
	await tryOpenVSCode(destination);
});

/**
 * Shows the welcome message.
 * @param feedback Feedback where the welcome message will be shown.
 */
function showWelcome(feedback: Feedback): void {
	feedback
		.log(" ___ _                        ___         _   ")
		.log("/ __| |_ _ _ ___ __ _ _ __   |   \\ ___ __| |__")
		.log("\\__ \\  _| '_/ -_) _` | '  \\  | |) / -_) _| / /")
		.log("|___/\\__|_| \\___\\__,_|_|_|_| |___/\\___\\__|_\\_\\")
		.log()
		.log(`Welcome to the ${chalk.green("Stream Deck Plugin")} creation wizard.`)
		.log()
		.log("This utility will walk you through creating a local development environment for a plugin.")
		.log(`For more information on building plugins see ${chalk.blue("https://docs.elgato.com")}.`)
		.log()
		.log(chalk.grey("Press ^C at any time to quit."))
		.log();
}

/**
 * Prompts the user for the plugin information.
 * @returns User input that provides required information to build a plugin.
 */
async function promptForPluginInfo(): Promise<PluginInfo> {
	return await inquirer.prompt<PluginInfo>([
		{
			name: "author",
			message: "Author:",
			validate: required("Please enter the author."),
			type: "input"
		},
		{
			name: "name",
			message: "Plugin Name:",
			validate: required("Please enter the name of the plugin."),
			type: "input"
		},
		{
			name: "uuid",
			message: "Plugin UUID:",
			default: ({ author, name }: PluginInfo): string | undefined => generatePluginId(author, name),
			validate: (uuid: string): boolean | string =>
				isValidPluginId(uuid) ? true : "UUID can only contain lowercase alphanumeric characters (a-z, 0-9), hyphens (-), underscores (_), or periods (.).",
			type: "input"
		},
		{
			name: "description",
			message: "Description:",
			type: "input"
		}
	]);
}

/**
 * Prompts the user to confirm they're happy with the input information.
 * @returns `true` when the user is happy with the information; otherwise `false`.
 */
async function isPluginInfoCorrect(): Promise<boolean> {
	return (
		await inquirer.prompt({
			name: "confirm",
			message: "Create Stream Deck plugin from information above?",
			default: true,
			type: "confirm"
		})
	).confirm;
}

/**
 * Validates the specified `path` directory is empty; when it is not, the user is prompted to confirm the process, as it may result in data loss.
 * @param path Path to validate.
 * @param feedback Feedback handler.
 */
async function validateDirIsEmpty(path: string, feedback: Feedback): Promise<void> {
	if (fs.readdirSync(path).length != 0) {
		console.log(chalk.yellow("Warning - Directory is not empty."));
		console.log("This creation tool will write files to the current directory.");
		console.log();

		const overwrite = await inquirer.prompt({
			name: "confirm",
			message: `Continuing may result in ${chalk.yellow("data loss")}, are you sure you want to continue?`,
			default: false,
			type: "confirm"
		});

		if (!overwrite.confirm) {
			feedback.info("Aborted").exit();
		}
	}
}

/**
 * Renders the template, copying the output to the destination directory.
 * @param destination Destination where the plugin was created.
 * @param pluginInfo Information about the plugin.
 */
function renderTemplate(destination: string, pluginInfo: PluginInfo): void {
	const template = createCopier({
		dest: destination,
		source: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../template"),
		data: {
			...pluginInfo,
			streamDeckPackage: process.env.STREAMDECK_PACKAGE || "^0.1.0-beta.0"
		}
	});

	template.copy(".vscode");
	template.copy(`${TEMPLATE_PLUGIN_UUID}.sdPlugin/imgs`, `${pluginInfo.uuid}.sdPlugin/imgs`);
	template.copy(`${TEMPLATE_PLUGIN_UUID}.sdPlugin/manifest.json.ejs`, `${pluginInfo.uuid}.sdPlugin/manifest.json`);
	template.copy("src");
	template.copy(".gitignore");
	template.copy("package.json.ejs");
	template.copy("rollup.config.mjs");
	template.copy("tsconfig.json.ejs");
}

/**
 * Determines if the user has VS Code installed, and if so, prompts them to open the plugin.
 * @param destination Destination where the plugin was created.
 */
async function tryOpenVSCode(destination: string): Promise<void> {
	const paths = process.env.PATH?.split(":") ?? [];
	if (!paths.some((p) => p.includes("Microsoft VS Code"))) {
		return;
	}

	console.log();
	const vsCode = await inquirer.prompt({
		name: "confirm",
		message: "Would you like to open the plugin in VS Code?",
		default: true,
		type: "confirm"
	});

	if (vsCode.confirm) {
		run("code", ["./", "--goto", "src/plugin.ts"], { cwd: destination });
	}
}

/**
 * Gets a function that accepts a single value; when that value is null, empty, or whitespace, the {@link error} is returned.
 * @param error Error message to display when a value was not specified.
 * @returns Function that can be used to validate an question's answer.
 */
function required(error: string) {
	return (value: unknown): boolean | string => {
		if (value && value?.toString().replaceAll(" ", "") != "") {
			return true;
		}

		return error;
	};
}

/**
 * Provides information about the plugin.
 */
type PluginInfo = {
	/**
	 * Author of the plugin; this can be a user, or an organization.
	 */
	author: string;

	/**
	 * General description of what the plugin does.
	 */
	description: string;

	/**
	 * Name of the plugin; this is displayed to user's in the Marketplace, and is used to easily identify the plugin.
	 */
	name: string;

	/**
	 * Plugin's unique identifier.
	 */
	uuid: string;
};
