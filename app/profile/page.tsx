'use client';
import AdminPanel from './AdminPanel';
import { useEffect, useState } from 'react';
import { DataService } from '../model/data/access/service';
import type { User } from '../model/types';
import { useUser } from '../model/auth/UserContext';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '../model/data/access/firebase';

export default function ProfilePage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const isAdmin = true; // TODO: Replace with real admin check

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile</h1>
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Bio</h2>
          <div className="space-y-1 text-gray-700">
            <div><span className="font-medium">Name:</span> {user.firstName} {user.lastName}</div>
            <div><span className="font-medium">Email:</span> {user.email}</div>
            <div><span className="font-medium">Gender:</span> {user.gender?.label || user.gender?.value || 'Not specified'}</div>
            <div><span className="font-medium">Birthday:</span> {user.birthday || 'Not specified'}</div>
          </div>
        </div>
        
        <div className="mb-8">
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
        
        {isAdmin && <AdminPanel />}
      </div>
    </div>
  );
} 