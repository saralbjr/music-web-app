"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated, logoutAdmin } from "@/lib/adminAuth";

/**
 * Admin Layout
 * Protects admin routes and provides navigation
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (pathname !== "/admin/login" && !isAdminAuthenticated()) {
      router.push("/admin/login");
    }
  }, [pathname, router]);

  const handleLogout = () => {
    logoutAdmin();
    router.push("/admin/login");
  };

  if (!mounted) {
    return null;
  }

  // Don't show layout on login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!isAdminAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#000000]">
      {/* Admin Header */}
      <header className="bg-[#121212] border-b border-[#282828] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/admin" className="text-xl font-bold text-white">
                Admin Panel
              </Link>
              <nav className="flex space-x-4">
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    pathname === "/admin"
                      ? "bg-green-500 text-white"
                      : "text-gray-300 hover:text-white hover:bg-[#1a1a1a]"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/users"
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    pathname === "/admin/users"
                      ? "bg-green-500 text-white"
                      : "text-gray-300 hover:text-white hover:bg-[#1a1a1a]"
                  }`}
                >
                  Users
                </Link>
                <Link
                  href="/admin/songs"
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    pathname === "/admin/songs"
                      ? "bg-green-500 text-white"
                      : "text-gray-300 hover:text-white hover:bg-[#1a1a1a]"
                  }`}
                >
                  Songs
                </Link>
                <Link
                  href="/admin/playlists"
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    pathname === "/admin/playlists"
                      ? "bg-green-500 text-white"
                      : "text-gray-300 hover:text-white hover:bg-[#1a1a1a]"
                  }`}
                >
                  Playlists
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-300 hover:text-white text-sm transition"
              >
                View Site
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

