'use client';

import { Suspense } from 'react';
import OrderConfirmationContent from '@/components/OrderConfirmationContent';

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div className="oc" />}>
      <OrderConfirmationContent />
    </Suspense>
  );
}
