import chalk from "chalk";
import inquirer from "inquirer";
import { exec, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Manifest } from "../manifest.js";
import { generateUUID } from "../plugin-info.js";
import * as questions from "../questions.js";

/**
 * Launches the Stream Deck Plugin creation wizard, and guides users through creating a local development environment for creating plugins based on the template.
 */
export default async function create() {
	await validateDirIsEmpty(process.cwd());

	showWelcome();
	const answers = await inquirer.prompt<ManifestAnswers>([
		{
			name: "Author",
			message: "Author:",
			type: "input"
		},
		{
			name: "Name",
			message: "Plugin Name:",
			type: "input"
		},
		questions.uuid(({ Author, Name }: ManifestAnswers) => generateUUID(Author, Name)),
		{
			name: "Description",
			message: "Description:",
			type: "input"
		},
		{
			name: "platforms",
			message: "Supported OS:",
			type: "list",
			choices: [
				{
					value: "both",
					name: "Both"
				},
				{
					value: "mac",
					name: "macOS Only"
				},
				{
					value: "windows",
					name: "Windows Only"
				}
			]
		}
	]);

	await writePlugin(
		{
			...answers,
			OS: await getPlatforms(answers.platforms)
		},
		process.cwd()
	);
}

/**
 * Shows the welcome message.
 */
function showWelcome() {
	console.log(" ___ _                        ___         _   ");
	console.log("/ __| |_ _ _ ___ __ _ _ __   |   \\ ___ __| |__");
	console.log("\\__ \\  _| '_/ -_) _` | '  \\  | |) / -_) _| / /");
	console.log("|___/\\__|_| \\___\\__,_|_|_|_| |___/\\___\\__|_\\_\\");

	console.log();
	console.log(`Welcome to the ${chalk.green("Stream Deck Plugin")} creation wizard.`);
	console.log();
	console.log("This utility will walk you through creating a local development environment for a plugin.");
	console.log(`For more information on building plugins see ${chalk.blue("https://docs.elgato.com")}.`);
	console.log();
	console.log(chalk.grey("Press ^C at any time to quit."));
	console.log();
}

/**
 * Prompts the user for the minimum versions required, of their chosen platforms, that are needed for their plugin to run.
 * @param platforms Platforms that the plugin will support.
 * @returns Collection of operating systems, and their minimum required versions.
 */
async function getPlatforms(platforms: ManifestAnswers["platforms"]): Promise<Manifest["OS"]> {
	const answers: Manifest["OS"] = [];

	if (platforms === "both" || platforms === "mac") {
		answers.push({
			MinimumVersion: await getPlatformMinimumVersion("macOS", 10.15),
			Platform: "mac"
		});
	}

	if (platforms === "both" || platforms === "windows") {
		answers.push({
			MinimumVersion: await getPlatformMinimumVersion("Windows", 10),
			Platform: "mac"
		});
	}

	return answers;

	/**
	 * Prompts the user to specify a version for the platform specified by the `label`.
	 * @param label Label identifying the platform, e.g. "macOS" or "Windows"
	 * @param defaultValue Default platform minimum version.
	 * @returns Minimum version required, of the platform, to run the plugin being created.
	 */
	async function getPlatformMinimumVersion(label: string, defaultValue: number): Promise<number> {
		const answer = await inquirer.prompt({
			name: "version",
			message: `${label} Minimum Version:`,
			default: defaultValue,
			type: "number"
		});

		return answer.version;
	}
}

/**
 * Validates the specified `path` directory is empty; when it is not, the user is prompted to confirm the process, as it may result in data loss.
 * @param path Path to validate.
 */
async function validateDirIsEmpty(path: string) {
	if (fs.readdirSync(path).length != 0) {
		console.log(chalk.yellow("Warning - Directory is not empty."));
		console.log("This creation tool will write files to the current directory.");

		const overwrite = await inquirer.prompt({
			name: "confirm",
			message: `Continuing may result in ${chalk.yellow("data loss")}, are you sure you want to continue?`,
			default: false,
			type: "confirm"
		});

		if (!overwrite.confirm) {
			console.log("Canceled.");
			process.exit(0);
		}
	}
}

/**
 * Creates a plugin from the template, transforming the manifest with the provided `answers` from the user. After the plugin is created the environment is setup, e.g. `npm i`,
 * `npm run build`, and then the user is prompted to open their plugin in VS Code (if installed).
 * @param answers Answers provided by the user as part of the creation utility.
 * @param dest Destination path where the plugin will be created.
 */
async function writePlugin(answers: Partial<Manifest>, dest: string) {
	console.log();
	console.log(`Creating ${chalk.blue(answers.Name)}...`);

	// Copy the template; path is determined relative to this command file.
	const commandPath = path.dirname(fileURLToPath(import.meta.url));
	fs.cpSync(path.resolve(commandPath, "../../template"), dest, {
		filter: (src: string) => src.indexOf("node_modules") < 0,
		recursive: true
	});

	// Update the manifest.
	const manifest = new Manifest(path.join(process.cwd(), "plugin/manifest.json"));
	manifest.Author = answers.Author;
	manifest.Description = answers.Description;
	manifest.Name = answers.Name;
	manifest.UUID = answers.UUID;
	manifest.writeFile();

	// Run setup.
	const options = { cwd: path.resolve(dest) };
	execSync("npm i", options);
	execSync(`npm link "@elgato/streamdeck"`, options); // TODO: Remove this once we publish the library.
	execSync("npm run build", options);

	console.log(chalk.green("Successfully created plugin!"));
	await tryOpenVSCode(dest);
}

/**
 * Determines if the user has VS Code installed, and if so, prompts them to open the plugin.
 * @param dest Destination path where the plugin was created.
 */
async function tryOpenVSCode(dest: string) {
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
		exec("code ./ --goto src/Plugin.ts", { cwd: path.resolve(dest) });
	}
}

/**
 * Answers
 */
type ManifestAnswers = Pick<Manifest, "Author" | "Description" | "Name" | "UUID"> & {
	/**
	 * Platforms the plugin will support.
	 */
	platforms: "both" | "mac" | "windows";
};
