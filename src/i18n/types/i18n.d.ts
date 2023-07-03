/* eslint-disable jsdoc/require-jsdoc */
declare type Resources = {
	common: {
		invalidUuid: string;
		taskFailed: string;
		uuid: string;
	};
	create: {
		aborted: string;
		dirNotEmptyWarning: {
			confirm: string;
			text: string;
			title: string;
		};
		openWithVSCode: string;
		questions: {
			author: string;
			confirmInfo: string;
			description: string;
			name: string;
		};
		steps: {
			building: string;
			copyFiles: string;
			dependencies: string;
			developerMode: string;
			finalizing: string;
			intro: (name: string) => string;
			success: string;
			updateConfig: string;
		};
		welcome: {
			howToQuit: string;
			moreInfo: string;
			text: string;
			title: string;
		};
	};
	dev: {
		description: string;
		failed: string;
		macOSErrorCode: (status: number | null) => string;
		success: string;
		unsupportedOS: string;
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
