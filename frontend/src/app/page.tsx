'use client';

import { useRouter } from 'next/navigation';
import HomePage from '../views/HomePage';

export default function Page() {
  const router = useRouter();
  return (
    <HomePage
      onNavigateWorkbench={() => router.push('/dashboard')}
      onNavigateInstall={() => router.push('/install')}
    />
  );
}
