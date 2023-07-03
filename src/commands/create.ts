import chalk from "chalk";
import inquirer from "inquirer";
import child_process, { ExecOptions } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import Manifest, { generateUUID } from "../manifest.js";
import * as questions from "../questions.js";
import { rewriteFile, stdoutSpinner } from "../utils.js";
import dev from "./dev.js";
import link from "./link.js";

const exec = promisify(child_process.exec);
const TEMPLATE_PLUGIN_UUID = "com.elgato.template";

/**
 * Launches the Stream Deck Plugin creation wizard, and guides users through creating a local development environment for creating plugins based on the template.
 */
export default async function create() {
	await validateDirIsEmpty(process.cwd());

	showWelcome();
	const answers = await inquirer.prompt<Omit<ManifestAnswers, "OS">>([
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
		questions.uuid(({ Author, Name }: Omit<ManifestAnswers, "OS">) => generateUUID(Author, Name)),
		{
			name: "Description",
			message: "Description:",
			type: "input"
		}
	]);

	console.log();
	const correctInfo = await inquirer.prompt({
		name: "confirm",
		message: "Create Stream Deck plugin from information above?",
		default: true,
		type: "confirm"
	});

	if (correctInfo.confirm) {
		await writePlugin(answers, process.cwd());
	} else {
		console.log("Canceled.");
		process.exit(0);
	}
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
async function writePlugin(answers: ManifestAnswers, dest: string) {
	console.log();
	console.log(`Creating ${chalk.blue(answers.Name)}...`);

	await stdoutSpinner("Enabling developer mode", () => dev.run({ quiet: true }));

	// Copy the template and re-configure the files.
	await stdoutSpinner("Generating plugin", () => copyFiles(answers, dest));
	await stdoutSpinner("Updating configuration", async () => localizeForUuid(answers, dest));

	const options: ExecOptions = {
		cwd: dest,
		windowsHide: true
	};

	// Install npm dependencies; temporarily link to the local streamdeck package.
	await stdoutSpinner("Installing dependencies", async () => {
		await exec("npm i", options);
		await exec(`npm link "@elgato/streamdeck"`, options); // TODO: Remove this once we publish the library.
	});

	// Build the plugin locally.
	await stdoutSpinner("Building plugin", () => exec("npm run build", options));
	await stdoutSpinner("Finalizing setup", () =>
		link({
			path: path.join(dest, `${answers.uuid}.sdPlugin`),
			quiet: true
		})
	);

	console.log();
	console.log(chalk.green("Successfully created plugin!"));

	await tryOpenVSCode(dest);
}

/**
 * Copies the template files to the destination.
 * @param answers Answers provided by the user as part of the creation utility.
 * @param dest Destination path where the plugin will be created.
 */
async function copyFiles(answers: ManifestAnswers, dest: string) {
	const commandPath = path.dirname(fileURLToPath(import.meta.url));
	const templatePath = path.resolve(commandPath, "../../template");

	// Top-level.
	copyDir(".vscode");
	copyDir("src");
	copyFile(".gitignore");
	copyFile("package.json");
	copyFile("package-lock.json");
	copyFile("tsconfig.json");

	// sdPlugin Folder.
	copyDir(`${TEMPLATE_PLUGIN_UUID}.sdPlugin`, `${answers.uuid}.sdPlugin`);

	/**
	 * Copies the specified {@link relativeSource} from the template to the destination.
	 * @param relativeSource Source file, relative to the root of the template.
	 */
	function copyFile(relativeSource: string) {
		fs.cpSync(path.join(templatePath, relativeSource), path.join(dest, relativeSource));
	}

	/**
	 * Copies the specified {@link relativeSource} recursively from the template to the destination.
	 * @param relativeSource Source directory, relative to the root of the template.
	 * @param relativeDest Optional destination directory, relative to the root of the plugin.
	 */
	function copyDir(relativeSource: string, relativeDest = relativeSource) {
		fs.cpSync(path.join(templatePath, relativeSource), path.join(dest, relativeDest), {
			recursive: true
		});
	}
}

/**
 * Configures the local files so that they're applicable to the plugin UUID.
 * @param answers Answers provided by the user as part of the creation utility.
 * @param dest Destination path where the plugin will be created.
 */
async function localizeForUuid(answers: ManifestAnswers, dest: string) {
	const actionUUID = `${answers.uuid}.increment`;
	const manifest = new Manifest(path.join(dest, `${answers.uuid}.sdPlugin/manifest.json`));

	manifest.Author = answers.Author;
	manifest.Category = answers.Name;
	manifest.Description = answers.Description;
	manifest.Name = answers.Name;
	manifest.UUID = answers.uuid;
	if (manifest.Actions) {
		manifest.Actions[0].UUID = actionUUID;
	}

	manifest.writeFile();

	rewriteFile(path.join(dest, "src/plugin.ts"), (contents) => contents.replace(`${TEMPLATE_PLUGIN_UUID}.increment`, actionUUID));
	rewriteFile(path.join(dest, "tsconfig.json"), (contents) => {
		const tsconfig = JSON.parse(contents);
		tsconfig.compilerOptions.outDir = `${answers.uuid}.sdPlugin/bin`;
		return JSON.stringify(tsconfig, undefined, "\t");
	});
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
		exec("code ./ --goto src/Plugin.ts", { cwd: dest });
	}
}

/**
 * Answers provided by the user as part of the creation utility.
 */
type ManifestAnswers = Pick<Manifest, "Author" | "Description" | "Name" | "OS"> & {
	/**
	 * Platforms the plugin will support.
	 */
	platforms: "both" | "mac" | "windows";

	/**
	 * Unique identifier that represents the plugin.
	 */
	uuid: string;
};
