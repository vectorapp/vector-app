'use client';
import { FiHome, FiBarChart2, FiAward, FiUser } from 'react-icons/fi';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();
  const navItems = [
    { href: '/', label: 'Feed', icon: FiHome },
    { href: '/insights', label: 'Insights', icon: FiBarChart2 },
    { href: '/leaderboard', label: 'Leaderboard', icon: FiAward },
    { href: '/profile', label: 'Profile', icon: FiUser },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow flex justify-around items-center h-16">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href === '/' && pathname === '/');
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${active ? 'text-blue-700' : 'text-gray-500 hover:text-blue-700'}`}
          >
            <Icon className="w-6 h-6 mb-0.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
} 