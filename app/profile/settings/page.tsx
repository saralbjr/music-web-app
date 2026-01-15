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

// Eye icon for showing password
const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

// Eye-off icon for hiding password
const EyeOffIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

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
  const [profileMessage, setProfileMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      setProfileMessage({ text: "You need to be logged in to update your profile.", type: "error" });
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
        setProfileMessage({ text: "Profile updated successfully.", type: "success" });
      } else {
        setProfileMessage({ text: data.error || "Failed to update profile.", type: "error" });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An error occurred while saving.";
      setProfileMessage({ text: message, type: "error" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    // Client-side validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ text: "New password and confirmation do not match.", type: "error" });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({ text: "Password must be at least 6 characters long.", type: "error" });
      return;
    }

    if (!passwordForm.currentPassword) {
      setPasswordMessage({ text: "Please enter your current password.", type: "error" });
      return;
    }

    setSavingPassword(true);
    setPasswordMessage(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setPasswordMessage({ text: "You need to be logged in to change password.", type: "error" });
      setSavingPassword(false);
      return;
    }

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPasswordMessage({ text: "Password updated successfully.", type: "success" });
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        // Reset visibility states
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      } else {
        setPasswordMessage({ text: data.error || "Failed to update password.", type: "error" });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An error occurred while updating password.";
      setPasswordMessage({ text: message, type: "error" });
    } finally {
      setSavingPassword(false);
    }
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
                <p className={`text-sm ${profileMessage.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                  {profileMessage.text}
                </p>
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
              <div className="relative mt-2">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-white transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                >
                  {showCurrentPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="text-sm text-white/60">New password</span>
              <div className="relative mt-2">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-white transition-colors"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="text-sm text-white/60">
                Confirm new password
              </span>
              <div className="relative mt-2">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-white transition-colors"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full py-3 rounded-full bg-white text-black font-semibold text-sm disabled:opacity-70"
            >
              {savingPassword ? "Updating..." : "Update password"}
            </button>
            {passwordMessage && (
              <p className={`text-sm text-center ${passwordMessage.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                {passwordMessage.text}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
