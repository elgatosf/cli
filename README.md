<div align="center">

[![Stream Deck SDK banner](https://images.ctfassets.net/8j9xr8kwdre8/1ihLKCwNWEfPixs27dq0c0/130be66a5173f332e4caa892a3462893/banner.png)](https://docs.elgato.com/sdk)

# Maker CLI (Beta)

[![Maker CLI npm package](https://img.shields.io/npm/v/%40elgato/cli?logo=npm&logoColor=white)](https://www.npmjs.com/package/@elgato/cli)
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
  -h, --help        display help for command

Commands:
  create            Creation wizard.
  link [path]       Links the plugin to Stream Deck.
  restart|r <uuid>  Starts the plugin in Stream Deck; if the plugin is already running, it is stopped first.
  stop|s <uuid>     Stops the plugin in Stream Deck.
  dev [options]     Enables developer mode.
  config            Manage the local configuration.
  help [command]    display help for command

Alias:
  streamdeck
  sd
```

## Commands

- [create](#%EF%B8%8F-create)<br />Creation wizard.
- [link](#-link)<br />Links the plugin to Stream Deck.
- [restart](#%EF%B8%8F-restart)<br />Starts the plugin in Stream Deck; if the plugin is already running, it is stopped first.
- [stop](#-stop)<br />Stops the plugin in Stream Deck.
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
