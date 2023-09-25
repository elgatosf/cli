import chalk from "chalk";
import { existsSync, rmSync } from "fs";
import _ from "lodash";

import { command } from "../common/command";
import { getFilePath, getLocalConfig, updateConfig } from "../config";

/**
 * Lists the configuration.
 */
export const list = command((options, feedback) => {
	const format = (value: unknown): string => {
		switch (typeof value) {
			case "boolean":
				return chalk.blue(value);
			case "bigint":
			case "number":
				return chalk.yellow(value);
			case "string":
				return chalk.green(value);
			default:
				return chalk.gray(value);
		}
	};

	const log = (value: unknown, key = "", indent = -2): void => {
		if (value instanceof Object) {
			if (key !== "") {
				feedback.log(`${" ".repeat(indent)}${key}:`);
			}

			Object.entries(value).forEach(([key, value]) => log(value, key, indent + 2));
		} else {
			feedback.log(`${" ".repeat(indent)}${key}: ${format(value)}`);
		}
	};

	const config = getLocalConfig();
	if (config === undefined) {
		feedback.info("No local configuration found.");
	} else {
		log(config);
	}
});

/**
 * Resets the local configuration.
 */
export const reset = command((options, feedback) => {
	const filePath = getFilePath();
	if (existsSync(filePath)) {
		rmSync(filePath);
	}

	feedback.success("Configuration cleared");
});

/**
 * Sets the configuration for the collection of entries.
 */
export const set = command<SetOptions>((options, feedback) => {
	let changed = false;
	updateConfig((config, defaultConfig) => {
		[options.entry].concat(options.entries).forEach((entry) => {
			const [path, value] = entry.split("=");

			// Only update values that aren't objects.
			if (typeof _.get(defaultConfig, path) !== "object") {
				_.set(config, path, value);
				changed = true;
			} else {
				feedback.warn(`Ignoring invalid key ${chalk.yellow(path)}`);
			}
		});

		return config;
	});

	if (changed) {
		feedback.success("Updated configuration");
	}
});

/**
 * Un-sets the configuration entries for the specified keys, resetting to their default values.
 */
export const unset = command<UnsetOptions>((options, feedback) => {
	let changed = false;
	updateConfig((config, defaultConfig) => {
		new Set<string>(options.keys.concat([options.key])).forEach((path) => {
			if (_.has(defaultConfig, path)) {
				_.unset(config, path);
				changed = true;
			} else {
				feedback.warn(`Ignoring invalid key ${chalk.yellow(path)}`);
			}
		});
	});

	if (changed) {
		feedback.success("Updated configuration");
	}
});

/**
 * Options available to {@link unset}.
 */
type UnsetOptions = {
	/**
	 * Key that identifies the configuration entry.
	 */
	key: string;

	/**
	 * Keys that identify a collection of configuration entries.
	 */
	keys: string[];
};

/**
 * Options available to {@link set}.
 */
type SetOptions = {
	/**
	 * Configuration entry denoted as a key-value-pair separated by an equals sign.
	 */
	entry: string;

	/**
	 * Collection of configuration entries denoted as a key-value-pair separated by an equals sign.
	 */
	entries: string[];
};
