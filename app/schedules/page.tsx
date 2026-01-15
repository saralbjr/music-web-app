/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Schedules Page
 *
 * Allows users to create and manage time-based music schedules
 *
 * Computer Science Concepts:
 * - Scheduling Algorithms: Priority and Time-Based Scheduling
 * - User Interface for Algorithm Configuration
 */
export default function SchedulesPage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    startTime: "06:00",
    endTime: "08:00",
    daysOfWeek: [] as number[],
    type: "mood" as "playlist" | "mood",
    playlistId: "",
    mood: "Happy",
    priority: 1,
    isActive: true,
  });
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [currentSchedule, setCurrentSchedule] = useState<any>(null);

  const days = [
    { label: "Sun", value: 0 },
    { label: "Mon", value: 1 },
    { label: "Tue", value: 2 },
    { label: "Wed", value: 3 },
    { label: "Thu", value: 4 },
    { label: "Fri", value: 5 },
    { label: "Sat", value: 6 },
  ];

  const moods = ["Happy", "Sad", "Relaxed", "Focused"];

  useEffect(() => {
    checkAuth();
    fetchSchedules();
    fetchPlaylists();
    fetchCurrentSchedule();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
    }
  };

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/schedules", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSchedules(data.data || []);
        }
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      if (!user) return;

      const userData = JSON.parse(user);
      const response = await fetch(`/api/playlists?userId=${userData.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPlaylists(data.data || []);
        }
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
  };

  const fetchCurrentSchedule = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/schedules/current", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setCurrentSchedule(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching current schedule:", error);
    }
  };

  const handleDayToggle = (dayValue: number) => {
    setFormData((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(dayValue)
        ? prev.daysOfWeek.filter((d) => d !== dayValue)
        : [...prev.daysOfWeek, dayValue],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.daysOfWeek.length === 0) {
      alert("Please select at least one day");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const payload = {
        name: formData.name,
        timeRange: {
          start: formData.startTime,
          end: formData.endTime,
        },
        daysOfWeek: formData.daysOfWeek,
        type: formData.type,
        playlistId:
          formData.type === "playlist" ? formData.playlistId : undefined,
        mood: formData.type === "mood" ? formData.mood : undefined,
        priority: formData.priority,
        isActive: formData.isActive,
      };

      const url = editingSchedule
        ? `/api/schedules/${editingSchedule._id}`
        : "/api/schedules";
      const method = editingSchedule ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingSchedule(null);
        setFormData({
          name: "",
          startTime: "06:00",
          endTime: "08:00",
          daysOfWeek: [],
          type: "mood",
          playlistId: "",
          mood: "Happy",
          priority: 1,
          isActive: true,
        });
        fetchSchedules();
        fetchCurrentSchedule();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to save schedule");
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
      alert("Failed to save schedule");
    }
  };

  const handleEdit = (schedule: any) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      startTime: schedule.timeRange.start,
      endTime: schedule.timeRange.end,
      daysOfWeek: schedule.daysOfWeek,
      type: schedule.type,
      playlistId: schedule.playlistId?._id || "",
      mood: schedule.mood || "Happy",
      priority: schedule.priority,
      isActive: schedule.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/schedules/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchSchedules();
        fetchCurrentSchedule();
      }
    } catch (error) {
      console.error("Error deleting schedule:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#282828] rounded w-64"></div>
          <div className="h-48 bg-[#282828] rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 pb-32">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Music Schedules</h1>
          <p className="text-gray-400">
            Schedule playlists or moods for specific times using Priority
            Scheduling
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingSchedule(null);
            setFormData({
              name: "",
              startTime: "06:00",
              endTime: "08:00",
              daysOfWeek: [],
              type: "mood",
              playlistId: "",
              mood: "Happy",
              priority: 1,
              isActive: true,
            });
          }}
          className="px-6 py-3 bg-white text-black rounded-full font-medium hover:scale-105 transition-transform"
        >
          + Create Schedule
        </button>
      </div>

      {/* Current Active Schedule */}
      {currentSchedule && (
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100 mb-1">Currently Active</p>
              <h3 className="text-xl font-bold">{currentSchedule.name}</h3>
              <p className="text-sm text-blue-100 mt-1">
                {currentSchedule.timeRange.start} -{" "}
                {currentSchedule.timeRange.end}
                {currentSchedule.type === "mood" &&
                  ` • ${currentSchedule.mood} Mood`}
              </p>
            </div>
            <div className="text-4xl">🎵</div>
          </div>
        </div>
      )}

      {/* Schedule Form */}
      {showForm && (
        <div className="mb-8 p-6 bg-[#181818] rounded-lg border border-[#282828]">
          <h2 className="text-xl font-bold mb-4">
            {editingSchedule ? "Edit Schedule" : "Create New Schedule"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 bg-[#282828] rounded text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-[#282828] rounded text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-[#282828] rounded text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Days of Week
              </label>
              <div className="flex gap-2 flex-wrap">
                {days.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleDayToggle(day.value)}
                    className={`px-4 py-2 rounded ${
                      formData.daysOfWeek.includes(day.value)
                        ? "bg-white text-black"
                        : "bg-[#282828] text-gray-300"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as "playlist" | "mood",
                  })
                }
                className="w-full px-4 py-2 bg-[#282828] rounded text-white"
              >
                <option value="mood">Mood</option>
                <option value="playlist">Playlist</option>
              </select>
            </div>

            {formData.type === "mood" ? (
              <div>
                <label className="block text-sm font-medium mb-2">Mood</label>
                <select
                  value={formData.mood}
                  onChange={(e) =>
                    setFormData({ ...formData, mood: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-[#282828] rounded text-white"
                >
                  {moods.map((mood) => (
                    <option key={mood} value={mood}>
                      {mood}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Playlist
                </label>
                <select
                  value={formData.playlistId}
                  onChange={(e) =>
                    setFormData({ ...formData, playlistId: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-[#282828] rounded text-white"
                  required={formData.type === "playlist"}
                >
                  <option value="">Select a playlist</option>
                  {playlists.map((playlist) => (
                    <option key={playlist._id} value={playlist._id}>
                      {playlist.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Priority (Higher = More Important)
              </label>
              <input
                type="number"
                min="1"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-4 py-2 bg-[#282828] rounded text-white"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm">
                Active
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-white text-black rounded-full font-medium"
              >
                {editingSchedule ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingSchedule(null);
                }}
                className="px-6 py-2 bg-[#282828] text-white rounded-full font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedules List */}
      <div className="space-y-4">
        {schedules.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg mb-2">No schedules yet</p>
            <p className="text-sm">Create your first schedule to get started</p>
          </div>
        ) : (
          schedules.map((schedule) => (
            <div
              key={schedule._id}
              className="p-6 bg-[#181818] rounded-lg border border-[#282828]"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold">{schedule.name}</h3>
                    {!schedule.isActive && (
                      <span className="px-2 py-1 text-xs bg-gray-700 rounded">
                        Inactive
                      </span>
                    )}
                    <span className="px-2 py-1 text-xs bg-blue-600 rounded">
                      Priority: {schedule.priority}
                    </span>
                  </div>
                  <p className="text-gray-400 mb-2">
                    {schedule.timeRange.start} - {schedule.timeRange.end}
                  </p>
                  <p className="text-sm text-gray-500">
                    Days:{" "}
                    {schedule.daysOfWeek
                      .map(
                        (d: number) =>
                          days.find((day) => day.value === d)?.label
                      )
                      .join(", ")}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Type:{" "}
                    {schedule.type === "mood"
                      ? `Mood: ${schedule.mood}`
                      : "Playlist"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(schedule)}
                    className="px-4 py-2 bg-[#282828] text-white rounded hover:bg-[#383838]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(schedule._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
