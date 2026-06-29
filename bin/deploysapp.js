#!/usr/bin/env node
import { Command } from "commander";
import { whoami, login, logout } from "../src/commands/auth.js";
import { link } from "../src/commands/link.js";
import { deploy } from "../src/commands/deploy.js";
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

program.parseAsync(process.argv);
