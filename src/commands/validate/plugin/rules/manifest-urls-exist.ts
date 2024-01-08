import { rule } from "../../rule";
import { type PluginContext } from "../contexts/plugin";

/**
 * Validates the URLs defined within the manifest are valid websites, and return 2xx status codes.
 */
export const manifestUrlsExist = rule<PluginContext>(async function (plugin: PluginContext) {
	const {
		manifest: {
			manifest: { URL: url }
		}
	} = plugin;

	if (url?.value == undefined) {
		return;
	}

	// Validate the URL can be parsed.
	let parsedUrl;
	try {
		parsedUrl = new URL(url.value);
	} catch {
		this.addError(plugin.manifest.path, `${url.pointer}: '${url.value}' is not a valid URL`, {
			position: url.location,
			suggestion: !url.value.toLowerCase().startsWith("http") ? "Protocol must be http or https" : undefined
		});

		return;
	}

	// Validate the protocol of the URL.
	if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
		this.addError(plugin.manifest.path, `${url.pointer}: invalid protocol`, {
			position: url.location,
			suggestion: "Protocol must be http or https"
		});

		return;
	}

	try {
		const { status } = await fetch(url.value, { method: "HEAD" });

		// Validate the status code of the URL.
		if (status < 200 || status >= 300) {
			this.addWarning(plugin.manifest.path, `${url.pointer}: '${url.value}' returned status code '${status}'`, {
				position: url.location,
				suggestion: "Status code should be 2xx"
			});
		}
	} catch (err) {
		// Check if resolving the DNS failed.
		if (err instanceof Error && typeof err.cause === "object" && err.cause && "code" in err.cause && err.cause.code === "ENOTFOUND") {
			this.addError(plugin.manifest.path, `${url.pointer}: '${url.value}' could not be resolved`, {
				position: url.location
			});
		} else {
			throw err;
		}
	}
});
