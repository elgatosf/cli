<!--

## {version}

🚨 Breaking
✨ New
🐞 Fix
♻️ Refactor / Enhance / Update

-->

# Change Log

## 1.7.0

### ✨ New

-   Add smart-formatting of the manifest.json to retain preferred indentation and new-lines.

### ♻️ Update

-   Update `tar` and `tsup` dependencies.

## 1.6.0

### ♻️ Update

-   Updated template to use `@elgato/streamdeck` version 2.

## 1.5.1

### ♻️ Update

-   Reduce strictness of Stream Deck app location checking.

## 1.5.0

### ✨ New

-   Add `list` command to display list of installed plugins.
-   Add `unlink` command to unlink installed plugins.

### 🐞 Fix

-   Resolve DEP0190 warning when using Node.js 24 or higher.

## 1.4.0

### ♻️ Update

-   Update `create` command to show newly created plugins within Stream Deck.

## 1.3.0

### ♻️ Update

-   Update default minimum version of Stream Deck to 6.5.
-   Update sdpi-components to version 4.

## 1.2.0

### ♻️ Update

-   Update `restart` & `stop` commands utilize deep links.

## 1.1.1

-   Update default macOS minimum version to 12.
-   Update dependencies.

## 1.1.0

### ✨ New

-   Add support for non-standard installation paths on Windows.

## 1.0.1

### ♻️ Update

-   Update `@elgato/schemas` dependency.

### 🐞 Fix

-   Fix Node.js engine requirements.

## 1.0.0

### ♻️ Update

-   Update new plugins to use `@elgato/streamdeck` version 1.
-   Update CDN of property inspectors.
-   Bump dependencies of Stream Deck CLI.
-   Bump dependencies of plugins scaffolded with `streamdeck create`.

## 0.3.2

### ♻️ Update

-   Update template to include a property inspector.
-   Update template to auto-resolve JSON schemas for the manifest and layouts.
-   Remove subjective VS Code settings.

## 0.3.1

### ✨ New

-   Enable validation of Stream Deck plugins programmatically.

## 0.3.0

### ✨ New

-   Add `streamdeck validate` command for validating Stream Deck plugins.
-   Add `streamdeck pack` command for creating `.streamDeckPlugin` files.
-   Add `-v` option to display current version of CLI.
-   Add "Open in VSCode" prompt, as part of creation wizard, for macOS.

### ♻️ Update

-   Update template to `{major}.{minor}.{patch}.{build}` version format.
-   Update `streamdeck pack` to automatically adjust version format.

### 🐞 Bug Fixes

-   Fix support for Visual Studio integrated terminal.

## 0.2.0

### ✨ New

-   Add [`packageManager`](README.md/#packagemanager) configuration option ([@fcannizzaro](https://github.com/fcannizzaro)).

### ♻️ Improvements

-   Manifest changes now automatically reload the plugin whilst being watched.
-   Updated template dependency `@types/node` to add support for `fetch` types.

### 🐞 Bug Fixes

-   Fix support for Node v18.

## 0.1.0

### ✨ New

-   Add `create` wizard for quickly scaffolding Stream Deck plugins.
-   Add `link` command for linking plugins in-development to Stream Deck.
-   Add `restart` plugin; unloads the plugins and re-starts the plugin within Stream Deck.
-   Add `stop` plugin; unloads the plugin from Stream Deck.
-   Add `dev` mode toggle for managing developer mode.
-   Add `config` for managing local configuration.
