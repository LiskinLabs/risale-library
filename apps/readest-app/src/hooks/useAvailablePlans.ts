import { useEffect, useState } from 'react';
import { fetchAndTransformIAPPlans, isIAPAvailable } from '@/libs/payment/iap/client';
import { fetchStripePlans } from '@/libs/payment/stripe/client';
import { AvailablePlan } from '@/types/quota';
import { stubTranslation as _ } from '@/utils/misc';

const IAP_PRODUCT_IDS = [
  'com.liskinlabs.risale-ai-studio.monthly.plus',
  'com.liskinlabs.risale-ai-studio.monthly.pro',
  'com.liskinlabs.risale-ai-studio.storage.1gb.purchase',
  'com.liskinlabs.risale-ai-studio.storage.2gb.purchase',
  'com.liskinlabs.risale-ai-studio.storage.5gb.purchase',
  'com.liskinlabs.risale-ai-studio.storage.10gb.purchase',
];

interface UseAvailablePlansParams {
  hasIAP: boolean;
  onError?: (message: string) => void;
}

export const useAvailablePlans = ({ hasIAP, onError }: UseAvailablePlansParams) => {
  const [availablePlans, setAvailablePlans] = useState<AvailablePlan[]>([]);
  const [iapAvailable, setIapAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      setError(null);

      try {
        if (hasIAP && (await isIAPAvailable())) {
          const plans = await fetchAndTransformIAPPlans(IAP_PRODUCT_IDS);
          setAvailablePlans(plans);
          setIapAvailable(true);
        } else {
          const plans = await fetchStripePlans();
          setAvailablePlans(plans);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        console.error(`Failed to fetch ${hasIAP ? 'IAP' : 'Stripe'} plans:`, error);

        if (onError) {
          onError(_('Failed to load subscription plans.'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [hasIAP, onError]);

  return { availablePlans, iapAvailable, loading, error };
};
