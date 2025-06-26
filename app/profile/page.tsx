import AdminPanel from './AdminPanel';

export default function ProfilePage() {
  const isAdmin = true; // TODO: Replace with real admin check
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 pb-20">
      <div className="bg-white rounded-lg shadow p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600 mb-8">Your profile and settings will appear here.</p>
      </div>
      {isAdmin && <AdminPanel />}
    </div>
  );
} 