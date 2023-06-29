const resources: Resources = {
	commandError: (name) => `Failed to run command "${name}"`,
	commands: {
		dev: {
			description: "Enable Stream Deck Plugin development.",
			failed: "Failed to enable Stream Deck developer mode",
			macOSErrorCode: (status) => `Encountered error code: ${status}`,
			success: "Successfully enabled Stream Deck developer mode.",
			unsupportedOS: "Unsupported operating system."
		}
	}
};

export default resources;
