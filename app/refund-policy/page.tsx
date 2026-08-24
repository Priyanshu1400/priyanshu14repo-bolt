import type { Metadata } from 'next';
import PolicyPage from '@/components/PolicyPage';
import { getSiteContentValue } from '@/lib/site-content';
import { REFUND_POLICY } from '@/lib/policy-content';

export const metadata: Metadata = {
  title: 'Refund Policy | 300ml Tea',
  description: 'Cancellations, replacements, and refunds for 300ml Tea orders.',
};

export default async function RefundPolicyPage() {
  const cmsContent = await getSiteContentValue(REFUND_POLICY.cmsKey);
  return <PolicyPage doc={REFUND_POLICY} cmsContent={cmsContent} />;
}
