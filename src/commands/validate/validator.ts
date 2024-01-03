import { ValidationEntry, ValidationLevel, type ValidationEntryDetails } from "./entry";
import { ValidationResult } from "./result";
import { type ValidationRule } from "./rule";

/**
 * Validates the specified {@link context} against the {@link rules}.
 * @param path Root path of the item being validated.
 * @param context Additional context provided to each validation rule.
 * @param rules Rules used to validate the context.
 * @returns Validation result.
 */
export function validate<T>(path: string, context: T, rules: ValidationRule<T>[]): ValidationResult {
	const result = new ValidationResult();
	const validationContext = new ValidationContext(path, result);

	for (const rule of rules) {
		rule.call(validationContext, context);
		if (validationContext.isCancellationRequested) {
			break;
		}
	}

	return result;
}

/**
 * Validation context, providing information about the current item being validated, and methods for recording validation entries.
 */
export class ValidationContext {
	/**
	 * Private backing field for {@link ValidationContext.isCancellationRequested}.
	 */
	private _isCancellationRequested = false;

	/**
	 * Initializes a new instance of the {@link ValidationContext} class.
	 * @param path Path to the item being validated.
	 * @param result Validation results.
	 */
	constructor(
		public readonly path: string,
		private readonly result: ValidationResult
	) {}

	/**
	 * Determines whether cancellation was requested; this is set to `true` when {@link ValidationContext.addCritical} is called.
	 * @returns `true` when a critical error was encountered; otherwise `false`.
	 */
	public get isCancellationRequested(): boolean {
		return this._isCancellationRequested;
	}

	/**
	 * Adds a critical validation error; validation will be cancelled.
	 * @param path File or directory path the entry is associated with.
	 * @param message Validation message.
	 * @param details Optional details.
	 * @returns This instance for chaining.
	 */
	public addCritical(path: string, message: string, details?: ValidationEntryDetails): this {
		this._isCancellationRequested = true;
		return this.addError(path, message, details);
	}

	/**
	 * Adds a validation error.
	 * @param path File or directory path the entry is associated with.
	 * @param message Validation message.
	 * @param details Optional details.
	 * @returns This instance for chaining.
	 */
	public addError(path: string, message: string, details?: ValidationEntryDetails): this {
		this.result.add(path, new ValidationEntry(ValidationLevel.error, message, details));
		return this;
	}

	/**
	 * Adds a validation warning.
	 * @param path File or directory path the entry is associated with.
	 * @param message Validation message.
	 * @param details Optional details.
	 * @returns This instance for chaining.
	 */
	public addWarning(path: string, message: string, details?: ValidationEntryDetails): this {
		this.result.add(path, new ValidationEntry(ValidationLevel.warning, message, details));
		return this;
	}
}
