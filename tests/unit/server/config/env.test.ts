import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { env, isServiceConfigured, getServiceStatus } from '../../../../server/config/env';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('env object', () => {
    it('should have DATABASE_URL property', () => {
      expect(env.DATABASE_URL).toBeDefined();
    });

    it('should have SESSION_SECRET property', () => {
      expect(env.SESSION_SECRET).toBeDefined();
      expect(env.SESSION_SECRET.length).toBeGreaterThanOrEqual(32);
    });

    it('should have APP_URL property', () => {
      expect(env.APP_URL).toBeDefined();
    });

    it('should have NODE_ENV property', () => {
      expect(env.NODE_ENV).toBeDefined();
      expect(['development', 'production', 'test']).toContain(env.NODE_ENV);
    });

    it('should have PORT property', () => {
      expect(env.PORT).toBeDefined();
      expect(typeof env.PORT).toBe('number');
    });

    it('should have default PORT value', () => {
      process.env.PORT = undefined;
      expect(env.PORT).toBe(5000);
    });

    it('should have default APP_URL value', () => {
      process.env.APP_URL = undefined;
      expect(env.APP_URL).toBe('http://localhost:5000');
    });

    it('should have default NODE_ENV value', () => {
      process.env.NODE_ENV = undefined;
      expect(env.NODE_ENV).toBe('development');
    });
  });

  describe('email configuration', () => {
    it('should have optional email properties', () => {
      expect(env.SMTP_HOST).toBeTypeOf('string');
      expect(env.SMTP_PORT).toBeTypeOf('number');
      expect(env.SMTP_SECURE).toBeTypeOf('boolean');
      expect(env.SMTP_USER).toBeTypeOf('string');
      expect(env.SMTP_PASS).toBeTypeOf('string');
      expect(env.SMTP_FROM_EMAIL).toBeTypeOf('string');
      expect(env.SMTP_FROM_NAME).toBeTypeOf('string');
    });

    it('should have default SMTP_PORT value', () => {
      process.env.SMTP_PORT = undefined;
      expect(env.SMTP_PORT).toBe(587);
    });

    it('should have default SMTP_SECURE value', () => {
      process.env.SMTP_SECURE = undefined;
      expect(env.SMTP_SECURE).toBe(false);
    });

    it('should validate SMTP_FROM_EMAIL format when provided', () => {
      process.env.SMTP_FROM_EMAIL = 'invalid-email';
      expect(() => {
        // Re-import to trigger validation
        delete require.cache[require.resolve('../../../../server/config/env')];
        require('../../../../server/config/env');
      }).toThrow();
    });
  });

  describe('twilio configuration', () => {
    it('should have optional Twilio properties', () => {
      expect(env.TWILIO_ACCOUNT_SID).toBeTypeOf('string');
      expect(env.TWILIO_AUTH_TOKEN).toBeTypeOf('string');
      expect(env.TWILIO_PHONE_NUMBER).toBeTypeOf('string');
    });
  });

  describe('stripe configuration', () => {
    it('should have optional Stripe properties', () => {
      expect(env.STRIPE_SECRET_KEY).toBeTypeOf('string');
      expect(env.STRIPE_WEBHOOK_SECRET).toBeTypeOf('string');
      expect(env.STRIPE_PUBLISHABLE_KEY).toBeTypeOf('string');
    });

    it('should validate STRIPE_SECRET_KEY format when provided', () => {
      process.env.STRIPE_SECRET_KEY = 'invalid-key';
      expect(() => {
        delete require.cache[require.resolve('../../../../server/config/env')];
        require('../../../../server/config/env');
      }).toThrow();
    });

    it('should validate STRIPE_PUBLISHABLE_KEY format when provided', () => {
      process.env.STRIPE_PUBLISHABLE_KEY = 'invalid-key';
      expect(() => {
        delete require.cache[require.resolve('../../../../server/config/env')];
        require('../../../../server/config/env');
      }).toThrow();
    });
  });

  describe('google configuration', () => {
    it('should have optional Google properties', () => {
      expect(env.GOOGLE_CLIENT_ID).toBeTypeOf('string');
      expect(env.GOOGLE_CLIENT_SECRET).toBeTypeOf('string');
      expect(env.GOOGLE_REFRESH_TOKEN).toBeTypeOf('string');
    });
  });

  describe('openai configuration', () => {
    it('should have optional OpenAI property', () => {
      expect(env.OPENAI_API_KEY).toBeTypeOf('string');
    });

    it('should validate OPENAI_API_KEY format when provided', () => {
      process.env.OPENAI_API_KEY = 'invalid-key';
      expect(() => {
        delete require.cache[require.resolve('../../../../server/config/env')];
        require('../../../../server/config/env');
      }).toThrow();
    });
  });

  describe('vapi configuration', () => {
    it('should have optional Vapi property', () => {
      expect(env.VAPI_API_KEY).toBeTypeOf('string');
    });
  });

  describe('isServiceConfigured', () => {
    describe('email service', () => {
      it('should return true when all email config is present', () => {
        process.env.SMTP_HOST = 'smtp.example.com';
        process.env.SMTP_USER = 'user@example.com';
        process.env.SMTP_PASS = 'password';

        expect(isServiceConfigured('email')).toBe(true);
      });

      it('should return false when email config is missing', () => {
        process.env.SMTP_HOST = undefined;
        process.env.SMTP_USER = undefined;
        process.env.SMTP_PASS = undefined;

        expect(isServiceConfigured('email')).toBe(false);
      });

      it('should return false when partial email config is present', () => {
        process.env.SMTP_HOST = 'smtp.example.com';
        process.env.SMTP_USER = 'user@example.com';
        process.env.SMTP_PASS = undefined;

        expect(isServiceConfigured('email')).toBe(false);
      });
    });

    describe('sms service', () => {
      it('should return true when all SMS config is present', () => {
        process.env.TWILIO_ACCOUNT_SID = 'AC123';
        process.env.TWILIO_AUTH_TOKEN = 'token';

        expect(isServiceConfigured('sms')).toBe(true);
      });

      it('should return false when SMS config is missing', () => {
        process.env.TWILIO_ACCOUNT_SID = undefined;
        process.env.TWILIO_AUTH_TOKEN = undefined;

        expect(isServiceConfigured('sms')).toBe(false);
      });
    });

    describe('stripe service', () => {
      it('should return true when Stripe secret is present', () => {
        process.env.STRIPE_SECRET_KEY = 'sk_test_123';

        expect(isServiceConfigured('stripe')).toBe(true);
      });

      it('should return false when Stripe secret is missing', () => {
        process.env.STRIPE_SECRET_KEY = undefined;

        expect(isServiceConfigured('stripe')).toBe(false);
      });
    });

    describe('google service', () => {
      it('should return true when all Google config is present', () => {
        process.env.GOOGLE_CLIENT_ID = 'client-id';
        process.env.GOOGLE_CLIENT_SECRET = 'secret';

        expect(isServiceConfigured('google')).toBe(true);
      });

      it('should return false when Google config is missing', () => {
        process.env.GOOGLE_CLIENT_ID = undefined;
        process.env.GOOGLE_CLIENT_SECRET = undefined;

        expect(isServiceConfigured('google')).toBe(false);
      });
    });

    describe('openai service', () => {
      it('should return true when OpenAI key is present', () => {
        process.env.OPENAI_API_KEY = 'sk-test-123';

        expect(isServiceConfigured('openai')).toBe(true);
      });

      it('should return false when OpenAI key is missing', () => {
        process.env.OPENAI_API_KEY = undefined;

        expect(isServiceConfigured('openai')).toBe(false);
      });
    });

    describe('vapi service', () => {
      it('should return true when Vapi key is present', () => {
        process.env.VAPI_API_KEY = 'vapi-key-123';

        expect(isServiceConfigured('vapi')).toBe(true);
      });

      it('should return false when Vapi key is missing', () => {
        process.env.VAPI_API_KEY = undefined;

        expect(isServiceConfigured('vapi')).toBe(false);
      });
    });
  });

  describe('getServiceStatus', () => {
    it('should return service status object', () => {
      const status = getServiceStatus();

      expect(status).toHaveProperty('database');
      expect(status).toHaveProperty('session');
      expect(status).toHaveProperty('email');
      expect(status).toHaveProperty('sms');
      expect(status).toHaveProperty('stripe');
      expect(status).toHaveProperty('google');
      expect(status).toHaveProperty('openai');
      expect(status).toHaveProperty('vapi');
      expect(status).toHaveProperty('app');
    });

    it('should return app configuration', () => {
      const status = getServiceStatus();

      expect(status.app).toEqual({
        url: expect.any(String),
        env: expect.any(String),
        port: expect.any(Number),
      });
    });

    it('should return boolean values for services', () => {
      const status = getServiceStatus();

      expect(typeof status.database).toBe('boolean');
      expect(typeof status.session).toBe('boolean');
      expect(typeof status.email).toBe('boolean');
      expect(typeof status.sms).toBe('boolean');
      expect(typeof status.stripe).toBe('boolean');
      expect(typeof status.google).toBe('boolean');
      expect(typeof status.openai).toBe('boolean');
      expect(typeof status.vapi).toBe('boolean');
    });
  });
});
