/* eslint-disable jsdoc/check-param-names */
import _ from "lodash";

import { createQuietStdOut, createStdOut, StdOut } from "./stdout";

// eslint-disable-next-line jsdoc/require-param
/**
 * Wraps a command delegate; when invoked all options are provided, and the output and logger are constructed based on {@link GlobalOptions.quiet} global option.
 * @param fn The command function to execute.
 * @param defaultOptions Fallback options supplied to the command when optional-options are not specified by the caller.
 * @returns The command.
 */
export function command<T = void>(
	fn: (options: Options<T>, output: StdOut) => Promise<void> | void,
	...[defaultOptions]: OptionalWhenEmpty<PickOptional<T>, never, Required<PickOptional<T>>>
): (...[options]: OptionalWhenEmpty<PickRequired<T>, GlobalOptions & T>) => void {
	return async (...[options]: OptionalWhenEmpty<PickRequired<T>, GlobalOptions & T>) => {
		const opts = _.merge({ quiet: false }, defaultOptions as Required<PickOptional<T>>, options as GlobalOptions & PickRequired<T>);
		const output = opts.quiet ? createQuietStdOut() : createStdOut();

		try {
			await fn(opts, output);
			if (output.isSpinning) {
				output.success();
			}
		} catch (err) {
			if (output.isSpinning) {
				output.error();
			}

			throw err;
		}
	};
}

/**
 * Global options that apply to all commands.
 */
type GlobalOptions = {
	/**
	 * When `true`, only errors and warnings will be output. When successful, the command will be quiet.
	 */
	quiet?: boolean;
};

/**
 * Determines whether {@template T} contains any properties, when it does not, {@template TOptional} is returned as an optional; otherwise {@template TRequired} is returned.
 */
type OptionalWhenEmpty<T, TOptional = T, TRequired = TOptional> = T extends Record<string, never> ? [TOptional?] : [TRequired];

/**
 * Defines the complete set of (merged) options sent to a command.
 */
type Options<T> = GlobalOptions & PickRequired<T> & Required<PickOptional<T>>;

/**
 * Picks all optional properties from the specified type.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
type PickOptional<T> = Pick<T, { [K in keyof T]-?: {} extends Pick<T, K> ? K : never }[keyof T]>;

/**
 * Picks all required properties from the specified type.
 */
type PickRequired<T> = Pick<T, { [K in keyof T]-?: object extends Pick<T, K> ? never : K }[keyof T]>;
