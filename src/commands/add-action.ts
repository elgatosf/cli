import { Manifest } from "@elgato/schemas/streamdeck/plugins";
import chalk from "chalk";
import inquirer from "inquirer";
import fs from "node:fs";
import { join } from "node:path";

import { command } from "../common/command";
import { createCopier } from "../common/file-copier";
import { StdOut } from "../common/stdout";
import { readJsonFile } from "../system/fs";
import { relative } from "../system/path";

/**
 * Options for the add-action command.
 */
export type AddActionOptions = {
	/**
	 * Name of the action.
	 */
	name?: string;

	/**
	 * Action identifier (will be appended to plugin UUID).
	 */
	actionId?: string;

	/**
	 * Description of the action.
	 */
	description?: string;

	/**
	 * Whether to create a property inspector UI.
	 */
	ui?: boolean;

	/**
	 * Skip confirmation prompt.
	 */
	yes?: boolean;
};

/**
 * Adds a new action to an existing Stream Deck plugin.
 */
export const addAction = command<AddActionOptions>(
	async (options, stdout) => {
		// Validate we're in a plugin directory
		const pluginPath = await validatePluginDirectory(stdout);
		if (!pluginPath) {
			return stdout.error("Not in a valid Stream Deck plugin directory").exit(1);
		}

		// Read the existing manifest
		const manifestPath = join(pluginPath.sdPluginPath, "manifest.json");
		const manifest = await readJsonFile<Manifest>(manifestPath);

		// Get plugin UUID from manifest
		const pluginUuid = manifest.UUID;
		if (!pluginUuid) {
			return stdout.error("Invalid manifest: missing UUID").exit(1);
		}

		// Get action information (either from options or prompts)
		const actionInfo = await getActionInfo(options, pluginUuid, manifest.Actions || [], stdout);

		// Confirm action creation (unless --yes flag is used)
		if (!options.yes && !(await confirmActionCreation(actionInfo, stdout))) {
			return stdout.info("Aborted").exit();
		}

		stdout.log();
		stdout.log(`Creating ${chalk.blue(actionInfo.name)} action...`);

		// Create action files
		await stdout.spin("Creating action class", () => createActionClass(pluginPath, actionInfo));
		await stdout.spin("Creating UI file", () => createUIFile(pluginPath, actionInfo));
		await stdout.spin("Creating action images", () => createActionImages(pluginPath, actionInfo));
		await stdout.spin("Updating manifest", () => updateManifest(manifestPath, actionInfo));
		await stdout.spin("Updating plugin registration", () => updatePluginRegistration(pluginPath, actionInfo));

		stdout.log().log(chalk.green("Successfully created action!"));
	},
	{
		name: undefined as any,
		actionId: undefined as any,
		description: undefined as any,
	} as Required<Pick<AddActionOptions, "name" | "actionId" | "description" | "ui" | "yes">>,
);

/**
 * Information about the action being created.
 */
interface ActionInfo {
	name: string;
	uuid: string;
	description: string;
	className: string;
	fileName: string;
	hasUI: boolean;
}

/**
 * Information about the plugin directory structure.
 */
interface PluginPaths {
	pluginPath: string;
	sdPluginPath: string;
	srcPath: string;
}

/**
 * Validates that we're in a valid Stream Deck plugin directory.
 */
async function validatePluginDirectory(stdout: StdOut): Promise<PluginPaths | null> {
	const cwd = process.cwd();

	// Look for .sdPlugin directory
	const entries = fs.readdirSync(cwd, { withFileTypes: true });
	const sdPluginDir = entries.find((entry) => entry.isDirectory() && entry.name.endsWith(".sdPlugin"));

	if (!sdPluginDir) {
		return null;
	}

	const sdPluginPath = join(cwd, sdPluginDir.name);
	const manifestPath = join(sdPluginPath, "manifest.json");
	const srcPath = join(cwd, "src");

	// Validate required files exist
	if (!fs.existsSync(manifestPath)) {
		stdout.error("manifest.json not found in .sdPlugin directory");
		return null;
	}

	if (!fs.existsSync(srcPath)) {
		stdout.error("src directory not found");
		return null;
	}

	return {
		pluginPath: cwd,
		sdPluginPath,
		srcPath,
	};
}

/**
 * Prompts the user to confirm action creation.
 */
