import type { Metadata } from 'next';
import PolicyPage from '@/components/PolicyPage';
import { getSiteContentValue } from '@/lib/site-content';
import { SHIPPING_POLICY } from '@/lib/policy-content';

export const metadata: Metadata = {
  title: 'Shipping Policy | 300ml Tea',
  description: 'Delivery timelines, shipping charges, and pan-India shipping for 300ml Tea.',
};

export default async function ShippingPolicyPage() {
  const cmsContent = await getSiteContentValue(SHIPPING_POLICY.cmsKey);
  return <PolicyPage doc={SHIPPING_POLICY} cmsContent={cmsContent} />;
}
