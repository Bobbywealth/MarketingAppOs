-- Sprint 1: Sales security + pipeline discipline + client model cleanup (MVP -> Scale)
-- Safe to run multiple times (IF NOT EXISTS guards).

-- ===== Clients =====
ALTER TABLE clients ADD COLUMN IF NOT EXISTS package_id VARCHAR;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS start_date TIMESTAMP;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS sales_agent_id INTEGER REFERENCES users(id);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS account_manager_id INTEGER REFERENCES users(id);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_status VARCHAR DEFAULT 'current';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_post_date TIMESTAMP;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_visit_date TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_clients_sales_agent_id ON clients(sales_agent_id);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to_id ON clients(assigned_to_id);

-- ===== Leads =====
ALTER TABLE leads ADD COLUMN IF NOT EXISTS decision_maker_name VARCHAR;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS primary_location_address TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS close_reason VARCHAR;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS package_id VARCHAR;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS expected_start_date TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_leads_assigned_to_id ON leads(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);



