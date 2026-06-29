# @deploysapp/cli

Command-line interface for [DeploysApp](https://deploysapp.com) — deploy, manage, and monitor your services from the terminal.

```
npm install -g @deploysapp/cli
```

Requires **Node >= 20**.

Binary names: `deploysapp` and `dsa` (short alias).

---

## Quick start

```sh
deploysapp login          # authenticate this device (opens browser)
deploysapp link           # bind the current directory to a service
deploysapp deploy         # redeploy from git and stream the build log
```

---

## Authentication

### Interactive (recommended for local dev)

```sh
deploysapp login
```

Opens a browser-based device-code flow. Credentials are saved to `~/.deploysapp/config.json` (mode 0600).

```sh
deploysapp logout         # remove stored credentials
deploysapp whoami         # print the authenticated account
```

### CI / headless environments

Skip `login` entirely — set env vars instead:

```sh
export DEPLOYSAPP_API_KEY=dsa_xxxxxxxxxxxx
# optional: point at a self-hosted API
export DEPLOYSAPP_API_URL=https://api.your-instance.example.com
```

`DEPLOYSAPP_API_KEY` takes precedence over the stored config file.

---

## The `.deploysapp.json` link file

Running `deploysapp link` (or `dsa link`) writes a `.deploysapp.json` file in the current directory that records the service (and project) id:

```json
{
  "serviceId": "svc_abc123",
  "projectId": "proj_xyz789"
}
```

All commands that operate on a specific service read this file automatically. You can override it at any time with the `--service <id>` flag.

---

## Command reference

### Auth

| Command | Description | Example |
|---------|-------------|---------|
| `login [--no-open]` | Authenticate this device via browser | `dsa login` |
| `logout` | Remove stored credentials | `dsa logout` |
| `whoami` | Print the currently authenticated account | `dsa whoami` |

### Linking

| Command | Description | Example |
|---------|-------------|---------|
| `link [--service <id>]` | Bind the current directory to a service (writes `.deploysapp.json`) | `dsa link` |

### Deployment

| Command | Description | Example |
|---------|-------------|---------|
| `deploy [--service <id>]` | Trigger a redeploy from git and stream the build log | `dsa deploy --service svc_abc123` |

### Logs

```
logs [--service <id>] [-f] [--build | --runtime] [--tail <n>]
```

| Flag | Description |
|------|-------------|
| `--service <id>` | Target service (overrides `.deploysapp.json`) |
| `--build` | Show the latest build log |
| `--runtime` | Show runtime logs (default) |
| `-f, --follow` | Follow (stream) runtime logs |
| `--tail <n>` | Lines of history to show (default: 200) |

Examples:

```sh
dsa logs                        # last 200 lines of runtime logs
dsa logs --build                # latest build log
dsa logs -f                     # follow runtime logs live
dsa logs -f --tail 50           # follow, starting from last 50 lines
```

### Service lifecycle

All service commands accept `--service <id>` to override `.deploysapp.json`.

| Command | Description | Example |
|---------|-------------|---------|
| `ps` | List all services and their current status | `dsa ps` |
| `restart [--service <id>]` | Restart a service | `dsa restart` |
| `stop [--service <id>]` | Stop a service | `dsa stop --service svc_abc123` |
| `start [--service <id>]` | Start a stopped service | `dsa start` |
| `open [--service <id>]` | Open the service URL in the browser | `dsa open` |
| `scale --replicas <n> [--service <id>]` | Set the replica count | `dsa scale --replicas 3` |

### Environment variables

All `env` subcommands accept `--service <id>`.

| Command | Description | Example |
|---------|-------------|---------|
| `env list` | List all env vars for a service | `dsa env list` |
| `env get <key>` | Print the value of a single env var | `dsa env get DATABASE_URL` |
| `env set <KEY=VALUE> [--restart]` | Set an env var (optionally restart) | `dsa env set PORT=3000 --restart` |
| `env rm <key> [--restart]` | Delete an env var (optionally restart) | `dsa env rm OLD_VAR --restart` |

### Secrets

Project-scoped secrets can be attached to a service as an env var.

| Command | Description | Example |
|---------|-------------|---------|
| `secret list [--project <id>]` | List secrets for a project | `dsa secret list` |
| `secret attach <name> --as <ENV_KEY> [--project <id>] [--service <id>]` | Expose a secret to a service as an env var | `dsa secret attach db-password --as DATABASE_PASSWORD` |

---

## Configuration reference

| Source | Key | Default |
|--------|-----|---------|
| Env var | `DEPLOYSAPP_API_KEY` | — |
| Env var | `DEPLOYSAPP_API_URL` | `https://api.deploysapp.com` |
| File | `~/.deploysapp/config.json` | written by `login` |

Environment variables always take precedence over the config file.

---

## License

ISC
