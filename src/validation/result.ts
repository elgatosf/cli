import { StdOut } from "../common/stdout";
import { ValidationLevel, type ValidationEntry } from "./entry";
import { ValidationEntryCollection } from "./entry-collection";

/**
 * Validation result containing a collection of {@link ValidationEntryCollection} grouped by the directory or file path they're associated with.
 */
export class ValidationResult extends Array<ValidationEntryCollection> implements ReadonlyArray<ValidationEntryCollection> {
	/**
	 * Private backing field for {@link Result.errorCount}.
	 */
	private errorCount = 0;

	/**
	 * Private backing field for {@link Result.warningCount}.
	 */
	private warningCount = 0;

	/**
	 * Determines whether the validation result is considered successful.
	 * @returns `true` when validation passed; otherwise `false`.
	 */
	public get success(): boolean {
		return this.errorCount === 0;
	}

	/**
	 * Adds a new validation entry to the result.
	 * @param path Directory or file path the entry is associated with.
	 * @param entry Validation entry.
	 */
	public add(path: string, entry: ValidationEntry): void {
		if (entry.level === ValidationLevel.error) {
			this.errorCount++;
		} else {
			this.warningCount++;
		}

		let collection = this.find((c) => c.path === path);
		if (collection === undefined) {
			collection = new ValidationEntryCollection(path);
			this.push(collection);
		}

		collection.add(entry);
	}

	/**
	 * Writes the results to the specified {@link output}.
	 * @param output Output to write to.
	 */
	public writeTo(output: StdOut): void {
		// Write each entry.
		if (this.length > 0) {
			output.log();
			this.forEach((collection) => collection.writeTo(output));
		}

		// Validation was successful.
		if (this.errorCount === 0 && this.warningCount === 0) {
			output.success("Validation successful");
			return;
		}

		// Only errors.
		if (this.warningCount === 0) {
			output.error(`Failed with ${pluralize("error", this.errorCount)}`);
			return;
		}

		// Only warnings.
		if (this.errorCount === 0) {
			output.warn(pluralize("warning", this.warningCount));
			return;
		}

		// Both errors and warnings.
		output.error(`${pluralize("problem", this.errorCount + this.warningCount)} (${pluralize("error", this.errorCount)}, ${pluralize("warning", this.warningCount)})`);

		/**
		 * Pluralizes the {@link noun} based on the {@link count}.
		 * @param noun Noun to pluralize if required.
		 * @param count Count.
		 * @returns Pluralized or singular representation of the {@link noun}
		 */
		function pluralize(noun: string, count: number): string {
			return `${count} ${count === 1 ? noun : `${noun}s`}`;
		}
	}
}
