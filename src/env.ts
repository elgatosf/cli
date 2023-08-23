import { config } from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Configures the local environment.
 */
export function configureEnv() {
	config({
		path: join(dirname(fileURLToPath(import.meta.url)), "../.env")
	});
}

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace NodeJS {
		interface ProcessEnv {
			/**
			 * Optional version or URL of @elgato/streamdeck to be used when generating a template.
			 */
			STREAMDECK_PACKAGE?: string | undefined;
		}
	}
}