async function confirmActionCreation(actionInfo: ActionInfo, stdout: StdOut): Promise<boolean> {
	stdout.log().log(chalk.cyan("Action Summary:"));
	stdout.log(`  Name:         ${actionInfo.name}`);
	stdout.log(`  UUID:         ${actionInfo.uuid}`);
	stdout.log(`  Description:  ${actionInfo.description}`);
	stdout.log(`  Class:        ${actionInfo.className}`);
	stdout.log(`  Has UI:       ${actionInfo.hasUI ? "Yes" : "No"}`);

	const { confirm } = await inquirer.prompt([
		{
			type: "confirm",
			name: "confirm",
			message: "Create this action?",
			default: true,
		},
	]);

	return confirm;
}

/**
 * Creates the action class file.
 */
async function createActionClass(pluginPaths: PluginPaths, actionInfo: ActionInfo): Promise<void> {
	const actionsDir = join(pluginPaths.srcPath, "actions");
	if (!fs.existsSync(actionsDir)) {
		fs.mkdirSync(actionsDir, { recursive: true });
	}

	const actionFilePath = join(actionsDir, `${actionInfo.fileName}.ts`);

	const template = createCopier({
		source: relative("../template/src/actions"),
		dest: actionsDir,
		data: {
			uuid: actionInfo.uuid,
			className: actionInfo.className,
			name: actionInfo.name,
			description: actionInfo.description,
		},
	});

	// Copy and render the action template
	await template.copy("generic-action.ts.ejs", `${actionInfo.fileName}.ts`);
}

/**
 * Creates the UI file for the action.
 */
async function createUIFile(pluginPaths: PluginPaths, actionInfo: ActionInfo): Promise<void> {
	if (!actionInfo.hasUI) return;

	const uiDir = join(pluginPaths.sdPluginPath, "ui");
	if (!fs.existsSync(uiDir)) {
		fs.mkdirSync(uiDir, { recursive: true });
	}

	const uiFilePath = join(uiDir, `${actionInfo.fileName}.html`);

	const template = createCopier({
		source: relative("../template/com.elgato.template.sdPlugin/ui"),
		dest: uiDir,
		data: {
			name: actionInfo.name,
			fileName: actionInfo.fileName,
		},
	});

	// Copy and render the UI template
	await template.copy("generic-action.html.ejs", `${actionInfo.fileName}.html`);
}

/**
 * Creates action image placeholders.
 */
async function createActionImages(pluginPaths: PluginPaths, actionInfo: ActionInfo): Promise<void> {
	const imagesDir = join(pluginPaths.sdPluginPath, "imgs", "actions", actionInfo.fileName);
	if (!fs.existsSync(imagesDir)) {
		fs.mkdirSync(imagesDir, { recursive: true });
	}

	const template = createCopier({
		source: relative("../template/com.elgato.template.sdPlugin/imgs/actions/counter"),
		dest: imagesDir,
		data: {},
	});

	// Copy placeholder images
	await template.copy("icon.png");
	await template.copy("icon@2x.png");
	await template.copy("key.png");
	await template.copy("key@2x.png");
}

/**
 * Updates the manifest with the new action.
 */
async function updateManifest(manifestPath: string, actionInfo: ActionInfo): Promise<void> {
	const manifest = await readJsonFile<Manifest>(manifestPath);

	const newAction = {
		Name: actionInfo.name,
		UUID: actionInfo.uuid,
		Icon: `imgs/actions/${actionInfo.fileName}/icon`,
		Tooltip: actionInfo.description,
		Controllers: ["Keypad"],
		States: [
			{
				Image: `imgs/actions/${actionInfo.fileName}/key`,
			},
		],
	} as any;

	if (actionInfo.hasUI) {
		newAction.PropertyInspectorPath = `ui/${actionInfo.fileName}.html`;
	}

	manifest.Actions = manifest.Actions || [];
	manifest.Actions.push(newAction);

	fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, "\t"));
}

/**
 * Updates the plugin registration to include the new action.
 */
