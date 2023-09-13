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
		const logger = new ConsoleWriter(opts.quiet);

		try {
			await commandFn(opts, feedback, logger);
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
type CommandDelegate<T> = (options: Required<GlobalOptions> & Required<T>, feedback: Feedback, logger: ConsoleWriter) => Promise<void> | void;

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
 * Provides a logger capable of writing to the console selectively based on whether a command is being executed in quiet-mode.
 */
class ConsoleWriter {
	/**
	 * Initializes a new instance of the {@link ConsoleWriter} class.
	 * @param errorOnly Determines whether only {@link ConsoleWriter.error} messages should be logged.
	 */
	constructor(private readonly errorOnly: boolean) {}

	/**
	 * Logs the errors {@link messages}.
	 * @param messages Messages to log.
	 */
	public error(...messages: string[]): void {
		this.write(...messages);
	}

	/**
	 * Logs the informational {@link messages}.
	 * @param messages Messages to log.
	 */
	public log(...messages: string[]): void {
		this.errorOnly ? this : this.write(...messages);
	}

	/**
	 * Writes the specified messages to the console.
	 * @param messages Messages to log.
	 */
	private write(...messages: string[]): void {
		for (const msg of messages) {
			console.log();
			console.log(msg);
		}

		console.log();
	}
}
