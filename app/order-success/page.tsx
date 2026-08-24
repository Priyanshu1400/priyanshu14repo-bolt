'use client';

import { Suspense } from 'react';
import OrderConfirmationContent from '@/components/OrderConfirmationContent';

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="oc" />}>
      <OrderConfirmationContent />
    </Suspense>
  );
}
