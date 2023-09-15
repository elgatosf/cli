import { program } from "commander";

import { create, link, restart, setDeveloperMode, stop } from "./commands";
import { configureEnv } from "./env";

configureEnv();

program
	.command("create")
	.alias("c")
	.description("Wizard that guides you through setting up a Stream Deck plugin.")
	.action(() => create());

program
	.command("dev")
	.alias("d")
	.description("Enables / disables local development of Stream Deck plugins.")
	.option("-d|--disable", "Disables developer mode", false)
	.action(({ disable }) => setDeveloperMode({ disable }));

program
	.command("link")
	.alias("l")
	.description("Creates a symbolic-link to the current working directory, installing it to the Stream Deck as a plugin.")
	.action(() => link());

program
	.command("restart")
	.alias("r")
	.description("Starts the plugin; if the plugin is already running, it is stopped first.")
	.argument("<uuid>")
	.action((uuid: string) => restart({ uuid }));

program
	.command("stop")
	.alias("s")
	.description("Stops the plugin.")
	.argument("<uuid>")
	.action((uuid: string) => stop({ uuid }));

program.parse();
