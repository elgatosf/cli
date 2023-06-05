import { program } from "commander";

import link from "./commands/link.js";

program
	.command("link")
	.description("Creates a symlink between the Elgato Stream Deck plugins folder, and the development environment.")
	.action(() => link());

program.parse();
