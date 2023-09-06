import { program } from "commander";

import { creationWizard } from "./commands/create.js";
import { enableDeveloperMode } from "./commands/dev.js";
import { linkToPlugin } from "./commands/link.js";
import { restart } from "./commands/restart.js";
import { stop } from "./commands/stop.js";
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

program
	.command("restart")
	.alias("start")
	.description("Starts the plugin; if the plugin is already running, it is stopped first.")
	.argument("<uuid>")
	.action((uuid) => restart(uuid));

program
	.command("stop")
	.description("Stops the plugin.")
	.argument("<uuid>")
	.action((uuid) => stop(uuid));

program.parse();
