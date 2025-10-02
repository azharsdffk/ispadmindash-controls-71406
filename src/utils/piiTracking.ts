import { supabase } from '@/integrations/supabase/client';

export type PIIField = 'name' | 'phone' | 'email' | 'address' | 'balance' | 'plan';
export type AccessType = 'view' | 'edit' | 'export';

/**
 * Track PII access for compliance and audit purposes
 * Call this whenever subscriber PII is accessed
 */
export const trackPIIAccess = async (
  subscriberId: string,
  accessedFields: PIIField[],
  accessType: AccessType
) => {
  try {
    const { error } = await supabase.functions.invoke('track-pii-access', {
      body: {
        subscriber_id: subscriberId,
        accessed_fields: accessedFields,
        access_type: accessType,
      },
    });

    if (error) {
      console.error('Failed to track PII access:', error);
    }
  } catch (err) {
    console.error('Error tracking PII access:', err);
  }
};

/**
 * Helper to track viewing subscriber data
 */
export const trackSubscriberView = async (subscriberId: string) => {
  await trackPIIAccess(
    subscriberId,
    ['name', 'phone', 'email', 'address', 'balance', 'plan'],
    'view'
  );
};

/**
 * Helper to track editing subscriber data
 */
export const trackSubscriberEdit = async (
  subscriberId: string,
  editedFields: PIIField[]
) => {
  await trackPIIAccess(subscriberId, editedFields, 'edit');
};

/**
 * Helper to track exporting subscriber data
 */
export const trackSubscriberExport = async (subscriberIds: string[]) => {
  for (const subscriberId of subscriberIds) {
    await trackPIIAccess(
      subscriberId,
      ['name', 'phone', 'email', 'address', 'balance', 'plan'],
      'export'
    );
  }
};
