import streamDeck, { KeyDownEvent, LogLevel, WillAppearEvent } from "@elgato/streamdeck";

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLogLevel(LogLevel.TRACE);

/**
 * Register the `keyDown` event on the Stream Deck to track when an action is pressed. Stream Deck provides various events for tracking interaction with devices,
 * including key down/up, dial rotations, and device connectivity, etc. When triggered, the `data` object contains information about the event and the action
 * (if application) e.g. context (UUID), action type, settings, etc. In this example, our action will display a counter that increments by 1 each press. We track
 * the current count on the action's persisted settings.
 */
streamDeck.on("keyDown", async (data: KeyDownEvent<CounterSettings>) => {
	//
	if (data.payload.settings === undefined) {
		data.payload.settings = { count: 1 };
	} else {
		data.payload.settings.count++;
	}

	// Persist the current count on the action.
	streamDeck.setSettings(data.context, data.payload.settings);

	// Display the count on the device associated with the action (action's are identified by their "context").
	streamDeck.setTitle(data.context, data.payload.settings.count.toString());

	// Show a confirmation tick.
	streamDeck.showOk(data.context);
});

/**
 * The `willAppear` event is useful for setting the visual representation of an action when it become visible to the user. This could be due to the application
 * first starting up, or the user navigating between pages. There is also an inverse of this event in the form of `willDisappear`, which enables tracking currently
 * visible actions. In this example, we're setting the title to the "count" that is incremented in the `keyDown` event above.
 */
// When a button appears, set the title to the current count.
streamDeck.on("willAppear", async (data: WillAppearEvent<CounterSettings>) => {
	streamDeck.setTitle(data.context, (data.payload.settings.count ?? 0).toString());
});

// Settings for the counter action.
type CounterSettings = {
	count: number;
};
