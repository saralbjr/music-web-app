"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ISong } from "@/models/Song";

/**
 * Spotify-style Topbar Component
 * Search bar and user info at the top
 */
export default function Topbar() {
  const router = useRouter();
  interface User {
    id: string;
    name: string;
    email: string;
    role?: string;
    image?: string;
  }
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<ISong[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const syncUser = () => {
      const storedUser = localStorage.getItem("user");
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };

    syncUser();
    window.addEventListener("storage", syncUser);
    window.addEventListener("auth-change", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("auth-change", syncUser);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };

    if (menuOpen || showSearchResults) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen, showSearchResults]);

  useEffect(() => {
    if (!user) {
      setMenuOpen(false);
    }
  }, [user]);

  const isAdmin = user?.role === "admin";

  // Debounced search function
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchQuery.trim().length > 0) {
      setSearchLoading(true);
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const response = await fetch(
            `/api/songs?search=${encodeURIComponent(searchQuery)}&limit=6`
          );
          const data = await response.json();
          if (data.success && data.data) {
            setSearchResults(data.data);
            setShowSearchResults(true);
          } else {
            setSearchResults([]);
            setShowSearchResults(true);
          }
        } catch (error) {
          console.error("Error searching:", error);
          setSearchResults([]);
          setShowSearchResults(true);
        } finally {
          setSearchLoading(false);
        }
      }, 300); // 300ms debounce
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
      setSearchLoading(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchResults(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleResultClick = () => {
    setShowSearchResults(false);
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleInputFocus = () => {
    if (searchResults.length > 0 || searchQuery.trim().length > 0) {
      setShowSearchResults(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminToken");
    setUser(null);
    setMenuOpen(false);
    window.dispatchEvent(new Event("auth-change"));
    router.push("/");
    router.refresh();
  };

  return (
    <div className="h-16 bg-[#121212] border-b border-[#282828] flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search Bar */}
      <div className="flex-1 max-w-2xl mx-8" ref={searchRef}>
        <form onSubmit={handleSearch} className="relative group">
          <div className="relative">
            <input
              type="text"
              placeholder="What do you want to listen to?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleInputFocus}
              className="w-full bg-[#2a2a2a] text-white px-14 py-3 pl-14 pr-12 rounded-full text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:bg-[#333] transition-all duration-200 hover:bg-[#2f2f2f] border border-transparent focus:border-white/20"
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
              {searchLoading ? (
                <svg
                  className="w-5 h-5 text-gray-400 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-gray-400 group-focus-within:text-white transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              )}
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setShowSearchResults(false);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-[#404040]"
                aria-label="Clear search"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          {/* Subtle glow effect on focus */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-focus-within:from-blue-500/10 group-focus-within:via-purple-500/10 group-focus-within:to-pink-500/10 blur-xl -z-10 transition-all duration-300"></div>

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#282828] rounded-lg shadow-2xl border border-[#404040] max-h-[500px] overflow-y-auto z-50">
              {searchLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-gray-400 text-sm mt-2">Searching...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="p-2">
                    {searchResults.map((song) => (
                      <button
                        key={String(song._id)}
                        onClick={() => handleResultClick()}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#3a3a3a] transition-colors text-left group"
                      >
                        {song.coverFile ? (
                          <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={song.coverFile}
                              alt={song.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-[#404040] flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-6 h-6 text-gray-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate group-hover:text-blue-400 transition-colors">
                            {song.title}
                          </p>
                          <p className="text-gray-400 text-sm truncate">
                            {song.artist}
                          </p>
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    ))}
                  </div>
                  {searchQuery.trim() && (
                    <div className="border-t border-[#404040] p-2">
                      <button
                        onClick={() => {
                          setShowSearchResults(false);
                          router.push(
                            `/search?q=${encodeURIComponent(searchQuery)}`
                          );
                        }}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-lg hover:bg-[#3a3a3a] transition-colors text-white font-semibold"
                      >
                        <span>
                          Show all results for &quot;{searchQuery}&quot;
                        </span>
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
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              ) : searchQuery.trim().length > 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-400">No results found</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Try searching with different keywords
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </form>
      </div>

      {/* User Menu */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            {isAdmin && (
              <Link
                href="/admin/upload"
                className="text-gray-400 hover:text-white transition-colors text-sm font-semibold"
              >
                Upload
              </Link>
            )}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-3 bg-[#181818] px-3 py-1.5 rounded-full hover:bg-[#282828] transition-colors"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center">
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.image}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-white text-sm font-bold">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                  )}
                </div>
                <span className="text-white text-sm font-semibold">
                  {user.name}
                </span>
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg bg-[#282828] border border-[#3e3e3e] shadow-lg py-2 z-40">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-white hover:bg-[#181818] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/profile/settings"
                    className="block px-4 py-2 text-sm text-white hover:bg-[#181818] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Account settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#181818] transition-colors"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link
            href="/auth/login"
            className="px-4 py-2 bg-white text-black rounded-full text-sm font-semibold hover:scale-105 transition-transform"
          >
            Log in
          </Link>
        )}
      </div>
    </div>
  );
}
