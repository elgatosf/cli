import chalk from "chalk";

const resources: Resources = {
	common: {
		invalidUuid: "UUID can only contain lowercase alphanumeric characters (a-z, 0-9), hyphens (-), underscores (_), or periods (.).",
		taskFailed: "Task failed",
		uuid: "Plugin UUID:"
	},
	create: {
		aborted: "Aborted",
		dirNotEmptyWarning: {
			confirm: `Continuing may result in ${chalk.yellow("data loss")}, are you sure you want to continue?`,
			text: "This creation tool will write files to the current directory.",
			title: chalk.yellow("Warning - Directory is not empty.")
		},
		openWithVSCode: "Would you like to open the plugin in VS Code?",
		questions: {
			author: "Author:",
			authorRequired: "Please enter the author.",
			confirmInfo: "Create Stream Deck plugin from information above?",
			description: "Description:",
			name: "Plugin Name:",
			nameRequired: "Please enter the name of the plugin."
		},
		steps: {
			building: "Building plugin",
			copyFiles: "Generating plugin",
			dependencies: "Installing dependencies",
			developerMode: "Enabling developer mode",
			finalizing: "Finalizing setup",
			intro: (name) => `Creating ${chalk.blue(name)}...`,
			success: chalk.green("Successfully created plugin!"),
			updateConfig: "Updating configuration"
		},
		welcome: {
			howToQuit: chalk.grey("Press ^C at any time to quit."),
			moreInfo: `For more information on building plugins see ${chalk.blue("https://docs.elgato.com")}.`,
			text: "This utility will walk you through creating a local development environment for a plugin.",
			title: `Welcome to the ${chalk.green("Stream Deck Plugin")} creation wizard.`
		}
	}
};

export default resources;
