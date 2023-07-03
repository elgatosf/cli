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
	link: {
		aborted: string;
		description: string;
		existingDirectoryOrFile: (uuid?: string) => string;
		existingLink: (uuid?: string) => string;
		new: string;
		old: string;
		questions: {
			confirmOverwrite: string;
			overwrite: string;
			redirect: string;
		};
		setUuidSuccess: (uuid?: string) => string;
		success: (uuid?: string, cwd: string) => string;
		uuidMustBeSet: string;
	};
};
