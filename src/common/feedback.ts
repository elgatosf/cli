import chalk from "chalk";
import logSymbols from "log-symbols";

/**
 * Display a spinner whilst the {@link task} is running, or until a status signal is sent to the {@link Feedback}.
 * @param text Text to render next to the spinner.
 * @param task Task that the spinner represents.
 * @param options Options that define how the spinner feedback should be rendered.
 */
export async function spin(text: string, task: (feedback: Feedback) => Promise<number | void> | void, options?: FeedbackOptions): Promise<void> {
	const feedback = new Feedback(options);

	try {
		feedback.spin(text);
		await task(feedback);

		if (feedback.isSpinning) {
			feedback.success();
		}
	} catch (err) {
		if (feedback.isSpinning) {
			feedback.error();
		}

		throw err;
	}
}

/**
 * Defines the options associated with a {@link Feedback}, indicating how it should be rendered.
 */
export type FeedbackOptions = {
	/**
	 * The indentation size.
	 */
	indentSize: number;
};

/**
 * Provides interactive feedback to the stdout, including a spinner and status results.
 */
export class Feedback {
	/**
	 * Indentation to be rendered prior to the symbol.
	 */
	protected readonly indent: string;

	/**
	 * Symbols that denote a spinner.
	 */
	private static readonly SYMBOLS = ["|", "/", "-", "\\"];

	/**
	 * Current symbol index.
	 */
	private index = -1;

	/**
	 * Feedback text to display next to the spinner / status.
	 */
	private message = "";

	/**
	 * Identifies the timer responsible for displaying the spinning symbol.
	 */
	private timerId?: NodeJS.Timer;

	/**
	 * Initializes a new instances of the {@link Feedback} class.
	 * @param options Options that define how the feedback should be rendered.
	 */
	constructor(options?: FeedbackOptions) {
		this.indent = " ".repeat((options || { indentSize: 0 }).indentSize);
	}

	/**
	 * Gets a value that determines whether the feedback is actively spinning ({@link Feedback.spin}).
	 * @returns `true` when the feedback is spinning; otherwise `false`.
	 */
	public get isSpinning(): boolean {
		return this.timerId !== undefined;
	}

	/**
	 * Display the {@link message} as an error message, and stops any current interactive feedback (spinners).
	 * @param message Optional text to display.
	 * @returns An error reporter capable of outputting more detailed information.
	 */
	public error = (message: string = this.message): ErrorReporter => {
		this.stop({ symbol: logSymbols.error, text: message });
		return new ErrorReporter();
	};

	/**
	 * Exits the process.
	 * @param code Optional exit code.
	 */
	public exit(code?: number): never {
		process.exit(code);
	}

	/**
	 * Display the {@link message} as an informational message, and stops any current interactive feedback (spinners).
	 * @param message Optional text to display.
	 * @returns This instance for chaining.
	 */
	public info = (message: string = this.message): this => {
		return this.stop({ symbol: logSymbols.info, text: message });
	};

	/**
	 * Logs the specified {@link message} to the console.
	 * @param message Message to write.
	 * @returns This instance for chaining.
	 */
	public log = (message?: string): this => {
		if (this.isSpinning) {
			process.stdout.cursorTo(0);
			process.stdout.clearLine(1);
		}

		if (message === undefined) {
			console.log();
		} else {
			console.log(message);
		}

		return this;
	};

	/**
	 * Displays an interactive spinner and the {@link message}.
	 * @param message Text to show next to the spinner.
	 */
	public spin = (message: string): void => {
		this.message = message;
		if (!this.timerId) {
			this.timerId = setInterval(() => {
				process.stdout.clearLine(1); // Prevent flickering
				process.stdout.cursorTo(0);
				process.stdout.write(`${this.indent}${Feedback.SYMBOLS[++this.index % Feedback.SYMBOLS.length]} ${this.message}`);
			}, 150);
		}
	};

	/**
	 * Display the {@link message} as a success message, and stops any current interactive feedback (spinners).
	 * @param message Optional text to display.
	 */
	public success = (message: string = this.message): void => {
		this.stop({ symbol: logSymbols.success, text: message });
	};

	/**
	 * Display the {@link message} as a warning message, and stops any current interactive feedback (spinners).
	 * @param message Optional text to display.
	 * @returns This instance for chaining.
	 */
	public warn = (message: string = this.message): this => {
		return this.stop({ symbol: logSymbols.warning, text: message });
	};

	/**
	 * Stops the spinner, and displays the feedback message.
	 * @param message Message to display.
	 * @returns This instance for chaining.
	 */
	private stop(message: Message): this {
		if (this.timerId) {
			clearInterval(this.timerId);
			this.timerId = undefined;

			process.stdout.cursorTo(0);
			process.stdout.clearLine(1);
			process.stdout.write(`${this.indent}${message.symbol} ${message.text}\n`);
		} else {
			console.log(`${this.indent}${message.symbol} ${message.text}`);
		}

		return this;
	}
}

/**
 * Provides a quiet implementation of {@link Feedback} whereby only {@link Feedback.error} and {@link Feedback.warn} are displayed.
 */
export class QuietFeedback extends Feedback {
	/**
	 * Initializes a new instances of the {@link QuietFeedback} class.
	 * @param options Options that define how the feedback should be rendered.
	 */
	constructor(options?: FeedbackOptions) {
		super(options);

		const noop = (): void => {
			/* do nothing */
		};

		this.info = (): this => this;
		this.log = (): this => this;
		this.spin = noop;
		this.success = noop;
	}
}

/**
 * Provides logging and exiting facilities as part of reporting an error.
 */
class ErrorReporter {
	/**
	 * Determines whether a message has been logged; the first log is yellow.
	 */
	private hasMessageBeenLogged = false;

	/**
	 * Exits the process.
	 * @param code Optional exit code.
	 */
	public exit(code?: number): never {
		process.exit(code);
	}

	/**
	 * Logs a message to the console; if this is the first message as part of the reporter, the message will be highlighted in yellow.
	 * @param message Message to log.
	 * @returns This instance for chaining.
	 */
	public log(message: string): this {
		console.log();

		if (this.hasMessageBeenLogged) {
			console.log(message);
		} else {
			console.log(chalk.yellow(message));
		}

		this.hasMessageBeenLogged = true;
		return this;
	}
}

/**
 * Provides information for a message to display as part of the spinner.
 */
type Message = {
	/**
	 * Symbol that denotes the current status / result of the spinner.
	 */
	symbol: string;

	/**
	 * Text shown next to the symbol.
	 */
	text: string;
};
