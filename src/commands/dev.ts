import chalk from "chalk";
import childProcess from "node:child_process";
import os from "node:os";
import { Registry } from "rage-edit";

import { Command } from "../command.js";
import i18n from "../i18n/index.js";
import { exit } from "../utils.js";

/**
 * Option available to this command.
 */
type Options = {
	/**
	 * Determines whether a successful output should be written to the console.
	 */
	quiet: boolean;
};

/**
 * Enables Stream Deck developer mode allowing the Maker to build, execute, and debug plugin.
 */
class DeveloperModeCommand extends Command<Options> {
	/** @inheritdoc */
	public command = "dev";

	/** @inheritdoc */
	protected defaultOptions = {
		quiet: false
	};

	/**
	 * Name of the flag that enables Stream Deck development.
	 */
	private static FLAG_NAME = "developer_mode";

	/** @inheritdoc */
	protected async invoke(options: Options) {
		try {
			const platform = os.platform();

			if (platform === "darwin") {
				this.enableMacOS();
			} else if (platform === "win32") {
				await this.enableWindows();
			} else {
				throw new Error(i18n.commands.dev.unsupportedOS);
			}

			if (!options.quiet) {
				console.log(chalk.green(i18n.commands.dev.success));
			}
		} catch (err) {
			exit(i18n.commands.dev.failed, err);
		}
	}

	/**
	 * Enables developer mode for macOS operating systems.
	 */
	private enableMacOS() {
		const { status } = childProcess.spawnSync("defaults", ["write", "com.elgato.StreamDeck", DeveloperModeCommand.FLAG_NAME, "-bool", "YES"]);
		if (status !== 0) {
			throw new Error(i18n.commands.dev.macOSErrorCode(status));
		}
	}

	/**
	 * Enables developer mode for Windows operating systems.
	 * @returns Promise fulfilled when developer mode has been enabled.
	 */
	private async enableWindows(): Promise<void> {
		return Registry.set("HKEY_CURRENT_USER\\Software\\Elgato Systems GmbH\\StreamDeck", DeveloperModeCommand.FLAG_NAME, 1);
	}
}

export default new DeveloperModeCommand();