async function updatePluginRegistration(pluginPaths: PluginPaths, actionInfo: ActionInfo): Promise<void> {
	const pluginFilePath = join(pluginPaths.srcPath, "plugin.ts");

	if (!fs.existsSync(pluginFilePath)) {
		return; // Skip if plugin.ts doesn't exist
	}

	let content = fs.readFileSync(pluginFilePath, "utf-8");

	// Add import
	const importStatement = `import { ${actionInfo.className} } from "./actions/${actionInfo.fileName}";`;
	const importRegex = /import.*from.*["']@elgato\/streamdeck["'];/;
	const match = content.match(importRegex);

	if (match) {
		content = content.replace(match[0], `${match[0]}\n\n${importStatement}`);
	} else {
		// Fallback: add import at the top
		content = `${importStatement}\n${content}`;
	}

	// Add registration
	const registrationStatement = `streamDeck.actions.registerAction(new ${actionInfo.className}());`;
	const connectRegex = /streamDeck\.connect\(\);/;
	const connectMatch = content.match(connectRegex);

	if (connectMatch) {
		content = content.replace(
			connectMatch[0],
			`// Register the ${actionInfo.name.toLowerCase()} action.\n${registrationStatement}\n\n${connectMatch[0]}`,
		);
	} else {
		// Fallback: add at the end
		content = `${content}\n\n// Register the ${actionInfo.name.toLowerCase()} action.\n${registrationStatement}`;
	}

	fs.writeFileSync(pluginFilePath, content);
}

/**
 * Converts a string to PascalCase.
 */
function toPascalCase(str: string): string {
	return str
		.split(/[-_\s]+/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join("");
}

/**
 * Converts a string to kebab-case.
 */
function toKebabCase(str: string): string {
	return str
		.replace(/([a-z])([A-Z])/g, "$1-$2")
		.replace(/[\s_]+/g, "-")
		.toLowerCase();
}

/**
 * Gets action information from options or prompts.
 */
async function getActionInfo(
	options: AddActionOptions,
	pluginUuid: string,
	existingActions: any[],
	stdout: StdOut,
): Promise<ActionInfo> {
	const existingUuids = existingActions.map((action) => action.UUID);

	// Check if boolean options were explicitly provided via CLI
	// We need to check the original process.argv to see if flags were actually used
	const argv = process.argv.join(" ");
	const uiExplicitlySet = argv.includes("--ui") || argv.includes("--no-ui");
	const yesExplicitlySet = argv.includes("--yes") || argv.includes("--no-yes");

	// If all required options are provided, use them
	if (options.name && options.actionId) {
		// Validate the provided actionId
		if (!/^[a-z0-9-]+$/.test(options.actionId)) {
			return stdout.error("Action identifier must contain only lowercase letters, numbers, and hyphens").exit(1);
		}

		const fullUuid = `${pluginUuid}.${options.actionId}`;
		if (existingUuids.indexOf(fullUuid) !== -1) {
			return stdout.error("An action with this identifier already exists").exit(1);
		}

		const className = toPascalCase(options.actionId);
		const fileName = toKebabCase(options.actionId);

		return {
			name: options.name,
			uuid: fullUuid,
			description: options.description || `${options.name} action`,
			className,
			fileName,
			hasUI: uiExplicitlySet ? options.ui! : true, // Default to true if not explicitly set
		};
	}

	// Otherwise, prompt for missing information
	const prompts: any[] = [];

	if (!options.name) {
		prompts.push({
			type: "input",
			name: "name",
			message: "Action name:",
			validate: (input: string) => {
				if (!input.trim()) return "Action name is required";
				return true;
			},
		});
	}

	if (!options.actionId) {
		prompts.push({
			type: "input",
			name: "actionId",
			message: "Action identifier (will be appended to plugin UUID):",
			validate: (input: string) => {
				if (!input.trim()) return "Action identifier is required";
				if (!/^[a-z0-9-]+$/.test(input))
					return "Action identifier must contain only lowercase letters, numbers, and hyphens";
				const fullUuid = `${pluginUuid}.${input}`;
				if (existingUuids.indexOf(fullUuid) !== -1) return "An action with this identifier already exists";
				return true;
			},
		});
	}

	if (!options.description) {
		prompts.push({
			type: "input",
			name: "description",
			message: "Action description:",
			default: (answers: any) => `${options.name || answers.name} action`,
		});
	}

	// Only prompt for UI if not explicitly set via CLI
	if (!uiExplicitlySet) {
		prompts.push({
			type: "confirm",
			name: "hasUI",
			message: "Create property inspector UI?",
			default: true,
		});
	}

	// Handle case where no prompts are needed
	let answers: any = {};
	if (prompts.length > 0) {
		answers = await inquirer.prompt(prompts);
	}

	const name = options.name || answers.name;
	const actionId = options.actionId || answers.actionId;
	const description = options.description || answers.description;
	const hasUI = uiExplicitlySet ? options.ui! : answers.hasUI !== undefined ? answers.hasUI : true;

	const className = toPascalCase(actionId);
	const fileName = toKebabCase(actionId);

	return {
		name,
		uuid: `${pluginUuid}.${actionId}`,
		description,
		className,
		fileName,
		hasUI,
	};
}
