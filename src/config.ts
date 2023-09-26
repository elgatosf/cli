import Ajv, { JTDSchemaType } from "ajv/dist/jtd";
import chalk from "chalk";
import _ from "lodash";
import logSymbols from "log-symbols";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, join } from "node:path";

import { DeepPartial } from "./utils";

let __config: Config | undefined = undefined;

const DEFAULT_CONFIG: Config = Object.freeze({
	create: {
		mode: "npm",
		streamDeck: "0.1.0-beta.1"
	},
	dev: {
		streamDeck: undefined
	}
});

/**
 * Gets the configuration.
 * @returns The configuration.
 */
export function getConfig(): Config {
	return __config || (__config = _.merge({}, DEFAULT_CONFIG, getLocalConfig() || {}));
}

/**
 * Gets the local configuration.
 * @returns The local configuration; otherwise undefined.
 */
export function getLocalConfig(): Config | undefined {
	// Check if a config file exists.
	const filePath = getFilePath();
	if (!existsSync(filePath)) {
		return undefined;
	}

	try {
		// Read the local configuration file.
		const contents = readFileSync(filePath, { encoding: "utf-8" });
		const localConfig = contents === "" ? {} : JSON.parse(contents);

		validate(localConfig);
		return localConfig as Config;
	} catch (err) {
		if (err instanceof Error) {
			exitWithError(err.message);
		} else {
			exitWithError("Failed to read local configuration file");
		}
	}
}

/**
 * Updates the configuration.
 * @param updater Function responsible for updating the configuration.
 */
export function updateConfig(updater: (config: object, defaultConfig: Config) => void): void {
	// Read the local configuration.
	const filePath = getFilePath();
	const localConfig = getLocalConfig() || {};

	// Invoke the updater.
	updater(localConfig, DEFAULT_CONFIG);
	validate(localConfig);

	// Write the local configuration.
	if (!existsSync(dirname(filePath))) {
		mkdirSync(dirname(filePath), { recursive: true });
	}

	writeFileSync(filePath, JSON.stringify(localConfig), { encoding: "utf-8" });

	// Update the in-memory configuration.
	if (__config === undefined) {
		__config = _.merge({}, DEFAULT_CONFIG, localConfig || {});
	} else {
		_.merge(__config, DEFAULT_CONFIG, localConfig);
	}
}

/**
 * Gets the path to the local configuration file.
 * @returns Configuration file path.
 */
export function getFilePath(): string {
	if (platform() === "win32") {
		const appData = process.env.APPDATA ?? join(homedir(), "AppData/Roaming");
		return join(appData, "Elgato/MakerCLI/config.json");
	} else {
		return join(homedir(), ".config/com.elgato/maker-cli/config.json");
	}
}

/**
 * Exits the current process due to an invalid set of configuration.
 * @param message Error message.
 * @param errors Supporting error details that highlight the specified of the error that occurred.
 */
function exitWithError(message: string, errors?: string[]): never {
	console.log(`${logSymbols.error} ${message}`);

	if (errors) {
		console.log();
		errors.forEach((err) => console.log(chalk.yellow(err)));
	}

	console.log();
	console.log(`Run ${chalk.blue("streamdeck config clear")} to reset configuration, or repair the configuration file manually.`);
	console.log(`${getFilePath()}.`);

	process.exit(1);
}

/**
 * Validates a configuration object to ensure it fulfils the {@link Config} type.
 */
const validateSchema = new Ajv({ allErrors: true }).compile({
	optionalProperties: {
		create: {
			optionalProperties: {
				mode: {
					enum: ["dev", "npm"]
				},
				streamDeck: {
					type: "string"
				}
			}
		},
		dev: {
			optionalProperties: {
				streamDeck: {
					type: "string"
				}
			}
		}
	}
} satisfies JTDSchemaType<DeepPartial<Config>>);

/**
 * Validates the specified {@link config}.
 * @param config Configuration to validate.
 */
function validate(config: unknown): never | void {
	if (validateSchema(config)) {
		return;
	}

	exitWithError(
		"Invalid configuration",
		validateSchema.errors?.map(({ instancePath, message, params: { allowedValues } }) => {
			const detail = allowedValues ? `: ${allowedValues.join(", ")}` : "";
			return `[${instancePath.replaceAll("/", ".").substring(1)}] ${message}${detail}`;
		})
	);
}

/**
 * Stream Deck CLI configuration.
 */
export type Config = {
	/**
	 * Persistent configuration relating to the `create` command.
	 */
	create: {
		/**
		 * Preferred dependency method; when `dev`, {@link Config.dev} dependencies are used.
		 */
		mode: "dev" | "npm";

		/**
		 * NPM version of `@elgato/streamdeck` to use when creating a plugin.
		 */
		streamDeck: string;
	};

	/**
	 * Defines the preferred dependencies to use when developing / debugging.
	 */
	dev: {
		/**
		 * Path to the local version of the `@elgato/streamdeck` dependency to be used when developing.
		 */
		streamDeck?: string;
	};
};
