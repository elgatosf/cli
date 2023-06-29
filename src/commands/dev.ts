import chalk from "chalk";
import childProcess from "node:child_process";
import os from "node:os";
import { Registry } from "rage-edit";

import i18n from "../i18n/index.js";
import { exit } from "../utils.js";

const FLAG_NAME = "developer_mode";

/**
 * Default options.
 */
const defaultOptions = {
	/**
	 * Determines whether a successful output should be written to the console.
	 */
	quiet: false
};

export default {
	/**
	 * Command that can be used to invoke this action.
	 */
	command: "dev",

	/**
	 * Default options of the command.
	 */
	defaultOptions: defaultOptions as Readonly<typeof defaultOptions>,

	/**
	 * Enables Stream Deck developer mode allowing the Maker to build, execute, and debug plugin.
	 * @param options Options that define the execution of the command.
	 */
	execute: async function (options?: Partial<typeof defaultOptions>) {
		const settings: typeof options = {
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
				throw new Error(i18n.commands.dev.unsupportedOS);
			}

			if (!settings.quiet) {
				console.log(chalk.green(i18n.commands.dev.success));
			}
		} catch (err) {
			exit(i18n.commands.dev.failed, err);
		}
	}
};

/**
 * Enables developer mode for macOS operating systems.
 */
function enableMacOS() {
	const { status } = childProcess.spawnSync("defaults", ["write", "com.elgato.StreamDeck", FLAG_NAME, "-bool", "YES"]);
	if (status !== 0) {
		throw new Error(i18n.commands.dev.macOSErrorCode(status));
	}
}

/**
 * Enables developer mode for Windows operating systems.
 * @returns Promise fulfilled when developer mode has been enabled.
 */
async function enableWindows(): Promise<void> {
	return Registry.set("HKEY_CURRENT_USER\\Software\\Elgato Systems GmbH\\StreamDeck", FLAG_NAME, 1);
}
