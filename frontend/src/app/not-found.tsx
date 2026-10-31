'use client';

import { useRouter } from 'next/navigation';
import NotFoundPage from '../views/NotFoundPage';

export default function NotFound() {
  const router = useRouter();
  return (
    <NotFoundPage
      onNavigate={(route) => router.push(route === 'home' ? '/' : `/${route}`)}
    />
  );
}
