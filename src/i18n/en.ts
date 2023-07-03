import chalk from "chalk";

const resources: Resources = {
	commandError: (name) => `Failed to run command "${name}"`,
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
