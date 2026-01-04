-- Add new ticket statuses to the enum
ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'new';
ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'accepted_by_agent';
ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'tech_assigned';
ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'tech_on_the_way';
ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'tech_arrived';