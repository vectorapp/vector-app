'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useUser } from './model/auth/UserContext';
import { FiUser } from 'react-icons/fi';

export default function TopNav() {
  const pathname = usePathname();
  const { user } = useUser();

  // Map pathnames to display names
  const getPageTitle = (pathname: string): string => {
    switch (pathname) {
      case '/':
        return 'Feed';
      case '/insights':
        return 'Insights';
      case '/leaderboard':
        return 'Leaderboard';
      case '/coaching':
        return 'Coaching';
      case '/profile':
        return 'Profile';
      default:
        return 'Scalar';
    }
  };

  const pageTitle = getPageTitle(pathname);

  // Get user initials or fallback
  const getUserDisplay = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    } else if (user?.firstName) {
      return user.firstName[0].toUpperCase();
    } else if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return null;
  };

  const userDisplay = getUserDisplay();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Profile Avatar - Left Side */}
        <Link href="/profile" className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700 text-sm hover:bg-blue-200 transition-colors">
            {userDisplay ? (
              <span>{userDisplay}</span>
            ) : (
              <FiUser className="w-4 h-4" />
            )}
          </div>
        </Link>

        {/* Page Title - Center */}
        <h1 className="text-lg font-semibold text-gray-900 text-center flex-1">
          {pageTitle}
        </h1>

        {/* Right Side - Empty for now but keeping space for future features */}
        <div className="w-8 h-8"></div>
      </div>
    </nav>
  );
} 