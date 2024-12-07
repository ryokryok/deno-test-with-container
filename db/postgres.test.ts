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

type RecordType = { id: number; username: string };

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

  it("update 1 people", async () => {
    await client.queryObject<
      RecordType
    >`INSERT INTO people(username) VALUES(${"foobar"})`;

    await client.queryObject<
      RecordType
    >`UPDATE people SET username = ${"quux"} WHERE id = ${1}`;

    const result = await client.queryObject<
      RecordType
    >`SELECT * FROM people WHERE id = ${1}`;

    assertObjectMatch(result.rows[0], { id: 1, username: "quux" });
  });

  it("transaction commit", async () => {
    const t = client.createTransaction("aaa");
    await t.begin();

    await t.queryObject<RecordType>(
      "INSERT INTO people(username) VALUES($1) RETURNING *",
      ["foobar"],
    );

    await t.commit();

    const result = await client.queryObject<RecordType>(
      "SELECT * FROM people",
    );

    assertObjectMatch(result.rows[0], { id: 1, username: "foobar" });
  });

  it("transaction rollback", async () => {
    // initial value
    await client.queryObject<RecordType>(
      "INSERT INTO people(username) VALUES($1) RETURNING *",
      ["DONT DELETE ME"],
    );

    const t = client.createTransaction("rollback_point");
    await t.begin();
    await t.queryObject("TRUNCATE TABLE people");
    await t.rollback();

    const result = await client.queryObject<RecordType>(
      "SELECT * FROM people",
    );

    assertObjectMatch(result.rows[0], { id: 1, username: "DONT DELETE ME" });
  });
});
