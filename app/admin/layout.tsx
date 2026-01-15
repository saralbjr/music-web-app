"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { logoutAdmin, getAdminToken } from "@/lib/adminAuth";

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
  const [adminUser, setAdminUser] = useState<{
    id: string;
    email: string;
    name?: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    const verifyAdminAccess = async () => {
      // Don't check on login page - session is cleared there on mount
      if (pathname === "/admin/login") {
        setMounted(true);
        setChecking(false);
        return;
      }

      // Always require login - check if token exists
      const token = getAdminToken();
      if (!token) {
        logoutAdmin();
        router.push("/admin/login");
        setChecking(false);
        return;
      }

      // Verify with backend
      try {
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

        // Store admin user info for display
        setAdminUser(data.user);
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

  // Get admin initials for avatar
  const getInitials = (user: { name?: string; email: string } | null) => {
    if (!user) return "A";
    if (user.name) {
      const names = user.name.split(" ");
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  if (!mounted || checking) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#282828] border-t-[#1d4ed8] rounded-full animate-spin"></div>
          <div className="h-4 w-32 bg-[#282828] rounded animate-pulse"></div>
        </div>
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
    <div className="min-h-screen bg-[#000000] flex">
      {/* Modern Sidebar */}
      <aside className="w-64 bg-[#121212] border-r border-[#282828] flex-shrink-0 sticky top-0 h-screen overflow-y-auto flex flex-col">
        <div className="p-6 flex-1">
          <Link href="/admin" className="block mb-8">
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          </Link>

          <nav className="space-y-2">
            <Link
              href="/admin"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                pathname === "/admin"
                  ? "bg-[#1d4ed8] text-white shadow-lg shadow-[#1d4ed8]/20"
                  : "text-gray-300 hover:text-white hover:bg-[#1a1a1a]"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span>Dashboard</span>
            </Link>

            <Link
              href="/admin/users"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                pathname === "/admin/users"
                  ? "bg-[#1d4ed8] text-white shadow-lg shadow-[#1d4ed8]/20"
                  : "text-gray-300 hover:text-white hover:bg-[#1a1a1a]"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span>Users</span>
            </Link>

            <Link
              href="/admin/songs"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                pathname === "/admin/songs"
                  ? "bg-[#1d4ed8] text-white shadow-lg shadow-[#1d4ed8]/20"
                  : "text-gray-300 hover:text-white hover:bg-[#1a1a1a]"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
              <span>Songs</span>
            </Link>

            <Link
              href="/admin/playlists"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                pathname === "/admin/playlists"
                  ? "bg-[#1d4ed8] text-white shadow-lg shadow-[#1d4ed8]/20"
                  : "text-gray-300 hover:text-white hover:bg-[#1a1a1a]"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              <span>Playlists</span>
            </Link>

            <Link
              href="/admin/upload"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                pathname === "/admin/upload"
                  ? "bg-[#1d4ed8] text-white shadow-lg shadow-[#1d4ed8]/20"
                  : "text-gray-300 hover:text-white hover:bg-[#1a1a1a]"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span>Upload</span>
            </Link>
          </nav>
        </div>

        {/* Admin User Section at Bottom */}
        {adminUser && (
          <div className="mt-auto p-6 border-t border-[#282828] bg-[#121212] sticky bottom-0">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1d4ed8] to-[#1ed760] flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                {getInitials(adminUser)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {adminUser.name || adminUser.email}
                </p>
                <p className="text-gray-400 text-xs truncate">
                  {adminUser.role}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Link
                href="/"
                className="flex-1 px-3 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition text-center"
              >
                Go to Site
              </Link>
              <button
                onClick={handleLogout}
                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-[#121212] border-b border-[#282828] sticky top-0 z-40 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white capitalize">
              {pathname === "/admin"
                ? "Dashboard"
                : pathname.split("/").pop()?.replace("-", " ") || "Admin"}
            </h2>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#000000]">
          <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
