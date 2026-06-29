// src/commands/auth.js  (whoami only in this task; login/logout added in B2)
import { makeClient } from "../config.js";

export async function whoami() {
  const client = makeClient();
  const me = await client.get("/me");
  const email = me?.user?.email || me?.email || "(unknown)";
  console.log(email);
}
