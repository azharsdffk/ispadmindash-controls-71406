-- Fix remaining security definer function
CREATE OR REPLACE FUNCTION public.process_payment_transaction(
  p_subscriber_id uuid, 
  p_invoice_id uuid, 
  p_amount numeric, 
  p_payment_method payment_method, 
  p_payment_date date, 
  p_notes text, 
  p_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment_id UUID;
BEGIN
  -- Insert payment
  INSERT INTO public.payments (subscriber_id, invoice_id, amount, payment_method, payment_date, notes, created_by)
  VALUES (p_subscriber_id, p_invoice_id, p_amount, p_payment_method, p_payment_date, p_notes, p_user_id)
  RETURNING id INTO v_payment_id;
  
  -- Update invoice status if paid in full
  IF p_invoice_id IS NOT NULL THEN
    UPDATE public.invoices
    SET status = CASE 
      WHEN (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE invoice_id = p_invoice_id) >= net_amount 
      THEN 'paid'::invoice_status
      ELSE status
    END
    WHERE id = p_invoice_id;
  END IF;
  
  -- Update subscriber balance
  UPDATE public.subscribers
  SET balance = balance + p_amount
  WHERE id = p_subscriber_id;
  
  -- Log audit
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data)
  VALUES (p_user_id, 'CREATE', 'payments', v_payment_id, jsonb_build_object('amount', p_amount, 'subscriber_id', p_subscriber_id));
  
  RETURN v_payment_id;
END;
$$;