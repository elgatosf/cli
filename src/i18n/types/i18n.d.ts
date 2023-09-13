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
			authorRequired: string;
			confirmInfo: string;
			description: string;
			name: string;
			nameRequired: string;
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
};
