import { describe, it, expect } from "vitest";
import { earlyLeadSchema, signupSimpleSchema, websiteSchema, emailSchema } from "../validators/publicSignup";

describe("publicSignup validators", () => {
it("emailSchema trims + lowercases", () => {
  const email = emailSchema.parse("  EXAMPLE@DOMAIN.com ");
  expect(email).toBe("example@domain.com");
});

it("websiteSchema accepts empty string as undefined", () => {
  const website = websiteSchema.parse("");
  expect(website).toBeUndefined();
});

it("websiteSchema prefixes https:// when protocol is missing", () => {
  const website = websiteSchema.parse("example.com");
  expect(website).toBe("https://example.com");
});

it("earlyLeadSchema requires name/email/phone/company", () => {
  expect(() => earlyLeadSchema.parse({})).toThrow();
});

it("signupSimpleSchema normalizes and validates core fields", () => {
  const data = signupSimpleSchema.parse({
    company: "  Acme  ",
    website: "acme.com",
    name: "  Jane Doe ",
    email: " JANE@ACME.COM ",
    phone: " 555-111-2222 ",
    services: ["SEO Optimization"],
  });

  expect(data.company).toBe("Acme");
  expect(data.website).toBe("https://acme.com");
  expect(data.email).toBe("jane@acme.com");
  expect(data.name).toBe("Jane Doe");
});
});

