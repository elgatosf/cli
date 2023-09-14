import chalk from "chalk";
import inquirer from "inquirer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { spin } from "../common/feedback";
import { createCopier } from "../common/file-copier";
import { run } from "../common/runner";
import { generatePluginId, isValidPluginId } from "../stream-deck";
import { exit } from "../utils";
import { setDeveloperMode } from "./dev";
import { link } from "./link";

const TEMPLATE_PLUGIN_UUID = "com.elgato.template";

/**
 * Launches the Stream Deck Plugin creation wizard, and guides users through creating a local development environment for creating plugins based on the template.
 */
export async function creationWizard(): Promise<void> {
	await validateDirIsEmpty(process.cwd());

	showWelcome();
	const options = await inquirer.prompt<CreateOptions>([
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
			default: ({ author, name }: CreateOptions) => generatePluginId(author, name),
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

	console.log();
	const info = await inquirer.prompt({
		name: "isCorrect",
		message: "Create Stream Deck plugin from information above?",
		default: true,
		type: "confirm"
	});

	if (info.isCorrect) {
		options.destination = process.cwd();
		await writePlugin(options);
	} else {
		exit("Aborted");
	}
}

/**
 * Shows the welcome message.
 */
function showWelcome(): void {
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
 * Validates the specified `path` directory is empty; when it is not, the user is prompted to confirm the process, as it may result in data loss.
 * @param path Path to validate.
 */
async function validateDirIsEmpty(path: string): Promise<void> {
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
			exit("Aborted");
		}
	}
}

/**
 * Creates a plugin from the template, transforming the manifest with the provided {@link options} from the user. After the plugin is created the environment is setup, e.g. `npm i`,
 * `npm run build`, and then the user is prompted to open their plugin in VS Code (if installed).
 * @param options Options provided by the user as part of the creation utility.
 */
async function writePlugin(options: CreateOptions): Promise<void> {
	console.log();
	console.log(`Creating ${chalk.blue(options.name)}...`);

	// Enable developer mode, and generate the template.
	await spin("Enabling developer mode", () => setDeveloperMode({ quiet: true }));
	await spin("Generating plugin", () => renderTemplate(options));

	// Install npm dependencies; temporarily link to the local streamdeck package.
	await spin("Installing dependencies", () => run("npm", ["i"], { cwd: options.destination }));

	// Build the plugin locally.
	await spin("Building plugin", () => run("npm", ["run", "build"], { cwd: options.destination }));
	await spin("Finalizing setup", () =>
		link({
			path: path.join(options.destination, `${options.uuid}.sdPlugin`),
			quiet: true
		})
	);

	console.log();
	console.log(chalk.green("Successfully created plugin!"));

	await tryOpenVSCode(options);
}

/**
 * Renders the template, copying the output to the destination directory.
 * @param options Options used to render the template.
 */
function renderTemplate(options: CreateOptions): void {
	const template = createCopier({
		dest: options.destination,
		source: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../template"),
		data: {
			...options,
			streamDeckPackage: process.env.STREAMDECK_PACKAGE || "^0.1.0-beta.0"
		}
	});

	template.copy(".vscode");
	template.copy(`${TEMPLATE_PLUGIN_UUID}.sdPlugin/imgs`, `${options.uuid}.sdPlugin/imgs`);
	template.copy(`${TEMPLATE_PLUGIN_UUID}.sdPlugin/manifest.json.ejs`, `${options.uuid}.sdPlugin/manifest.json`);
	template.copy("src");
	template.copy(".gitignore");
	template.copy("package.json.ejs");
	template.copy("rollup.config.mjs");
	template.copy("tsconfig.json.ejs");
}

/**
 * Determines if the user has VS Code installed, and if so, prompts them to open the plugin.
 * @param options Options provided by the user as part of the creation utility.
 */
async function tryOpenVSCode(options: CreateOptions): Promise<void> {
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
		run("code", ["./", "--goto", "src/plugin.ts"], { cwd: options.destination });
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
 * Options available to {@link creationWizard}.
 */
type CreateOptions = {
	/**
	 * Author of the plugin; this can be a user, or an organization.
	 */
	author: string;

	/**
	 * General description of what the plugin does.
	 */
	description: string;

	/**
	 * Destination where the plugin is being created.
	 */
	destination: string;

	/**
	 * Name of the plugin; this is displayed to user's in the Marketplace, and is used to easily identify the plugin.
	 */
	name: string;

	/**
	 * Plugin's unique identifier.
	 */
	uuid: string;
};
