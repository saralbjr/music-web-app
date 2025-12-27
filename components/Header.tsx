'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Header Component
 * Navigation header with login/logout functionality
 */
export default function Header() {
  interface User {
    id: string;
    name: string;
    email: string;
  }
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in (stored in localStorage)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  return (
    <header className="bg-gray-900 text-white border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" />
            </svg>
            <span className="text-xl font-bold">Music Player</span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link href="/" className="hover:text-blue-500 transition">
              Home
            </Link>
            {user && (
              <>
                <Link href="/playlists" className="hover:text-blue-500 transition">
                  Playlists
                </Link>
                <Link href="/admin/upload" className="hover:text-blue-500 transition">
                  Upload
                </Link>
              </>
            )}
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">Welcome, {user.name}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

