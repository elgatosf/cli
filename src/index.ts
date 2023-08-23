import { program } from "commander";

import { creationWizard } from "./commands/create.js";
import { enableDeveloperMode } from "./commands/dev.js";
import { linkToPlugin } from "./commands/link.js";
import { configureEnv } from "./env.js";
import i18n from "./i18n/index.js";

configureEnv();

program
	.command("create")
	.description("Wizard that guides you through setting up a Stream Deck plugin.")
	.action(() => creationWizard());

program
	.command("dev")
	.description(i18n.dev.description)
	.action(() => enableDeveloperMode());

program
	.command("link")
	.description(i18n.link.description)
	.action(() => linkToPlugin());

program.parse();
