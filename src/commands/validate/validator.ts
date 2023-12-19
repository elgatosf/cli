/**
 * Executes a collection on validators on a specific path, collecting the results.
 */
export abstract class Validator<TContext> implements ValidationContext {
	/**
	 * Validation rules to execute when validating the {@link Validator.path}.
	 */
	protected readonly rules: ValidationRule<TContext>[] = [];

	/**
	 * The validation entries as a result of executing the validators, indexed by the directory or file path.
	 */
	private readonly result = new ValidationResult();

	/**
	 * Initializes a new instance of the {@link Validator} class.
	 * @param path Path to validate.
	 */
	constructor(public readonly path: string) {}

	/**
	 * @inheritdoc
	 */
	public addError(path: string, message: string, fix?: string): this {
		this.push(path, { fix, message, severity: "error" });
		this.result.errorCount++;
		return this;
	}

	/**
	 * @inheritdoc
	 */
	public addWarning(path: string, message: string, fix?: string): this {
		this.push(path, { fix, message, severity: "warning" });
		this.result.warningCount++;
		return this;
	}

	/**
	 * Validates the root path, and returns the result of the validation.
	 * @returns The validation result.
	 */
	public validate(): ValidationResult {
		const ctx = this.getContext();
		for (const rule of this.rules) {
			if ((rule.call(ctx) || 0) > 0) {
				break;
			}
		}

		return this.result;
	}

	/**
	 * Gets the context of the validation runner to be provided to each validator.
	 * @returns The context.
	 */
	protected abstract getContext(): TContext;

	/**
	 * Pushes the {@link entry} onto the validation stack associated with the {@link path}.
	 * @param path Parent path.
	 * @param entry Validation entry.
	 */
	private push(path: string, entry: ValidationEntry): void {
		const entries = this.result.get(path) || [];
		entries.push(entry);

		this.result.set(path, entries);
	}
}

/**
 * Validation rule.
 * @param fn Delegate function responsible for validation; when a number greater than zero is returned, the validation terminates.
 * @returns The rule.
 */
export function rule<TContext>(fn: (this: TContext) => number | void): (this: TContext) => number | void {
	return fn;
}

/**
 * Validation rule that will be executed as part of a validator.
 */
export type ValidationRule<TContext> = (this: TContext) => number | void;

/**
 * Validation context that enables validators to execute and report their result.
 */
export interface ValidationContext {
	/**
	 * Path to validate.
	 */
	readonly path: string;

	/**
	 * Adds a validation error.
	 * @param path File or directory path the entry is associated with.
	 * @param message Validation message.
	 * @param fix Optional text indicating how to fix the issue.
	 * @returns This instance for chaining.
	 */
	addError(path: string, message: string, fix?: string): this;

	/**
	 * Adds a validation warning.
	 * @param path File or directory path the entry is associated with.
	 * @param message Validation message.
	 * @param fix Optional text indicating how to fix the issue.
	 * @returns This instance for chaining.
	 */
	addWarning(path: string, message: string, fix?: string): this;
}

/**
 * Validation result.
 */
export class ValidationResult extends Map<string, ValidationEntry[]> {
	/**
	 * Number of errors.
	 */
	public errorCount = 0;

	/**
	 * Number of warnings.
	 */
	public warningCount = 0;
}

/**
 * Validation entry.
 */
export type ValidationEntry = {
	/**
	 * Optional supporting text to rectify the validation entry, i.e. how to fix the problem.
	 */
	fix?: string;

	/**
	 * Message associated with the validation entry.
	 */
	message: string;

	/**
	 * Severity of the validation entry; this will determine the output code of the validation.
	 */
	severity: "error" | "warning";
};
