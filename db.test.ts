// deno test --allow-env --allow-net db.test.ts
import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

import { assertObjectMatch, assertStrictEquals } from "@std/assert";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "@std/testing/bdd";

describe("test", () => {
  let client: Client;

  beforeAll(async () => {
    client = new Client({
      user: Deno.env.get("DB_USER"),
      password: Deno.env.get("DB_PASSWORD"),
      database: Deno.env.get("DB_DATABASE"),
      hostname: Deno.env.get("DB_HOSTNAME"),
      port: Deno.env.get("DB_PORT"),
    });
    await client.connect();
  });

  beforeEach(async () => {
    // setup table
    await client.queryObject(
      "CREATE TABLE IF NOT EXISTS people(id SERIAL PRIMARY KEY, username VARCHAR(40) NOT NULL)",
    );
  });

  afterAll(async () => {
    await client.end();
  });

  afterEach(async () => {
    // reset table
    await client.queryObject(
      "DROP TABLE IF EXISTS people",
    );
  });

  it("insert 1 people", async () => {
    type RecordType = { id: number; username: string };

    await client.queryObject<RecordType>(
      "INSERT INTO people(username) VALUES($1) RETURNING *",
      ["foobar"],
    );

    const result = await client.queryObject<RecordType>(
      "SELECT * FROM people",
    );

    // only created record
    assertStrictEquals(result.rowCount, 1);
    assertObjectMatch(result.rows[0], { id: 1, username: "foobar" });
  });

  it("people table should be reset", async () => {
    const result = await client.queryObject(
      "SELECT * FROM people",
    );
    assertStrictEquals(result.rowCount, 0);
  });
});
