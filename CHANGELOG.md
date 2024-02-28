<!--

## {version}

🚨 Breaking
✨ New
🐞 Fix
♻️ Refactor / Enhance / Update

-->

# Change Log

## vNext

### ✨ New

- Add `streamdeck validate` command for validating Stream Deck plugins.
- Add `-v` option to display current version of CLI.
- Add "Open in VSCode" prompt, as part of creation wizard, for macOS.

### 🐞 Bug Fixes

- Fix support for Visual Studio integrated terminal.

## 0.2.0

### ✨ New

- Add [`packageManager`](README.md/#packagemanager) configuration option ([@fcannizzaro](https://github.com/fcannizzaro)).

### ♻️ Improvements

- Manifest changes now automatically reload the plugin whilst being watched.
- Updated template dependency `@types/node` to add support for `fetch` types.

### 🐞 Bug Fixes

- Fix support for Node v18.

## 0.1.0

### ✨ New

- Add `create` wizard for quickly scaffolding Stream Deck plugins.
- Add `link` command for linking plugins in-development to Stream Deck.
- Add `restart` plugin; unloads the plugins and re-starts the plugin within Stream Deck.
- Add `stop` plugin; unloads the plugin from Stream Deck.
- Add `dev` mode toggle for managing developer mode.
- Add `config` for managing local configuration.
