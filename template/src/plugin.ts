import * as streamDeck from "@elgato/streamdeck";

import { IncrementCounter } from "./actions/increment-counter";

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logging.setLogLevel(streamDeck.LogLevel.TRACE);

// Register the increment action.
streamDeck.actions.registerAction("com.elgato.template.increment", new IncrementCounter());
