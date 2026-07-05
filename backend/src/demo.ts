//Sample Hono client

import { hc } from "hono/client";
import type { AppType } from "./index.ts";

const client = hc<AppType>("");

const res = await client.api.chat.$post({
  name: "idk",
  participants: [""],
});

const ws = client.ws.$ws();
