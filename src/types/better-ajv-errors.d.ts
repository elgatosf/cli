/**
 * https://github.com/atlassian/better-ajv-errors/issues/176
 */
declare module "better-ajv-errors" {
	import type { ErrorObject } from "ajv";

	export interface Position {
		/**
		 * Line number.
		 */
		line: number;

		/**
		 * Column number.
		 */
		column: number;

		/**
		 * Offset number.
		 */
		offset: number;
	}

	export interface IOutputError {
		/**
		 * Friendly error message
		 */
		error: string;

		/**
		 * End position.
		 */
		end?: Position;

		/**
		 * Start position.
		 */
		start: Position;

		/**
		 *
		 */
		suggestion?: string;
	}

	export interface IInputOptions {
		/**
		 * Use default cli output format if you want to print beautiful validation errors. Or, use js if you are planning to use this with some API.
		 */
		format?: "cli" | "js";

		/**
		 * If you have an un-indented JSON payload and you want the error output indented. This option have no effect when using the json option.
		 */
		indent?: number | null;

		/**
		 * Raw JSON used when highlighting error location
		 */
		json?: string | null;
	}

	/**
	 * Returns formatted validation error to print in console. See options.format for further details.
	 * @param schema The JSON Schema you used for validation with ajv.
	 * @param data The JSON payload you validate against using ajv.
	 * @param errors Array of ajv validation errors.
	 * @param options Options.
	 * @returns The formatted errors.
	 */
	// eslint-disable-next-line jsdoc/require-jsdoc
	export default function <S, T, Options extends IInputOptions>(schema: S, data: T, errors: Array<ErrorObject>, options?: Options): Options extends { format: "js" } ? Array<IOutputError> : string;
}
