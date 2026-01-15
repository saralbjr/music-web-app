"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ISong } from "@/models/Song";

/**
 * Glassmorphism Topbar Component
 * Premium search bar and user info with glass effects
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
      }, 300);
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
    <div className="h-16 bg-[#0a0a0f]/70 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Subtle gradient line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

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
              className="w-full bg-white/[0.06] text-white px-14 py-3 pl-14 pr-12 rounded-full text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/[0.08] transition-all duration-300 hover:bg-white/[0.08] border border-white/[0.08] focus:border-blue-500/30 backdrop-blur-sm"
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
              {searchLoading ? (
                <svg
                  className="w-5 h-5 text-blue-400 animate-spin"
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
                  className="w-5 h-5 text-white/40 group-focus-within:text-blue-400 transition-colors duration-200"
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
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10"
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

          {/* Glow effect on focus */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/0 via-cyan-500/0 to-sky-500/0 group-focus-within:from-blue-500/10 group-focus-within:via-cyan-500/10 group-focus-within:to-sky-500/10 blur-xl -z-10 transition-all duration-500"></div>

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-[#12121a]/95 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/50 border border-white/[0.08] max-h-[500px] overflow-hidden z-50 animate-fade-in-down">
              {searchLoading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-white/50 text-sm mt-3">Searching...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="p-2">
                    {searchResults.map((song, index) => (
                      <button
                        key={String(song._id)}
                        onClick={() => handleResultClick()}
                        className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.06] transition-all duration-200 text-left group"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {song.coverFile ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-white/10 group-hover:ring-blue-500/30 transition-all">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={song.coverFile}
                              alt={song.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0 ring-1 ring-white/10">
                            <svg
                              className="w-5 h-5 text-white/30"
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
                          <p className="text-white font-medium truncate group-hover:text-blue-300 transition-colors">
                            {song.title}
                          </p>
                          <p className="text-white/50 text-sm truncate">
                            {song.artist}
                          </p>
                        </div>
                        <svg
                          className="w-5 h-5 text-white/20 opacity-0 group-hover:opacity-100 group-hover:text-blue-400 transition-all transform group-hover:translate-x-1"
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
                    <div className="border-t border-white/[0.06] p-2">
                      <button
                        onClick={() => {
                          setShowSearchResults(false);
                          router.push(
                            `/search?q=${encodeURIComponent(searchQuery)}`
                          );
                        }}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl hover:bg-white/[0.06] transition-all text-white font-medium group"
                      >
                        <span className="text-blue-400">
                          Show all results for &quot;{searchQuery}&quot;
                        </span>
                        <svg
                          className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform"
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
                <div className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-white/60 font-medium">No results found</p>
                  <p className="text-white/40 text-sm mt-1">
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
                className="text-white/50 hover:text-white transition-colors text-sm font-medium px-4 py-2 rounded-full hover:bg-white/[0.06]"
              >
                Upload
              </Link>
            )}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-3 bg-white/[0.06] hover:bg-white/[0.1] px-3 py-1.5 rounded-full transition-all duration-200 border border-white/[0.06] hover:border-white/[0.1] group"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center ring-2 ring-white/10 group-hover:ring-blue-500/30 transition-all">
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
                <span className="text-white text-sm font-medium">
                  {user.name}
                </span>
                <svg
                  className={`w-4 h-4 text-white/50 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
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
                <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-[#12121a]/95 backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/50 py-2 z-40 animate-fade-in-down overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    <p className="text-xs text-white/40 truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/[0.06] transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile
                    </Link>
                    <Link
                      href="/profile/settings"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/[0.06] transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </Link>
                  </div>
                  <div className="border-t border-white/[0.06] py-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link
            href="/auth/login"
            className="group relative px-5 py-2.5 rounded-full text-sm font-semibold overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 transition-transform group-hover:scale-105" />
            <span className="relative text-white">Log in</span>
          </Link>
        )}
      </div>
    </div>
  );
}
