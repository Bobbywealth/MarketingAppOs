import test from "node:test";
import assert from "node:assert/strict";
import { earlyLeadSchema, signupSimpleSchema, websiteSchema, emailSchema } from "../validators/publicSignup";

test("emailSchema trims + lowercases", () => {
  const email = emailSchema.parse("  EXAMPLE@DOMAIN.com ");
  assert.equal(email, "example@domain.com");
});

test("websiteSchema accepts empty string as undefined", () => {
  const website = websiteSchema.parse("");
  assert.equal(website, undefined);
});

test("websiteSchema prefixes https:// when protocol is missing", () => {
  const website = websiteSchema.parse("example.com");
  assert.equal(website, "https://example.com");
});

test("earlyLeadSchema requires name/email/phone/company", () => {
  assert.throws(() => earlyLeadSchema.parse({}), /required/i);
});

test("signupSimpleSchema normalizes and validates core fields", () => {
  const data = signupSimpleSchema.parse({
    company: "  Acme  ",
    website: "acme.com",
    name: "  Jane Doe ",
    email: " JANE@ACME.COM ",
    phone: " 555-111-2222 ",
    services: ["SEO Optimization"],
  });

  assert.equal(data.company, "Acme");
  assert.equal(data.website, "https://acme.com");
  assert.equal(data.email, "jane@acme.com");
  assert.equal(data.name, "Jane Doe");
});


