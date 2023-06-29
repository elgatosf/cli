import { program } from "commander";

import create from "./commands/create.js";
import dev from "./commands/dev.js";
import link from "./commands/link.js";
import i18n from "./i18n/index.js";

program
	.command("create")
	.description("Wizard that guides you through setting up a Stream Deck plugin.")
	.action(() => create());

program
	.command(dev.command)
	.description(i18n.commands.dev.description)
	.action(() => dev.execute());

program
	.command("link")
	.description("Creates a symlink between the Elgato Stream Deck plugins folder, and the development environment.")
	.action(() => link());

program.parse();
