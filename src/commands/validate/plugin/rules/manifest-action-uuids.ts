import { rule } from "../../rule";
import { PluginContext } from "../contexts/plugin";

/**
 * Validates all action UUIDs are unique, and prefixed with the plugin UUID.
 */
export const actionUuidIsUniqueAndPrefixed = rule<PluginContext>(function (plugin: PluginContext) {
	const uuids = new Set<string>();
	plugin.manifest.manifest.Actions?.forEach(({ UUID: uuid }) => {
		if (uuid?.value === undefined) {
			return;
		}

		// Validate the action identifier is unique.
		if (uuids.has(uuid.value)) {
			this.addError(plugin.manifest.path, `${uuid.pointer}: '${uuid}' must be unique`, {
				position: uuid.location
			});
		} else {
			uuids.add(uuid.value);
		}

		// Check if the action identifier is prefixed with the plugin identifier.
		if (plugin.uuid !== undefined && !uuid.value.startsWith(plugin.uuid)) {
			this.addWarning(plugin.manifest.path, `${uuid.pointer}: ${uuid} should be prefixed with ${plugin.uuid}`, {
				position: uuid.location
			});
		}
	});
});
