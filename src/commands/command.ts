import { Feedback, QuietFeedback } from "../common/feedback";

/**
 * Wraps a command delegate; when invoked all options are provided, and the feedback and logger are constructed based on {@link GlobalOptions.quiet} global option.
 * @param defaultOptions Fallback options supplied to the command when optional-options are not specified by the caller.
 * @param commandFn The command function to execute.
 * @returns Wrapped command.
 */
export function command<T>(defaultOptions: Required<T>, commandFn: CommandDelegate<T>): (options?: GlobalOptions & T) => void {
	return async (options?: T) => {
		const opts = {
			...{ quiet: false },
			...defaultOptions,
			...options
		};

		const feedback = opts.quiet ? new QuietFeedback() : new Feedback();

		try {
			await commandFn(opts, feedback);
			if (feedback.isSpinning) {
				feedback.success();
			}
		} catch (err) {
			if (feedback.isSpinning) {
				feedback.error();
			}

			throw err;
		}
	};
}

/**
 * Delegate function that is capable of executing the command.
 */
type CommandDelegate<T> = (options: Required<GlobalOptions> & Required<T>, feedback: Feedback) => Promise<void> | void;

/**
 * Global options that apply to all commands.
 */
type GlobalOptions = {
	/**
	 * When `true`, only errors and warnings will be output. When successful, the command will be quiet.
	 */
	quiet?: boolean;
};
