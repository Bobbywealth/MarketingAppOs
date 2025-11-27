-- Add sales-related fields to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deal_value DECIMAL(10,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 10.00;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS expected_close_date DATE;

-- Create commissions table for tracking sales agent earnings
CREATE TABLE IF NOT EXISTS commissions (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  deal_value DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, paid
  notes TEXT,
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create sales_quotas table for tracking agent targets
CREATE TABLE IF NOT EXISTS sales_quotas (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_type VARCHAR(20) DEFAULT 'monthly', -- monthly, quarterly, yearly
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL,
  achieved_amount DECIMAL(10,2) DEFAULT 0,
  target_leads INTEGER,
  converted_leads INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agent_id, period_start, period_end)
);

-- Create lead_assignments table for tracking assignment history
CREATE TABLE IF NOT EXISTS lead_assignments (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  agent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by INTEGER REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  unassigned_at TIMESTAMP,
  reason TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_commissions_agent_id ON commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_quotas_agent_id ON sales_quotas(agent_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotas_period ON sales_quotas(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_lead_id ON lead_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_agent_id ON lead_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_active ON lead_assignments(is_active);

-- Add comments for documentation
COMMENT ON TABLE commissions IS 'Tracks commission earnings for sales agents';
COMMENT ON TABLE sales_quotas IS 'Defines sales targets and tracks achievement for agents';
COMMENT ON TABLE lead_assignments IS 'Maintains history of lead assignments to sales agents';

