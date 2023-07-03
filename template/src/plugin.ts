import * as streamDeck from "@elgato/streamdeck";

import { IncrementCounter } from "./actions/increment-counter";

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLogLevel(streamDeck.LogLevel.TRACE);

// Register the increment action.
streamDeck.router.route("com.elgato.template.increment", new IncrementCounter());
