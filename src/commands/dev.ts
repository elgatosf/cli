import chalk from "chalk";
import childProcess from "node:child_process";
import os from "node:os";
import { Registry } from "rage-edit";

import i18n from "../i18n/index.js";
import { exit } from "../utils.js";

/**
 * Options available to {@link enableDeveloperMode}.
 */
export type Options = {
	/**
	 * Determines whether a successful output should be written to the console.
	 */
	quiet: boolean;
};

const defaultOptions = {
	quiet: false
};

/**
 * Enables Stream Deck developer mode allowing the Maker to build, execute, and debug plugin.
 * @param options Options that define the execution of the command.
 */
export async function enableDeveloperMode(options: Partial<Options> = defaultOptions) {
	options = {
		...defaultOptions,
		...options
	};

	try {
		const platform = os.platform();

		if (platform === "darwin") {
			enableMacOS();
		} else if (platform === "win32") {
			await enableWindows();
		} else {
			throw new Error(i18n.dev.unsupportedOS);
		}

		if (!options.quiet) {
			console.log(chalk.green(i18n.dev.success));
		}
	} catch (err) {
		exit(i18n.dev.failed, err);
	}
	// do something
}

/**
 * Name of the flag that enables Stream Deck development.
 */
const FLAG_NAME = "developer_mode";

/**
 * Enables developer mode for macOS operating systems.
 */
function enableMacOS() {
	const { status } = childProcess.spawnSync("defaults", ["write", "com.elgato.StreamDeck", FLAG_NAME, "-bool", "YES"]);
	if (status !== 0) {
		throw new Error(i18n.dev.macOSErrorCode(status));
	}
}

/**
 * Enables developer mode for Windows operating systems.
 * @returns Promise fulfilled when developer mode has been enabled.
 */
async function enableWindows(): Promise<void> {
	return Registry.set("HKEY_CURRENT_USER\\Software\\Elgato Systems GmbH\\StreamDeck", FLAG_NAME, 1);
}
