'use client';
import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';

export default function ConditionalNav() {
  const pathname = usePathname();
  
  // Don't show nav on login page
  if (pathname === '/login') {
    return null;
  }
  
  return <BottomNav />;
} 