import inquirer from "inquirer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { spin } from "../common/feedback";
import { createCopier } from "../common/file-copier";
import { run } from "../common/runner";
import i18n from "../i18n/index";
import Manifest, { generateUUID } from "../manifest";
import * as questions from "../questions";
import { validateRequired } from "../questions";
import { exit } from "../utils";
import { setDeveloperMode } from "./dev";
import { link } from "./link";

const TEMPLATE_PLUGIN_UUID = "com.elgato.template";

/**
 * Options available to {@link creationWizard}.
 */
type Options = {
	[K in keyof Pick<Manifest, "Author" | "Description" | "Name" | "UUID"> as Lowercase<K>]-?: Manifest[K];
} & {
	/**
	 * Destination where the plugin is being created.
	 */
	destination: string;
};

/**
 * Launches the Stream Deck Plugin creation wizard, and guides users through creating a local development environment for creating plugins based on the template.
 */
export async function creationWizard(): Promise<void> {
	await validateDirIsEmpty(process.cwd());

	showWelcome();
	const options = await inquirer.prompt<Options>([
		{
			name: "author",
			message: i18n.create.questions.author,
			type: "input",
			validate: validateRequired(i18n.create.questions.authorRequired)
		},
		{
			name: "name",
			message: i18n.create.questions.name,
			type: "input",
			validate: validateRequired(i18n.create.questions.nameRequired)
		},
		questions.uuid(({ author, name }: Options) => generateUUID(author, name)),
		{
			name: "description",
			message: i18n.create.questions.description,
			type: "input"
		}
	]);

	console.log();
	const info = await inquirer.prompt({
		name: "isCorrect",
		message: i18n.create.questions.confirmInfo,
		default: true,
		type: "confirm"
	});

	if (info.isCorrect) {
		options.destination = process.cwd();
		await writePlugin(options);
	} else {
		exit(i18n.create.aborted);
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
	console.log(i18n.create.welcome.title);
	console.log();
	console.log(i18n.create.welcome.text);
	console.log(i18n.create.welcome.moreInfo);
	console.log();
	console.log(i18n.create.welcome.howToQuit);
	console.log();
}

/**
 * Validates the specified `path` directory is empty; when it is not, the user is prompted to confirm the process, as it may result in data loss.
 * @param path Path to validate.
 */
async function validateDirIsEmpty(path: string): Promise<void> {
	if (fs.readdirSync(path).length != 0) {
		console.log(i18n.create.dirNotEmptyWarning.title);
		console.log(i18n.create.dirNotEmptyWarning.text);
		console.log();

		const overwrite = await inquirer.prompt({
			name: "confirm",
			message: i18n.create.dirNotEmptyWarning.confirm,
			default: false,
			type: "confirm"
		});

		if (!overwrite.confirm) {
			exit(i18n.create.aborted);
		}
	}
}

/**
 * Creates a plugin from the template, transforming the manifest with the provided {@link options} from the user. After the plugin is created the environment is setup, e.g. `npm i`,
 * `npm run build`, and then the user is prompted to open their plugin in VS Code (if installed).
 * @param options Options provided by the user as part of the creation utility.
 */
async function writePlugin(options: Options): Promise<void> {
	console.log();
	console.log(i18n.create.steps.intro(options.name));

	// Enable developer mode, and generate the template.
	await spin(i18n.create.steps.developerMode, () => setDeveloperMode({ quiet: true }));
	await spin(i18n.create.steps.copyFiles, () => renderTemplate(options));

	// Install npm dependencies; temporarily link to the local streamdeck package.
	await spin(i18n.create.steps.dependencies, () => run("npm", ["i"], { cwd: options.destination }));

	// Build the plugin locally.
	await spin(i18n.create.steps.building, () => run("npm", ["run", "build"], { cwd: options.destination }));
	await spin(i18n.create.steps.finalizing, () =>
		link({
			path: path.join(options.destination, `${options.uuid}.sdPlugin`),
			quiet: true
		})
	);

	console.log();
	console.log(i18n.create.steps.success);

	await tryOpenVSCode(options);
}

/**
 * Renders the template, copying the output to the destination directory.
 * @param options Options used to render the template.
 */
function renderTemplate(options: Options): void {
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
async function tryOpenVSCode(options: Options): Promise<void> {
	const paths = process.env.PATH?.split(":") ?? [];
	if (!paths.some((p) => p.includes("Microsoft VS Code"))) {
		return;
	}

	console.log();
	const vsCode = await inquirer.prompt({
		name: "confirm",
		message: i18n.create.openWithVSCode,
		default: true,
		type: "confirm"
	});

	if (vsCode.confirm) {
		run("code", ["./", "--goto", "src/plugin.ts"], { cwd: options.destination });
	}
}
