import chalk from "chalk";

const resources: Resources = {
	common: {
		invalidUuid: chalk.red("UUID can only contain lowercase alphanumeric characters (a-z, 0-9), hyphens (-), underscores (_), or periods (.)."),
		taskFailed: "Task failed",
		uuid: "Plugin UUID:"
	},
	create: {
		aborted: "Creation aborted",
		dirNotEmptyWarning: {
			confirm: `Continuing may result in ${chalk.yellow("data loss")}, are you sure you want to continue?`,
			text: "This creation tool will write files to the current directory.",
			title: chalk.yellow("Warning - Directory is not empty.")
		},
		openWithVSCode: "Would you like to open the plugin in VS Code?",
		questions: {
			author: "Author:",
			confirmInfo: "Create Stream Deck plugin from information above?",
			description: "Description:",
			name: "Plugin Name:"
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
	},
	dev: {
		description: "Enable Stream Deck Plugin development.",
		failed: "Failed to enable Stream Deck developer mode",
		macOSErrorCode: (status) => `Encountered error code: ${status}`,
		success: "Successfully enabled Stream Deck developer mode.",
		unsupportedOS: "Unsupported operating system."
	},
	link: {
		aborted: "Linking aborted",
		description: "Creates a symlink between the Elgato Stream Deck plugins folder, and the development environment.",
		existingDirectoryOrFile: (uuid?: string) => `Plugin ${chalk.yellow(uuid)} is an existing directory/file.`,
		existingLink: (uuid?: string) => `Plugin ${chalk.yellow(uuid)} is already linked to another directory.`,
		new: "new",
		old: "old",
		questions: {
			confirmOverwrite: "Creating the link may result in data loss, are you sure?",
			overwrite: "Would you like to overwrite the directory/file?",
			redirect: "Would you like to redirect to the new link?"
		},
		setUuidSuccess: (uuid) => `Successfully set plugin ${chalk.green("UUID")} to ${chalk.green(uuid)}.`,
		success: (uuid, cwd) => `Successfully linked ${chalk.green(uuid)} to ${chalk.green(cwd)}.`,
		uuidMustBeSet: "The UUID (unique-identifier) for the plugin must be set before linking."
	}
};

export default resources;
