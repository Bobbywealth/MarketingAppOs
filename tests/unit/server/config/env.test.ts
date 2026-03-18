import { beforeEach, describe, expect, it, vi } from "vitest";

const BASE_ENV: NodeJS.ProcessEnv = {
  DATABASE_URL: "https://example.com/db",
  SESSION_SECRET: "x".repeat(40),
  APP_URL: "http://localhost:5000",
  NODE_ENV: "test",
  PORT: "5000",
};

async function loadEnvModule(overrides: NodeJS.ProcessEnv = {}) {
  vi.resetModules();
  process.env = { ...BASE_ENV, ...overrides };
  return import("../../../../server/config/env");
}

describe("Environment Configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...BASE_ENV };
  });

  it("parses required env properties", async () => {
    const { env } = await loadEnvModule();
    expect(env.DATABASE_URL).toBeDefined();
    expect(env.SESSION_SECRET.length).toBeGreaterThanOrEqual(32);
    expect(["development", "production", "test"]).toContain(env.NODE_ENV);
    expect(typeof env.PORT).toBe("number");
  });

  it("applies defaults for app config", async () => {
    const { env } = await loadEnvModule({ APP_URL: undefined, PORT: undefined, NODE_ENV: undefined });
    expect(env.APP_URL).toBe("http://localhost:5000");
    expect(env.PORT).toBe(5000);
    expect(env.NODE_ENV).toBe("development");
  });

  it("validates structured keys when provided", async () => {
    await expect(loadEnvModule({ STRIPE_SECRET_KEY: "invalid" })).rejects.toThrow();
    await expect(loadEnvModule({ STRIPE_PUBLISHABLE_KEY: "invalid" })).rejects.toThrow();
    await expect(loadEnvModule({ OPENAI_API_KEY: "invalid" })).rejects.toThrow();
    await expect(loadEnvModule({ SMTP_FROM_EMAIL: "not-an-email" })).rejects.toThrow();
  });

  it("isServiceConfigured reflects current environment", async () => {
    const { isServiceConfigured } = await loadEnvModule({
      SMTP_HOST: "smtp.example.com",
      SMTP_USER: "user@example.com",
      SMTP_PASS: "password",
      TWILIO_ACCOUNT_SID: "AC123",
      TWILIO_AUTH_TOKEN: "token",
      STRIPE_SECRET_KEY: "sk_test_123",
      GOOGLE_CLIENT_ID: "cid",
      GOOGLE_CLIENT_SECRET: "secret",
      OPENAI_API_KEY: "sk-test-123",
      VAPI_API_KEY: "vapi-key-123",
    });

    expect(isServiceConfigured("email")).toBe(true);
    expect(isServiceConfigured("sms")).toBe(true);
    expect(isServiceConfigured("stripe")).toBe(true);
    expect(isServiceConfigured("google")).toBe(true);
    expect(isServiceConfigured("openai")).toBe(true);
    expect(isServiceConfigured("vapi")).toBe(true);
  });

  it("getServiceStatus returns expected shape", async () => {
    const { getServiceStatus } = await loadEnvModule();
    const status = getServiceStatus();
    expect(status).toHaveProperty("database");
    expect(status).toHaveProperty("session");
    expect(status).toHaveProperty("email");
    expect(status).toHaveProperty("sms");
    expect(status).toHaveProperty("stripe");
    expect(status).toHaveProperty("google");
    expect(status).toHaveProperty("openai");
    expect(status).toHaveProperty("vapi");
    expect(status.app).toEqual({
      url: expect.any(String),
      env: expect.any(String),
      port: expect.any(Number),
    });
  });
});
