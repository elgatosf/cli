import { program } from "commander";

import { config, create, link, restart, setDeveloperMode, stop } from "./commands";

program
	.command("create")
	.description("Wizard that guides you through setting up a Stream Deck plugin.")
	.action(() => create());

const configCommand = program.command("config").description("Manage local configuration.");

configCommand
	.command("set")
	.description("Sets each of the configuration keys to their provided value.")
	.argument("<key>=<value>")
	.argument("[<key>=<value>...]")
	.action((entry: string, entries: string[]) => config.set({ entry, entries }));

configCommand
	.command("unset")
	.description("Resets each of the configuration keys to their default values.")
	.argument("<key>")
	.argument("[<key>...]")
	.action((key: string, keys: string[]) => config.unset({ key, keys: keys }));

configCommand
	.command("list")
	.description("Lists all configuration.")
	.action(() => config.list());

configCommand
	.command("reset")
	.description("Resets all configuration.")
	.action(() => config.reset());

program
	.command("dev")
	.description("Enables / disables local development of Stream Deck plugins.")
	.option("-d|--disable", "Disables developer mode", false)
	.action(({ disable }) => setDeveloperMode({ disable }));

program
	.command("link")
	.argument("[path]", "Path of the plugin to link.")
	.description("Creates a symbolic-link to the current working directory, installing it to the Stream Deck as a plugin.")
	.action((path) => link({ path }));

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
