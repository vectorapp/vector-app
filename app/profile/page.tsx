'use client';
import AdminPanel from './AdminPanel';
import { useEffect, useState } from 'react';
import { DataService } from '../model/data/access/service';
import type { User } from '../model/types';

const CURRENT_USER_ID = 'o5NeITfIMwSQhhyV28HQ';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = true; // TODO: Replace with real admin check

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      try {
        const user = await DataService.getUserById(CURRENT_USER_ID);
        setUser(user);
      } catch (error) {
        setUser(null);
      }
      setLoading(false);
    }
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile</h1>
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Bio</h2>
          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : user ? (
            <div className="space-y-1 text-gray-700">
              <div><span className="font-medium">Name:</span> {user.firstName} {user.lastName}</div>
              <div><span className="font-medium">Email:</span> {user.email}</div>
              <div><span className="font-medium">Gender:</span> {user.gender?.label || user.gender?.value || ''}</div>
              <div><span className="font-medium">Birthday:</span> {user.birthday}</div>
            </div>
          ) : (
            <div className="text-red-600">User not found.</div>
          )}
        </div>
        {isAdmin && <AdminPanel />}
      </div>
    </div>
  );
} 