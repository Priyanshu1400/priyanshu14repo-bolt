import type { Metadata } from 'next';
import PolicyPage from '@/components/PolicyPage';
import { getSiteContentValue } from '@/lib/site-content';
import { TERMS_OF_SERVICE } from '@/lib/policy-content';

export const metadata: Metadata = {
  title: 'Terms of Service | 300ml Tea',
  description: 'Terms of Service for shopping at 300mltea.in.',
};

export default async function TermsOfServicePage() {
  const cmsContent = await getSiteContentValue(TERMS_OF_SERVICE.cmsKey);
  return <PolicyPage doc={TERMS_OF_SERVICE} cmsContent={cmsContent} />;
}
