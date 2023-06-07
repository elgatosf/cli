import { program } from "commander";

import create from "./commands/create.js";
import link from "./commands/link.js";

program
	.command("create")
	.description("Stream Deck Plugin creation wizard.")
	.action(() => create());

program
	.command("link")
	.description("Creates a symlink between the Elgato Stream Deck plugins folder, and the development environment.")
	.action(() => link());

program.parse();
