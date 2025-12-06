-- Discount codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_percentage DECIMAL(5,2) NOT NULL, -- 25.00 for 25% off
  duration_months INTEGER, -- 3, 6, 12, or NULL for one-time
  stripe_coupon_id VARCHAR(100), -- Synced Stripe coupon ID
  max_uses INTEGER, -- Maximum redemptions
  uses_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  applies_to_packages JSONB, -- ['pkg_id1', 'pkg_id2'] or null for all
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Track who used which code
CREATE TABLE IF NOT EXISTS discount_redemptions (
  id SERIAL PRIMARY KEY,
  code_id INTEGER REFERENCES discount_codes(id),
  discount_code VARCHAR(50) NOT NULL,
  user_email VARCHAR NOT NULL,
  client_id VARCHAR REFERENCES clients(id),
  package_id VARCHAR REFERENCES subscription_packages(id),
  original_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  final_price DECIMAL(10,2) NOT NULL,
  stripe_session_id VARCHAR,
  redeemed_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_discount_redemptions_code ON discount_redemptions(discount_code);
CREATE INDEX IF NOT EXISTS idx_discount_redemptions_email ON discount_redemptions(user_email);

