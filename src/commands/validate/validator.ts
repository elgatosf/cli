/**
 * Validates the specified {@link context} against the {@link rules}.
 * @param context Context to validate.
 * @param rules Rules used to validate the context.
 * @returns Validation result.
 */
export function validate<T>(context: T, rules: ValidationRule<T>[]): ValidationResult {
	let isCancellationRequested = false;
	const result = new Result();

	const validator: T & Validator = {
		addCritical: function (path: string, message: string, fix?: string): typeof validator {
			isCancellationRequested = true;
			result.add(path, { fix, message, severity: "error" });
			return validator;
		},
		addError: function (path: string, message: string, fix?: string): typeof validator {
			result.add(path, { fix, message, severity: "error" });
			return validator;
		},
		addWarning: function (path: string, message: string, fix?: string): typeof validator {
			result.add(path, { fix, message, severity: "warning" });
			return validator;
		},
		...context
	};

	for (const rule of rules) {
		rule.call(validator);
		if (isCancellationRequested) {
			break;
		}
	}

	return result;
}

/**
 * Validator capable of recording a
 */
type Validator = {
	/**
	 * Adds a critical validation error; validation will be cancelled.
	 * @param path File or directory path the entry is associated with.
	 * @param message Validation message.
	 * @param fix Optional text indicating how to fix the issue.
	 * @returns This instance for chaining.
	 */
	addCritical(path: string, message: string, fix?: string): Validator;

	/**
	 * Adds a validation error.
	 * @param path File or directory path the entry is associated with.
	 * @param message Validation message.
	 * @param fix Optional text indicating how to fix the issue.
	 * @returns This instance for chaining.
	 */
	addError(path: string, message: string, fix?: string): Validator;

	/**
	 * Adds a validation warning.
	 * @param path File or directory path the entry is associated with.
	 * @param message Validation message.
	 * @param fix Optional text indicating how to fix the issue.
	 * @returns This instance for chaining.
	 */
	addWarning(path: string, message: string, fix?: string): Validator;
};

/**
 * Wraps a validation rule.
 * @param fn Delegate function responsible for applying the validation rule.
 * @returns The validation rule.
 */
export const rule = <TContext>(fn: ValidationRule<TContext>): ValidationRule<TContext> => fn;

/**
 * Validation rule that will be executed as part of a validator.
 */
export type ValidationRule<TContext> = (this: TContext & Validator) => void;

/**
 * Collection of validation entries.
 */
export type ValidationResult = ReadonlyMap<string, ReadonlyArray<ValidationEntry>> & {
	/**
	 * Number of errors.
	 */
	readonly errorCount: number;

	/**
	 * Number of warnings.
	 */
	readonly warningCount: number;
};

/**
 * Collection of validation entries, indexed by the directory or file path associated with them.
 */
class Result extends Map<string, ValidationEntry[]> implements ValidationResult {
	/**
	 * Private backing field for {@link Result.errorCount}.
	 */
	private _errorCount = 0;

	/**
	 * Private backing field for {@link Result.warningCount}.
	 */
	private _warningCount = 0;

	/**
	 * Number of errors.
	 * @returns Error count.
	 */
	public get errorCount(): number {
		return this._errorCount;
	}

	/**
	 * Number of warnings.
	 * @returns Warning count.
	 */
	public get warningCount(): number {
		return this._warningCount;
	}

	/**
	 * Adds a new validation entry to the result.
	 * @param path Directory or file path the entry is associated with.
	 * @param entry Validation entry.
	 */
	public add(path: string, entry: ValidationEntry): void {
		if (entry.severity === "error") {
			this._errorCount++;
		} else {
			this._warningCount++;
		}

		const entries = super.get(path) || [];
		entries.push(entry);

		super.set(path, entries);
	}
}

/**
 * Validation entry.
 */
type ValidationEntry = {
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
