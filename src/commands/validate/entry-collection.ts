import chalk from "chalk";
import { StdOut } from "../../common/stdout";
import { compare } from "../../common/utils";
import type { ValidationEntry } from "./entry";

/**
 * Collection of {@link ValidationEntry}.
 */
export class ValidationEntryCollection {
	/**
	 * Entries within this collection.
	 */
	private entries: ValidationEntry[] = [];

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

		output.log(`${chalk.underline(this.path)}`);
		let positionPad = this.entries[0].position.length;

		this.entries
			.sort((a, b) => {
				positionPad = Math.max(positionPad, a.position.length, b.position.length);
				return compare(a.level, b.level) || compare(a.details?.position?.line, b.details?.position?.line) || compare(a.details?.position?.column, b.details?.position?.column);
			})
			.forEach((entry) => output.log(entry.toString(positionPad)));

		output.log();
	}
}
