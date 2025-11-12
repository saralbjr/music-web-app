/**
 * Admin Authentication Utilities
 * Helper functions for admin authentication in the frontend
 */

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("adminToken");
}

export function getAdminUser(): {
  id: string;
  email: string;
  role: string;
} | null {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("adminUser");
  return user ? JSON.parse(user) : null;
}

export function isAdminAuthenticated(): boolean {
  const token = getAdminToken();
  const user = getAdminUser();
  return !!(token && user && user.role === "admin");
}

export function logoutAdmin(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
}

export function getAuthHeaders(): HeadersInit {
  const token = getAdminToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
