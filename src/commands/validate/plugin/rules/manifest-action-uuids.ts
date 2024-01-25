import { colorize } from "../../../../common/stdout";
import { rule } from "../../rule";
import { PluginContext } from "../contexts/plugin";

/**
 * Validates all action UUIDs are unique, and prefixed with the plugin UUID.
 */
export const actionUuidIsUniqueAndPrefixed = rule<PluginContext>(function (plugin: PluginContext) {
	const uuids = new Set<string>();
	plugin.manifest.value.Actions?.forEach(({ UUID: uuid }) => {
		if (uuid?.value === undefined) {
			return;
		}

		// Validate the action identifier is unique.
		if (uuids.has(uuid.value)) {
			this.addError(plugin.manifest.path, "must be unique", uuid);
		} else {
			uuids.add(uuid.value);
		}

		// Check if the action identifier is prefixed with the plugin identifier.
		if (plugin.uuid !== undefined && !uuid.value.startsWith(plugin.uuid)) {
			this.addWarning(plugin.manifest.path, `should be prefixed with ${colorize(plugin.uuid)}`, uuid);
		}
	});
});
