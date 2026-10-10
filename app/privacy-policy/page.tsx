import type { Metadata } from 'next';
import PolicyPage from '@/components/PolicyPage';
import { getSiteContentValue } from '@/lib/site-content';
import { PRIVACY_POLICY } from '@/lib/policy-content';

export const metadata: Metadata = {
  title: 'Privacy Policy | 300ml Tea',
  description: 'How 300ml Tea collects and uses your information.',
};

export default async function PrivacyPolicyPage() {
  const cmsContent = await getSiteContentValue(PRIVACY_POLICY.cmsKey);
  return <PolicyPage doc={PRIVACY_POLICY} cmsContent={cmsContent} />;
}
