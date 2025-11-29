"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  isAdminAuthenticated,
  logoutAdmin,
  getAdminToken,
} from "@/lib/adminAuth";

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
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifyAdminAccess = async () => {
      // Don't check on login page
      if (pathname === "/admin/login") {
        setMounted(true);
        setChecking(false);
        return;
      }

      // First check localStorage
      if (!isAdminAuthenticated()) {
        router.push("/admin/login");
        setChecking(false);
        return;
      }

      // Then verify with backend
      try {
        const token = getAdminToken();
        if (!token) {
          router.push("/admin/login");
          setChecking(false);
          return;
        }

        const response = await fetch("/api/admin/verify", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!data.success || data.user?.role !== "admin") {
          // Clear admin auth if verification fails
          logoutAdmin();
          router.push("/admin/login");
          setChecking(false);
          return;
        }

        setIsAuthorized(true);
        setMounted(true);
      } catch (error) {
        console.error("Admin verification error:", error);
        logoutAdmin();
        router.push("/admin/login");
      } finally {
        setChecking(false);
      }
    };

    verifyAdminAccess();
  }, [pathname, router]);

  const handleLogout = () => {
    logoutAdmin();
    router.push("/admin/login");
  };

  if (!mounted || checking) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Don't show layout on login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // If not authorized, don't show anything (redirect is happening)
  if (!isAuthorized) {
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
                      ? "bg-blue-500 text-white"
                      : "text-gray-300 hover:text-white hover:bg-[#1a1a1a]"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/users"
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    pathname === "/admin/users"
                      ? "bg-blue-500 text-white"
                      : "text-gray-300 hover:text-white hover:bg-[#1a1a1a]"
                  }`}
                >
                  Users
                </Link>
                <Link
                  href="/admin/songs"
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    pathname === "/admin/songs"
                      ? "bg-blue-500 text-white"
                      : "text-gray-300 hover:text-white hover:bg-[#1a1a1a]"
                  }`}
                >
                  Songs
                </Link>
                <Link
                  href="/admin/playlists"
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    pathname === "/admin/playlists"
                      ? "bg-blue-500 text-white"
                      : "text-gray-300 hover:text-white hover:bg-[#1a1a1a]"
                  }`}
                >
                  Playlists
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
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
