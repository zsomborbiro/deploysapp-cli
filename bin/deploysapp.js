#!/usr/bin/env node
import { Command } from "commander";
import { whoami, login, logout } from "../src/commands/auth.js";
import { link } from "../src/commands/link.js";
import { deploy } from "../src/commands/deploy.js";
import { logs } from "../src/commands/logs.js";
import { ps, restart, stop, start, scale, open } from "../src/commands/service.js";
import { printErr } from "../src/output.js";

const program = new Command();
program.name("deploysapp").description("DeploysApp CLI").version("0.1.0");

function wrap(fn) {
  return async (...args) => { try { await fn(...args); } catch (e) { printErr(e); } };
}

program.command("whoami").description("Show the authenticated account").action(wrap(whoami));

program.command("login").description("Authenticate this device")
  .option("--no-open", "don't auto-open the browser")
  .action(wrap((opts) => login({ open: opts.open })));
program.command("logout").description("Remove stored credentials").action(wrap(logout));

program.command("link").description("Bind the current directory to a service")
  .option("--service <id>", "service id (skip the prompt)")
  .action(wrap((opts) => link({ service: opts.service })));

program.command("deploy").description("Trigger a redeploy from git and stream the build log")
  .option("--service <id>", "service id")
  .action(wrap((opts) => deploy({ service: opts.service })));

program.command("logs").description("Show build or runtime logs")
  .option("--service <id>", "service id")
  .option("-f, --follow", "follow runtime logs")
  .option("--build", "show the latest build log instead of runtime")
  .option("--runtime", "show runtime logs (default)")
  .option("--tail <n>", "lines of runtime history", "200")
  .action(wrap((opts) => logs({ service: opts.service, follow: opts.follow, build: opts.build, runtime: opts.runtime, tail: opts.tail })));

program.command("ps").description("List services and their status").action(wrap(() => ps()));

const svcOpt = (c) => c.option("--service <id>", "service id");
svcOpt(program.command("restart").description("Restart a service")).action(wrap((o) => restart(o)));
svcOpt(program.command("stop").description("Stop a service")).action(wrap((o) => stop(o)));
svcOpt(program.command("start").description("Start a service")).action(wrap((o) => start(o)));
svcOpt(program.command("open").description("Open the service URL")).action(wrap((o) => open(o)));
svcOpt(program.command("scale").description("Set the replica count"))
  .requiredOption("--replicas <n>", "number of replicas")
  .action(wrap((o) => scale(o)));

program.parseAsync(process.argv);
