"use client";
import { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../model/data/access/firebase';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../model/data/access/firebase';
import { User, Gender } from '../model/types';
import { DataService } from '../model/data/access/service';

async function getUserBio(firebaseUser: any) {
  const ref = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

async function ensureUserBio(firebaseUser: any, bio?: Partial<User>) {
  const ref = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      firstName: bio?.firstName || "",
      lastName: bio?.lastName || "",
      gender: bio?.gender || null,
      birthday: bio?.birthday || null,
      createdAt: new Date(),
    });
  } else if (bio) {
    await setDoc(ref, { ...snap.data(), ...bio }, { merge: true });
  }
}

function isBioIncomplete(bio: any) {
  return !bio || !bio.firstName || !bio.lastName;
}

function BioModal({ onSubmit }: { onSubmit: (bio: Partial<User>) => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<string>("");
  const [birthday, setBirthday] = useState("");
  const [error, setError] = useState("");
  const [genderOptions, setGenderOptions] = useState<Gender[]>([]);
  const [loadingGenders, setLoadingGenders] = useState(true);

  useEffect(() => {
    async function fetchGenders() {
      try {
        const genders = await DataService.getAllGenders();
        setGenderOptions(genders);
      } catch (error) {
        console.error('Failed to fetch genders:', error);
        // Fallback to basic options if fetch fails
        setGenderOptions([
          { value: "male", label: "Male" },
          { value: "female", label: "Female" },
          { value: "other", label: "Other" }
        ]);
      } finally {
        setLoadingGenders(false);
      }
    }
    fetchGenders();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter both first and last name.");
      return;
    }
    
    const selectedGender = genderOptions.find(g => g.value === gender);
    const bioData: Partial<User> = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender: selectedGender || undefined,
      birthday: birthday || undefined,
    };
    
    onSubmit(bioData);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-sm flex flex-col gap-4">
        <h2 className="text-lg font-bold mb-2 text-black">Complete Your Profile</h2>
        
        <div className="flex flex-col gap-2">
          <input
            className="border rounded px-3 py-2 text-black"
            placeholder="First Name *"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            required
          />
          <input
            className="border rounded px-3 py-2 text-black"
            placeholder="Last Name *"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-black">Gender</label>
          <select
            className="border rounded px-3 py-2 text-black"
            value={gender}
            onChange={e => setGender(e.target.value)}
            disabled={loadingGenders}
          >
            <option value="">
              {loadingGenders ? "Loading..." : "Select gender"}
            </option>
            {genderOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-black">Birthday</label>
          <input
            type="date"
            className="border rounded px-3 py-2 text-black"
            value={birthday}
            onChange={e => setBirthday(e.target.value)}
          />
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}
        
        <button 
          type="submit" 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Save Profile
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [showBioModal, setShowBioModal] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      if (auth.currentUser) {
        const bio = await getUserBio(auth.currentUser);
        if (isBioIncomplete(bio)) {
          setPendingUser(auth.currentUser);
          setShowBioModal(true);
          return;
        } else {
          await ensureUserBio(auth.currentUser); // still create if missing
        }
      }
      router.push('/');
    } catch (error) {
      console.error(error);
      alert('Login failed. Please try again.');
    }
  };

  const handleBioSubmit = async (bio: Partial<User>) => {
    if (pendingUser) {
      await ensureUserBio(pendingUser, bio);
      setShowBioModal(false);
      setPendingUser(null);
      router.push('/');
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
      {showBioModal && <BioModal onSubmit={handleBioSubmit} />}
    </div>
  );
} 