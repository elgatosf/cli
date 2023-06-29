/* eslint-disable jsdoc/require-jsdoc */

declare type Resources = {
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
