import { program } from "commander";
import { config, create, link, restart, setDeveloperMode, stop, validate } from "./commands";
import { packageManager } from "./package-manager";

program.version(packageManager.getVersion(), "-v, --version", "display CLI version");

program
	.command("create")
	.description("Stream Deck plugin creation wizard.")
	.action(() => create());

program
	.command("link")
	.argument("[path]", "Path of the plugin to link.")
	.description("Links the plugin to Stream Deck.")
	.action((path) => link({ path }));

program
	.command("restart")
	.alias("r")
	.description("Starts the plugin in Stream Deck; if the plugin is already running, it is stopped first.")
	.argument("<uuid>")
	.action((uuid: string) => restart({ uuid }));

program
	.command("stop")
	.alias("s")
	.description("Stops the plugin in Stream Deck.")
	.argument("<uuid>")
	.action((uuid: string) => stop({ uuid }));

program
	.command("dev")
	.description("Enables developer mode.")
	.option("-d|--disable", "Disables developer mode", false)
	.action(({ disable }) => setDeveloperMode({ disable }));

program
	.command("validate")
	.description("Validates the Stream Deck plugin.")
	.argument("[path]", "Path of the plugin to validate")
	.option("--force-update-check", "Forces an update check", false)
	.option("--no-update-check", "Disables updating schemas", true)
	.action((path, { forceUpdateCheck, updateCheck }) => {
		// Check for conflicting options.
		if (!updateCheck && forceUpdateCheck) {
			console.log(`error: option '--force-update-check' cannot be used with option '--no-update-check'`);
			process.exit(1);
		}

		validate({ forceUpdateCheck, path, updateCheck });
	});

const configCommand = program.command("config").description("Manage the local configuration.");

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

program.parse();
