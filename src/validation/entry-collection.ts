import chalk from "chalk";
import { OrderedArray } from "../common/ordered-array";
import { StdOut } from "../common/stdout";
import type { ValidationEntry } from "./entry";

/**
 * Collection of {@link ValidationEntry}.
 */
export class ValidationEntryCollection {
	/**
	 * Entries within this collection.
	 */
	private entries = new OrderedArray<ValidationEntry>(
		(x) => x.level,
		(x) => x.details?.location?.line ?? Infinity,
		(x) => x.details?.location?.column ?? Infinity,
		(x) => x.message,
	);

	/**
	 * Tracks the padding required for the location of a validation entry, i.e. the text before the entry level.
	 */
	private padding = 0;

	/**
	 * Initializes a new instance of the {@link ValidationEntryCollection} class.
	 * @param path Path that groups the entries together.
	 */
	constructor(public readonly path: string) {}

	/**
	 * Adds the specified {@link entry} to the collection.
	 * @param entry Entry to add.
	 */
	public add(entry: ValidationEntry): void {
		this.padding = Math.max(this.padding, entry.location.length);
		this.entries.push(entry);
	}

	/**
	 * Writes the entry collection to the {@link output}.
	 * @param output Output to write to.
	 */
	public writeTo(output: StdOut): void {
		if (this.entries.length === 0) {
			return;
		}

		output.log(chalk.underline(this.path));
		if (chalk.level > 0) {
			output.log(chalk.hidden(this.path));
		} else {
			output.log();
		}

		this.entries.forEach((entry) => output.log(entry.toString(this.padding)));
		output.log();
	}
}
