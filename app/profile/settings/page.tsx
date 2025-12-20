/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UserProfile {
  id: string;
  name: string;
  email?: string;
  image?: string;
  role?: "admin" | "user";
  createdAt?: string;
  updatedAt?: string;
}

interface ProfileFormState {
  name: string;
  image: string;
}

interface PasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfileSettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    name: "",
    image: "",
  });
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUser = localStorage.getItem("user");
    const parsed = storedUser ? JSON.parse(storedUser) : null;
    setUser(parsed);
    setProfileForm({
      name: parsed?.name || "",
      image: parsed?.image || "",
    });
  }, []);

  useEffect(() => {
    const loadProfileFromApi = async () => {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.success && data.data) {
          setUser(data.data);
          setProfileForm({
            name: data.data.name || "",
            image: data.data.image || "",
          });
          localStorage.setItem("user", JSON.stringify(data.data));
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      }
    };

    loadProfileFromApi();
  }, []);

  const handleProfileSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileMessage(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setProfileMessage("You need to be logged in to update your profile.");
      setSavingProfile(false);
      return;
    }

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileForm.name.trim() || user?.name || "",
          image: profileForm.image.trim(),
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const updatedUser = data.data;
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setProfileForm({
          name: updatedUser.name || "",
          image: updatedUser.image || "",
        });
        window.dispatchEvent(new Event("auth-change"));
        setProfileMessage("Profile updated successfully.");
      } else {
        setProfileMessage(data.error || "Failed to update profile.");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An error occurred while saving.";
      setProfileMessage(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage("New password and confirmation do not match.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage("Password must be at least 6 characters long.");
      return;
    }

    setSavingPassword(true);
    setPasswordMessage(null);

    const updatedUser = { ...user, password: passwordForm.newPassword };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    window.dispatchEvent(new Event("auth-change"));

    setSavingPassword(false);
    setPasswordMessage("Password updated successfully.");
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="px-8 py-10 space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-white/60">
            Settings
          </p>
          <h1 className="text-4xl font-black">Account</h1>
          <p className="text-white/60 mt-2">
            Update how you appear across SoundWave, just like on Spotify.
          </p>
        </div>
        <Link
          href="/profile"
          className="px-4 py-2 bg-white text-black rounded-full text-sm font-semibold hover:scale-105 transition-transform"
        >
          Back to profile
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#181818] rounded-3xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Profile details</h2>
              <p className="text-sm text-white/60">
                Control your display name and avatar.
              </p>
            </div>
          </div>
          <form className="space-y-6" onSubmit={handleProfileSubmit}>
            <div className="flex gap-4 items-center">
              <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center overflow-hidden text-2xl font-bold">
                {profileForm.image ? (
                  <img
                    src={profileForm.image}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  (profileForm.name || user?.name || "U")
                    .charAt(0)
                    .toUpperCase()
                )}
              </div>
              <div>
                <p className="text-sm text-white/60">Preview</p>
                <p className="text-lg font-semibold">
                  {profileForm.name || user?.name || "Username"}
                </p>
              </div>
            </div>

            <label className="block">
              <span className="text-sm text-white/60">Display name</span>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-colors"
                placeholder="Your public name"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm text-white/60">Profile image URL</span>
              <input
                type="url"
                value={profileForm.image}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, image: e.target.value }))
                }
                className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-colors"
                placeholder="https://"
              />
              <p className="text-xs text-white/40 mt-2">
                Paste a direct image link. We recommend square images at least
                320x320.
              </p>
            </label>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2 rounded-full bg-white text-black font-semibold text-sm disabled:opacity-70"
              >
                {savingProfile ? "Saving..." : "Save changes"}
              </button>
              {profileMessage && (
                <p className="text-sm text-emerald-400">{profileMessage}</p>
              )}
            </div>
          </form>
        </div>

        <div className="bg-[#181818] rounded-3xl p-6 border border-white/5">
          <h2 className="text-2xl font-bold mb-4">Security</h2>
          <p className="text-sm text-white/60 mb-6">
            Update your password to keep your account secure.
          </p>

          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            <label className="block">
              <span className="text-sm text-white/60">Current password</span>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
                className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-colors"
                placeholder="••••••••"
              />
            </label>

            <label className="block">
              <span className="text-sm text-white/60">New password</span>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-colors"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </label>

            <label className="block">
              <span className="text-sm text-white/60">
                Confirm new password
              </span>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-colors"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </label>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full py-3 rounded-full bg-white text-black font-semibold text-sm disabled:opacity-70"
            >
              {savingPassword ? "Updating..." : "Update password"}
            </button>
            {passwordMessage && (
              <p className="text-sm text-center text-emerald-400">
                {passwordMessage}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
