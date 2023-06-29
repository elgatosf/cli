import i18n from "./i18n/index.js";
import { exit } from "./utils.js";

/**
 * Provides a command that is executable by a user.
 */
export abstract class Command<T> {
	/**
	 * Name of the command; this will be exposed via the CLI to enable users to run the command.
	 */
	public abstract command: string;

	/**
	 * Default options supplied to the {@link Command.run} function.
	 */
	protected abstract defaultOptions: T;

	/**
	 * Runs the command with the {@link options} and {@link Command.defaultOptions} combined.
	 * @param options Options used to determine how the command should be executed.
	 * @returns Promise fulfilled when the command finishes.
	 */
	public async run(options: Partial<T> = this.defaultOptions): Promise<void> {
		try {
			return await this.invoke({
				...this.defaultOptions,
				...options
			});
		} catch (err) {
			exit(i18n.commandError(this.command), err);
		}
	}

	/**
	 * Executes the command with the specified {@link options}.
	 * @param options Options used to determine how the command should be executed.
	 */
	protected abstract invoke(options: T): Promise<void> | void;
}
