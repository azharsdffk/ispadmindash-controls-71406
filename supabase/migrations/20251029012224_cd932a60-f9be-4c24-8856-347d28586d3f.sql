-- Add electronic payment fields to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS transaction_id TEXT,
ADD COLUMN IF NOT EXISTS payment_gateway TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS gateway_response JSONB,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Add check constraint for payment_status
ALTER TABLE payments 
ADD CONSTRAINT valid_payment_status 
CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded'));

-- Create index for faster transaction lookups
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);

-- Add comment for documentation
COMMENT ON COLUMN payments.transaction_id IS 'Transaction ID from payment gateway (ZainCash, etc.)';
COMMENT ON COLUMN payments.payment_gateway IS 'Payment gateway used (zaincash, bank_transfer, cash)';
COMMENT ON COLUMN payments.payment_status IS 'Status of electronic payment transaction';