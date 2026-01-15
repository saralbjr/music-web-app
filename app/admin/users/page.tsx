/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { getAuthHeaders } from "@/lib/adminAuth";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  createdAt: string;
  image?: string;
}

/**
 * Admin Users Management Page
 */
export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as "admin" | "user",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const offset = (currentPage - 1) * limit;
      let url = `/api/admin/users?limit=${limit}&offset=${offset}`;

      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.success) {
        // Filter by role on client side if needed
        let filteredUsers = data.data;
        if (roleFilter !== "all") {
          filteredUsers = data.data.filter(
            (user: User) => user.role === roleFilter
          );
        }
        setUsers(filteredUsers);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = getAuthHeaders();
      const url = editingUser
        ? `/api/admin/users/${editingUser._id}`
        : "/api/admin/users";
      const method = editingUser ? "PUT" : "POST";

      const body: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };
      if (formData.password) {
        body.password = formData.password;
      }

      const res = await fetch(url, {
        method,
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setEditingUser(null);
        setFormData({ name: "", email: "", password: "", role: "user" });
        fetchUsers();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const getInitials = (name: string) => {
    const names = name.split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  const totalPages = Math.ceil(total / limit);

  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div>
            <div className="h-9 w-64 bg-[#282828] rounded animate-pulse mb-2"></div>
            <div className="h-5 w-48 bg-[#282828] rounded animate-pulse"></div>
          </div>
          <div className="h-12 w-32 bg-[#282828] rounded-lg animate-pulse"></div>
        </div>

        {/* Search and Filters Skeleton */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl p-6 border border-[#282828] shadow-lg animate-pulse">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 h-12 bg-[#282828] rounded-lg"></div>
            <div className="flex gap-4">
              <div className="h-12 w-20 bg-[#282828] rounded-lg"></div>
              <div className="h-12 w-20 bg-[#282828] rounded-lg"></div>
              <div className="h-12 w-20 bg-[#282828] rounded-lg"></div>
            </div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl border border-[#282828] shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#121212] sticky top-0 z-10 border-b border-[#282828]">
                <tr>
                  {[...Array(5)].map((_, idx) => (
                    <th key={idx} className="px-6 py-4">
                      <div className="h-4 w-24 bg-[#282828] rounded animate-pulse"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#282828]">
                {[...Array(5)].map((_, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-[#1a1a1a]">
                    {[...Array(5)].map((_, colIdx) => (
                      <td key={colIdx} className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {colIdx === 0 && (
                            <div className="w-10 h-10 rounded-full bg-[#282828] animate-pulse"></div>
                          )}
                          <div className="h-4 w-32 bg-[#282828] rounded animate-pulse"></div>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Users Management</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage all users in the system
          </p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({ name: "", email: "", password: "", role: "user" });
            setShowModal(true);
          }}
          className="px-6 py-3 bg-[#1d4ed8] hover:bg-[#1ed760] text-white rounded-lg font-medium transition-all shadow-lg shadow-[#1d4ed8]/20 hover:shadow-[#1d4ed8]/30"
        >
          + Add User
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl p-6 border border-[#282828] shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 bg-[#000000] border border-[#282828] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#1d4ed8] transition-colors"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setRoleFilter("all");
                setCurrentPage(1);
              }}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                roleFilter === "all"
                  ? "bg-[#1d4ed8] text-white shadow-lg shadow-[#1d4ed8]/20"
                  : "bg-[#1a1a1a] text-gray-300 hover:bg-[#282828] hover:text-white border border-[#282828]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setRoleFilter("admin");
                setCurrentPage(1);
              }}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                roleFilter === "admin"
                  ? "bg-[#1d4ed8] text-white shadow-lg shadow-[#1d4ed8]/20"
                  : "bg-[#1a1a1a] text-gray-300 hover:bg-[#282828] hover:text-white border border-[#282828]"
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => {
                setRoleFilter("user");
                setCurrentPage(1);
              }}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                roleFilter === "user"
                  ? "bg-[#1d4ed8] text-white shadow-lg shadow-[#1d4ed8]/20"
                  : "bg-[#1a1a1a] text-gray-300 hover:bg-[#282828] hover:text-white border border-[#282828]"
              }`}
            >
              User
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl border border-[#282828] shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#121212] sticky top-0 z-10 border-b border-[#282828]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#282828]">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-gray-400">No users found</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-[#1a1a1a] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1d4ed8] to-[#1ed760] flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                            {getInitials(user.name)}
                          </div>
                        )}
                        <span className="text-white font-medium">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{user.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                            : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm font-medium transition-all border border-blue-600/30"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-all border border-red-600/30"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[#282828] bg-[#121212] flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {(currentPage - 1) * limit + 1} to{" "}
              {Math.min(currentPage * limit, total)} of {total} users
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#282828] text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-[#282828]"
              >
                Previous
              </button>
              <span className="text-gray-400 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#282828] text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-[#282828]"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl p-6 w-full max-w-md border border-[#282828] shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingUser ? "Edit User" : "Add User"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 bg-[#000000] border border-[#282828] rounded-lg text-white focus:outline-none focus:border-[#1d4ed8] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 bg-[#000000] border border-[#282828] rounded-lg text-white focus:outline-none focus:border-[#1d4ed8] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password {editingUser && "(leave empty to keep current)"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!editingUser}
                  className="w-full px-4 py-3 bg-[#000000] border border-[#282828] rounded-lg text-white focus:outline-none focus:border-[#1d4ed8] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as "admin" | "user",
                    })
                  }
                  className="w-full px-4 py-3 bg-[#000000] border border-[#282828] rounded-lg text-white focus:outline-none focus:border-[#1d4ed8] transition-colors"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-[#1d4ed8] hover:bg-[#1ed760] text-white rounded-lg font-medium transition-all shadow-lg shadow-[#1d4ed8]/20"
                >
                  {editingUser ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 px-4 py-3 bg-[#1a1a1a] hover:bg-[#282828] text-white rounded-lg font-medium transition-all border border-[#282828]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
