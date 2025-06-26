"use client";
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../model/data/access/firebase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // Redirect to main app after login
      router.push('/');
    } catch (error) {
      console.error(error);
      alert('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-sm flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Sign in to Scalar</h1>
        <button
          onClick={handleLogin}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors w-full"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
} 