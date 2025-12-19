// Central API exports
export { subscribersApi, type Subscriber } from './subscribers';
export { invoicesApi, type Invoice } from './invoices';
export { ticketsApi, type MaintenanceTicket } from './tickets';
export { paymentsApi, type Payment } from './payments';
export { vouchersApi, type Voucher } from './vouchers';
export { packagesApi, type Package } from './packages';
export { techniciansApi, type Technician } from './technicians';

// Subscriber Search API (Edge Function based)
export { 
  smartSearch, 
  getSubscriberByServiceId, 
  getSubscriberByPhone, 
  searchSubscribers,
  type SearchResult 
} from './subscriberSearch';

// Re-export database types for convenience
export type { Database } from '@/integrations/supabase/types';
