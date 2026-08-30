'use client';

import { useRouter } from 'next/navigation';
import { ChaiGameArena } from '@/components/game/ChaiGameArena';

export default function GamePage() {
  const router = useRouter();

  return (
    <ChaiGameArena
      onExitGame={() => router.push('/')}
      onGoToStore={() => router.push('/product')}
    />
  );
}
