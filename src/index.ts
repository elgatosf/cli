import { program } from "commander";

import create from "./commands/create.js";
import { enableDeveloperMode } from "./commands/dev.js";
import { linkToPlugin } from "./commands/link.js";
import i18n from "./i18n/index.js";

program
	.command("create")
	.description("Wizard that guides you through setting up a Stream Deck plugin.")
	.action(() => create());

program
	.command("dev")
	.description(i18n.commands.dev.description)
	.action(() => enableDeveloperMode());

program
	.command("link")
	.description("Creates a symlink between the Elgato Stream Deck plugins folder, and the development environment.")
	.action(() => linkToPlugin());

program.parse();
