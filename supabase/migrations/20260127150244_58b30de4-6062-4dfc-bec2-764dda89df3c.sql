-- ============================================
-- Performance Indexes for Version 1.0
-- ============================================

-- Enable pg_trgm extension for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- Indexes for maintenance_tickets
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tickets_status 
  ON maintenance_tickets(status);

CREATE INDEX IF NOT EXISTS idx_tickets_technician 
  ON maintenance_tickets(technician_id);

CREATE INDEX IF NOT EXISTS idx_tickets_subscriber 
  ON maintenance_tickets(subscriber_id);

CREATE INDEX IF NOT EXISTS idx_tickets_priority 
  ON maintenance_tickets(priority);

CREATE INDEX IF NOT EXISTS idx_tickets_created 
  ON maintenance_tickets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tickets_agent 
  ON maintenance_tickets(agent_id);

CREATE INDEX IF NOT EXISTS idx_tickets_status_priority 
  ON maintenance_tickets(status, priority);

CREATE INDEX IF NOT EXISTS idx_tickets_tech_status 
  ON maintenance_tickets(technician_id, status);

-- ============================================
-- Indexes for subscribers
-- ============================================

CREATE INDEX IF NOT EXISTS idx_subscribers_phone 
  ON subscribers(phone);

CREATE INDEX IF NOT EXISTS idx_subscribers_agent 
  ON subscribers(agent_id);

CREATE INDEX IF NOT EXISTS idx_subscribers_created 
  ON subscribers(created_at DESC);

-- Full text search index for name
CREATE INDEX IF NOT EXISTS idx_subscribers_name_trgm 
  ON subscribers USING gin(name gin_trgm_ops);

-- ============================================
-- Indexes for invoices
-- ============================================

CREATE INDEX IF NOT EXISTS idx_invoices_subscriber 
  ON invoices(subscriber_id);

CREATE INDEX IF NOT EXISTS idx_invoices_status 
  ON invoices(status);

CREATE INDEX IF NOT EXISTS idx_invoices_due_date 
  ON invoices(due_date);

CREATE INDEX IF NOT EXISTS idx_invoices_issue_date 
  ON invoices(issue_date DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_subscriber_status 
  ON invoices(subscriber_id, status);

-- ============================================
-- Indexes for payments
-- ============================================

CREATE INDEX IF NOT EXISTS idx_payments_subscriber 
  ON payments(subscriber_id);

CREATE INDEX IF NOT EXISTS idx_payments_invoice 
  ON payments(invoice_id);

CREATE INDEX IF NOT EXISTS idx_payments_date 
  ON payments(payment_date DESC);

-- ============================================
-- Indexes for technicians
-- ============================================

CREATE INDEX IF NOT EXISTS idx_technicians_available 
  ON technicians(available);

CREATE INDEX IF NOT EXISTS idx_technicians_user 
  ON technicians(user_id);

-- ============================================
-- Indexes for agents
-- ============================================

CREATE INDEX IF NOT EXISTS idx_agents_active 
  ON agents(active);

CREATE INDEX IF NOT EXISTS idx_agents_region 
  ON agents(region);

-- ============================================
-- Indexes for audit_logs
-- ============================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_user 
  ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table 
  ON audit_logs(table_name);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created 
  ON audit_logs(created_at DESC);

-- ============================================
-- Indexes for employee_locations
-- ============================================

CREATE INDEX IF NOT EXISTS idx_employee_locations_user 
  ON employee_locations(user_id);

CREATE INDEX IF NOT EXISTS idx_employee_locations_recorded 
  ON employee_locations(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_employee_locations_user_recent 
  ON employee_locations(user_id, recorded_at DESC);

-- ============================================
-- Indexes for notifications
-- ============================================

CREATE INDEX IF NOT EXISTS idx_notifications_user 
  ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_read 
  ON notifications(user_id, read);

CREATE INDEX IF NOT EXISTS idx_notifications_created 
  ON notifications(created_at DESC);

-- ============================================
-- Indexes for contracts
-- ============================================

CREATE INDEX IF NOT EXISTS idx_contracts_subscriber 
  ON contracts(subscriber_id);

CREATE INDEX IF NOT EXISTS idx_contracts_status 
  ON contracts(status);

CREATE INDEX IF NOT EXISTS idx_contracts_end_date 
  ON contracts(end_date);