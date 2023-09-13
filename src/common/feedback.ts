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
	private text = "";

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

		// Retain context on destructuring.
		this.error = this.error.bind(this);
		this.info = this.info.bind(this);
		this.spin = this.spin.bind(this);
		this.success = this.success.bind(this);
		this.warn = this.warn.bind(this);
	}

	/**
	 * Gets a value that determines whether the feedback is actively spinning ({@link Feedback.spin}).
	 * @returns `true` when the feedback is spinning; otherwise `false`.
	 */
	public get isSpinning(): boolean {
		return this.timerId !== undefined;
	}

	/**
	 * Display the {@link text} as an error message, and stops any current interactive feedback (spinners).
	 * @param text Optional text to display.
	 */
	public error(text: string = this.text): void {
		this.stop({ symbol: logSymbols.error, text });
	}

	/**
	 * Display the {@link text} as an informational message, and stops any current interactive feedback (spinners).
	 * @param text Optional text to display.
	 */
	public info(text: string = this.text): void {
		this.stop({ symbol: logSymbols.info, text });
	}

	/**
	 * Displays an interactive spinner and the {@link text}.
	 * @param text Text to show next to the spinner.
	 */
	public spin(text: string): void {
		if (this.timerId) {
			// Set the text being shown next to the spinner.
			this.text = text;
		} else {
			// Setup symbol interval.
			this.text = text;
			this.timerId = setInterval(() => {
				process.stdout.clearLine(1); // Prevent flickering
				process.stdout.cursorTo(0);
				process.stdout.write(`${this.indent}${Feedback.SYMBOLS[++this.index % Feedback.SYMBOLS.length]} ${this.text}`);
			}, 150);
		}
	}

	/**
	 * Display the {@link text} as a success message, and stops any current interactive feedback (spinners).
	 * @param text Optional text to display.
	 */
	public success(text: string = this.text): void {
		this.stop({ symbol: logSymbols.success, text });
	}

	/**
	 * Display the {@link text} as a warning message, and stops any current interactive feedback (spinners).
	 * @param text Optional text to display.
	 */
	public warn(text: string = this.text): void {
		this.stop({ symbol: logSymbols.warning, text });
	}

	/**
	 * Stops the spinner, and displays the feedback message.
	 * @param message Message to display.
	 */
	private stop(message: Message): void {
		if (this.timerId) {
			clearInterval(this.timerId);
			this.timerId = undefined;

			process.stdout.cursorTo(0);
			process.stdout.clearLine(1);
			process.stdout.write(`${this.indent}${message.symbol} ${message.text}\n`);
		} else {
			console.log(`${this.indent}${message.symbol} ${message.text}`);
		}
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

		this.info = QuietFeedback.noop;
		this.spin = QuietFeedback.noop;
		this.success = QuietFeedback.noop;
	}

	/**
	 * Represents a no-operation function that can overwrite an existing function so that it does nothing.
	 */
	private static noop(): void {
		// Do nothing, aka a no-operation [noop] function.
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
