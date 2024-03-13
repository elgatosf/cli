<div align="center">

[![Stream Deck SDK banner](https://images.ctfassets.net/8j9xr8kwdre8/1ihLKCwNWEfPixs27dq0c0/130be66a5173f332e4caa892a3462893/banner.png)](https://docs.elgato.com/sdk)

# Maker CLI (Beta)

[![Maker CLI npm package](https://img.shields.io/npm/v/%40elgato/cli?logo=npm&logoColor=white)](https://www.npmjs.com/package/@elgato/cli)
[![Build status](https://img.shields.io/github/actions/workflow/status/elgatosf/cli/build.yml?branch=main&label=Build&logo=GitHub)](https://github.com/elgatosf/cli/actions)
[![SDK documentation](https://img.shields.io/badge/Documentation-2ea043?labelColor=grey&logo=gitbook&logoColor=white)](https://docs.elgato.com/sdk)
[![Join the Marketplace Makers Discord](https://img.shields.io/badge/Marketplace%20Makers-5662f6?labelColor=grey&logo=discord&logoColor=white)](https://discord.gg/GehBUcu627)
[![Elgato homepage](https://img.shields.io/badge/Elgato-3431cf?labelColor=grey&logo=data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+RWxnYXRvPC90aXRsZT48cGF0aCBmaWxsPSIjZmZmZmZmIiBkPSJtMTMuODgxOCA4LjM5NjQuMDI2MS4wMTk2IDkuOTQ5NCA1LjcxNzJjLS40ODg0IDIuNzI5LTEuOTE5NiA1LjIyMjMtNC4wMzg0IDcuMDI1M0ExMS45MjYyIDExLjkyNjIgMCAwIDEgMTIuMDk3IDI0Yy0zLjE5MjUgMC02LjE5MzktMS4yNDc3LTguNDUyNy0zLjUxNDRDMS4zODY4IDE4LjIxODguMTQyNyAxNS4yMDQ0LjE0MjcgMTJjMC0zLjIwNDIgMS4yNDQtNi4yMTg3IDMuNTAxNS04LjQ4NTRDNS45MDE5IDEuMjQ4IDguOTAzMiAwIDEyLjA5NyAwYzIuNDM5NCAwIDQuNzg0Ny43MzMzIDYuNzgzIDIuMTE4NyAxLjk1MjYgMS4zNTQgMy40NDY2IDMuMjM1NyA0LjMyMjcgNS40NDIyLjExMTIuMjgyOS4yMTQ5LjU3MzYuMzA1MS44NjU3bC0yLjEyNTUgMS4yMzU5YTkuNDkyNCA5LjQ5MjQgMCAwIDAtLjI2MTktLjg2OTRjLTEuMzU0LTMuODMwMy00Ljk4MTMtNi40MDQ4LTkuMDIzNy02LjQwNDhDNi44MTcxIDIuMzg4MyAyLjUyMiA2LjcwMDUgMi41MjIgMTJjMCA1LjI5OTUgNC4yOTUgOS42MTE1IDkuNTc0OCA5LjYxMTUgMi4wNTIgMCA0LjAwODQtLjY0NDIgNS42NTk2LTEuODY0NyAxLjYxNzItMS4xOTU1IDIuODAzNi0yLjgzMzcgMy40MzA5LTQuNzM2NGwuMDA2NS0uMDQxOUw5LjU5MDYgOC4zMDQ4djcuMjI1Nmw0LjAwMDQtMi4zMTM4IDIuMDYgMS4xODExLTUuOTk2MiAzLjQ2ODgtMi4xMi0xLjIxMjZWNy4xOTQzbDIuMTE3NC0xLjIyNDUgNC4yMzA5IDIuNDI3OS0uMDAxMy0uMDAxMyIvPjwvc3ZnPg==)](https://elgato.com)

</div>

## Installation

```
npm install -g @elgato/cli
```

## Usage

```
Usage: streamdeck [options] [command]

Options:
  -v                            display CLI version
  -h, --help                    display help for command

Commands:
  create                        Stream Deck plugin creation wizard.
  link [path]                   Links the plugin to Stream Deck.
  restart|r <uuid>              Starts the plugin in Stream Deck; if the plugin is already running, it is stopped first.
  stop|s <uuid>                 Stops the plugin in Stream Deck.
  dev [options]                 Enables developer mode.
  validate [options] [path]     Validates the Stream Deck plugin.
  pack|bundle [options] [path]  Create a .streamDeckPlugin file from the plugin.
  config                        Manage the local configuration.
  help [command]                display help for command

Alias:
  streamdeck
  sd
```

## Commands

- [create](#%EF%B8%8F-create)<br />Creation wizard.
- [link](#-link)<br />Links the plugin to Stream Deck.
- [restart](#%EF%B8%8F-restart)<br />Starts the plugin in Stream Deck; if the plugin is already running, it is stopped first.
- [stop](#-stop)<br />Stops the plugin in Stream Deck.
- [validate](#sd-validate) (beta)<br />Validates the Stream Deck plugin.
- [pack](#sd-pack) (beta)<br />Create a .streamDeckPlugin file from the plugin.
- [dev](#%EF%B8%8F-dev)<br />Enables developer mode.
- [config](#%EF%B8%8F-config)<br />Manage the local configuration.

## ✏️ create

Creation wizard.

### Synopsis

```
streamdeck create
```

### Description

The creation wizard will guide you through creating Stream Deck plugins with our official Node.js SDK, and provides all scaffolding required to get started quickly. As part of the wizard, developer mode is enabled, and the plugin built and linked to Stream Deck making it ready for use.

> To learn more about creating Stream Deck plugins with Node.js, see our [Stream Deck SDK](https://github.com/elgatosf/streamdeck).

#### See Also

- [dev](#%EF%B8%8F-dev)
- [link](#-link)

## 🔗 link

Links the plugin to Stream Deck.

### Synopsis

```
streamdeck link [path]
```

### Description

Links the specified path (folder) to Stream Deck, effectively installing the plugin, allowing it to be accessed from within Stream Deck. When the path is unspecified, the current working directory is used.

Note: The folder name should reflect the UUID of the plugin, and must be suffixed with `.sdPlugin`, eg. `com.elgato.wave-link.sdPlugin`.

## ♻️ restart

Starts the plugin in Stream Deck; if the plugin is already running, it is stopped first.

### Synopsis

```
streamdeck restart <uuid>

alias: r
```

### Description

Instructs Stream Deck to start the plugin, as determined by the UUID. If the plugin is already running within Stream Deck, it is first stopped and then started. As part of restarting the plugin all resources associated with the plugin, including manifest definitions, are reloaded.

#### See Also

- [stop](#-stop)

## 🛑 stop

Stops the plugin in Stream Deck.

### Synopsis

```
streamdeck stop <uuid>

alias: s
```

### Description

Instructs Stream Deck to stop the plugin, as determined by the UUID. When stopped, the plugin and all of its resources are unloaded from Stream Deck allowing the plugin to be changed.

#### See Also

- [restart](#%EF%B8%8F-restart)

<h3 id="sd-validate">
	✅ validate (beta)
</h3>

Validates the Stream Deck plugin.

### Synopsis

```
streamdeck validate [path]

Arguments:
  path                  Path of the plugin to validate

Options:
  --force-update-check  Forces an update check (default: false)
  --no-update-check     Disables updating schemas
```

### Description

Validates the Stream Deck plugin in the current working directory, or `path` when specified, and outputs the validation results. By default, the command will automatically check and install validation rule updates; this check occurs daily, unless forced with `--force-update-check` or prevented with `--no-update-check`.

### Configuration

#### `--force-update-check`

- Default: `false`
- Type: Boolean

Forces an update check of new validation rules; by default, an update check will occur once a day. Cannot be used in conjunction with `--no-update-check`.

#### `--no-update-check`

- Default: `false`
- Type: Boolean

Prevents an update check of new validation rules. This configuration option is recommended when using the CLI as part of a build pipeline. Cannot be used in conjunction with `--force-update-check`.

<h3 id="sd-pack">
	📦 pack (beta)
</h3>

Creates a .streamDeckPlugin file from the plugin.

### Synopsis

```
streamdeck pack [options] [path]

Arguments:
  path                  Path of the plugin to pack

Options:
  --dry-run             Generates a report without creating a package (default: false)
  -f|--force            Forces saving, overwriting an package if it exists (default: false)
  -o|--output <output>  Specifies the path for the output directory
  --version <version>   Plugin version; value will be written to the manifest"
  --force-update-check  Forces an update check (default: false)
  --no-update-check     Disables updating schemas

alias: bundle
```

### Description

Creates a `.streamDeckPlugin` installer file allowing the plugin to be distributed. The plugin must pass [validation](#sd-validate) prior to bundling.

By default, all files within the specified `path` are included except `.git`, `/.env*`, `*.log`, and `*.js.map` directories and files. To specify directories or files that should be ignored, a `.sdignore` file can be created in the root of the plugin, i.e. alongside the manifest, using [`.gitignore` specification](https://git-scm.com/docs/gitignore).

### Example

Create a `.streamDeckPlugin` of the plugin located in `com.elgato.test.sdPlugin/`, writing the packaged file to a `dist/` folder, specifying the new version.

```
streamdeck pack com.elgato.test.sdPlugin/ --output dist/
```

Create a `.streamDeckPlugin` of the current working directory, specifying a new version of the plugin.

```
streamdeck pack --version 0.8.2
```

Generate a report for the plugin in the current working directory, without creating a `.streamDeckPlugin` file.

```
streamdeck pack --dry-run
```

### Configuration

#### `--dry-run`

- Default: `false`
- Type: Boolean

Generates a report without creating a package.

#### `-f|--force`

- Default: `false`
- Type: Boolean

Determines whether to overwrite the existing `.streamDeckPlugin` file if one already exists at the specified `output` directory.

#### `-o|--output <output>`

- Default: `cwd`
- Type: String

Specifies the path for the output directory where the `.streamDeckPlugin` file will be created.

#### `--version <version>`

- Default: `undefined`
- Type: String (semver)

Plugin version; value will be written to the manifest's `Version` property prior to packaging the plugin.

#### `--force-update-check`

- Default: `false`
- Type: Boolean

Forces an update check of new validation rules; by default, an update check will occur once a day. Cannot be used in conjunction with `--no-update-check`.

#### `--no-update-check`

- Default: `false`
- Type: Boolean

Prevents an update check of new validation rules. This configuration option is recommended when using the CLI as part of a build pipeline. Cannot be used in conjunction with `--force-update-check`.

## 🏗️ dev

Enables developer mode.

### Synopsis

```
streamdeck dev [-d|--disable]
```

### Description

Developer mode enables the local development of Stream Deck plugins, and provides the Maker with additional capabilities for building and debugging with Stream Deck. Whilst enabled, Node.js plugins can be executed, and it is also possible to debug the property inspector locally at `http://localhost:23654/`.

## ⚙️ config

Manage the local configuration.

### Synopsis

```
streamdeck config set <key>=<value> [<key>=<value>...]
streamdeck config unset <key> [<key>...]
streamdeck config list
streamdeck config reset
```

### Description

The CLI gets its configuration settings from the user's local environment. These configuration settings define the output of commands and how they're executed, and enable customization of interaction. The `streamdeck config` command can be used to update and manage these settings.

#### Sub-commands

#### set

```
streamdeck config set <key>=<value> [<key>=<value>...]
```

Sets each of the configuration keys to the value provided.

#### unset

```
streamdeck config <key> [<key>...]
```

Sets each of the configuration keys to their default values.

#### reset

```
streamdeck config reset
```

Resets all configuration keys to their default values.

#### list

```
streamdeck config list
```

Lists the defined configuration, eg. values defined using [config set](#set).

### Configuration

#### reduceMotion

- Default: `false`
- Type: Boolean

Determines whether feedback provided should prefer reduced motion; when `true`, the busy indicator will be rendered as a static indicator.

#### packageManager

- Default: `npm`
- Type: bun | npm | pnpm | yarn

Determines the package manager to use when installing dependencies for every new project.
