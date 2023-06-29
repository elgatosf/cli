/* eslint-disable jsdoc/require-jsdoc */
declare type Resources = {
	commandError: (name: string) => string;
	commands: {
		dev: {
			description: string;
			failed: string;
			macOSErrorCode: (status: number | null) => string;
			success: string;
			unsupportedOS: string;
		};
	};
};
