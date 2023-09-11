import logSymbols from "log-symbols";

/**
 * Display a spinner whilst the {@link task} is running, or until a status signal is sent to the {@link Spinner}.
 * @param text Text to render next to the spinner.
 * @param task Task that the spinner represents.
 * @param options Options that define how the spinner should be rendered.
 */
export async function spin(text: string, task: (spinner: Spinner) => Promise<void> | void, options?: SpinnerOptions): Promise<void> {
	const spinner = new Spinner(text, options || { indentSize: 0 });

	try {
		await task(spinner);
		spinner.success();
	} catch (err) {
		spinner.error();
		throw err;
	}
}

/**
 * Defines the options associated with the spinner, indicating how it should be rendered.
 */
export type SpinnerOptions = {
	/**
	 * The indentation size.
	 */
	indentSize: number;
};

/**
 * Provides a spinner to the stdout that is displayed until a task ends, or a result is posted.
 */
class Spinner {
	/**
	 * Determines whether the spinner be spinning.
	 */
	public isSpinning = false;

	/**
	 * Symbols that denote a spinner.
	 */
	private static readonly SYMBOLS = ["|", "/", "-", "\\"];

	/**
	 * Indentation to be rendered prior to the symbol.
	 */
	private readonly indent: string;

	/**
	 * Current symbol index.
	 */
	private index = -1;

	/**
	 * Identifies the timer responsible for displaying the spinning symbol.
	 */
	private timerId?: NodeJS.Timer;

	/**
	 * Initializes a new instances of the {@link Spinner} class.
	 * @param text Text to show next to the spinner.
	 * @param options Options that determine how the spinner should be rendered.
	 */
	constructor(private readonly text: string, options: SpinnerOptions) {
		this.indent = " ".repeat(options.indentSize);

		// Retain context on destructuring.
		this.error = this.error.bind(this);
		this.info = this.info.bind(this);
		this.success = this.success.bind(this);
		this.warn = this.warn.bind(this);

		// Setup symbol interval.
		this.timerId = setInterval(() => {
			process.stdout.clearLine(1); // Prevent flickering
			process.stdout.cursorTo(0);
			process.stdout.write(`${this.indent}${Spinner.SYMBOLS[++this.index % Spinner.SYMBOLS.length]} ${this.text}`);
		}, 150);
	}

	/**
	 * Stops the spinner with an error symbol.
	 * @param text Optional text to display.
	 */
	public error = (text: string = this.text): void => {
		this.stop({ symbol: logSymbols.error, text });
	};

	/**
	 * Stops the spinner with an information symbol.
	 * @param text Optional text to display.
	 */
	public info = (text: string = this.text): void => {
		this.stop({ symbol: logSymbols.info, text });
	};

	/**
	 * Stops the spinner with a success symbol.
	 * @param text Optional text to display.
	 */
	public success = (text: string = this.text): void => {
		this.stop({ symbol: logSymbols.success, text });
	};

	/**
	 * Stops the spinner with a warning symbol.
	 * @param text Optional text to display.
	 */
	public warn = (text: string = this.text): void => {
		this.stop({ symbol: logSymbols.warning, text });
	};

	/**
	 * Stops the spinner, and displays the final message.
	 * @param message Message to display.
	 */
	private stop(message: Message): void {
		if (this.timerId) {
			clearInterval(this.timerId);
			this.timerId = undefined;

			process.stdout.cursorTo(0);
			process.stdout.clearLine(1);
			process.stdout.write(`${this.indent}${message.symbol} ${message.text}\n`);
		}
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
