'use client';
import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';
import TopNav from './TopNav';

export default function ConditionalNav() {
  const pathname = usePathname();
  
  // Don't show nav on login page
  if (pathname === '/login') {
    return null;
  }
  
  return (
    <>
      <TopNav />
      <BottomNav />
    </>
  );
} 