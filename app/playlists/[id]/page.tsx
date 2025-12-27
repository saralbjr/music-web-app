"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ISong } from "@/models/Song";
import { useAudioStore } from "@/lib/store/audioStore";
import { fisherYatesShuffle } from "@/lib/algorithms/shuffle";
import { mergeSort } from "@/lib/algorithms/mergeSort";
import { useToast } from "@/components/ToastProvider";

interface PlaylistWithSongs {
  _id: string;
  name: string;
  songs: ISong[];
  coverUrl?: string;
}

type PlaylistSortOption = "added" | "title" | "artist" | "duration";

/**
 * Spotify-style Playlist Detail Page
 * Big header with blurred background, table-like song list
 */
export default function PlaylistPage() {
  const params = useParams();
  const router = useRouter();
  const { setCurrentSong, currentSong, isPlaying } = useAudioStore();
  const [playlist, setPlaylist] = useState<PlaylistWithSongs | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerName, setOwnerName] = useState<string>("You");
  const [manageModal, setManageModal] = useState<
    "rename" | "delete" | "addSongs" | null
  >(null);
  const [formName, setFormName] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [catalogSongs, setCatalogSongs] = useState<ISong[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [songSearch, setSongSearch] = useState("");
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [formCover, setFormCover] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [showSongMenuId, setShowSongMenuId] = useState<string | null>(null);
  const [menuPlaylists, setMenuPlaylists] = useState<PlaylistWithSongs[]>([]);
  const [menuPlaylistsLoaded, setMenuPlaylistsLoaded] = useState(false);
  const [favoriteSongIds, setFavoriteSongIds] = useState<Set<string>>(
    () => new Set()
  );
  const [sortOption, setSortOption] = useState<PlaylistSortOption>("added");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchPlaylist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const ensureSongId = (value: unknown): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (typeof value === "object" && "toString" in value) {
      return String(value as { toString(): string });
    }
    return "";
  };

  const notifyPlaylistUpdate = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("playlist-update"));
    }
  };

  const getAuth = () => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!storedUser || !token) {
      router.replace("/auth/login");
      return null;
    }
    const parsedUser = JSON.parse(storedUser);
    if (!parsedUser.id) {
      router.replace("/auth/login");
      return null;
    }
    return { user: parsedUser, token };
  };

  const fetchPlaylist = async () => {
    try {
      const auth = getAuth();
      if (!auth) {
        setLoading(false);
        return;
      }
      setOwnerName(auth.user.name || "You");

      const response = await fetch(`/api/playlists?userId=${auth.user.id}`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        const foundPlaylist = data.data.find(
          (p: PlaylistWithSongs) => p._id === params.id
        );
        if (foundPlaylist) {
          setPlaylist(foundPlaylist);
        }
      }
    } catch (error) {
      console.error("Error fetching playlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const auth = getAuth();
      if (!auth) return;
      const res = await fetch("/api/songs/like", {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const ids = new Set<string>();
        data.data.forEach((song: ISong) => {
          ids.add(ensureSongId(song._id));
        });
        setFavoriteSongIds(ids);
      }
    } catch (error) {
      console.error("Error fetching favorites for playlist page:", error);
    }
  };

  const handlePlayAll = () => {
    if (playlist && playlist.songs.length > 0) {
      setCurrentSong(playlist.songs[0], playlist.songs);
    }
  };

  const handleShuffle = () => {
    if (playlist && playlist.songs.length > 0) {
      const shuffled = fisherYatesShuffle([...playlist.songs]);
      setCurrentSong(shuffled[0], shuffled);
    }
  };

  const handleSongClick = (song: ISong) => {
    if (playlist) {
      setCurrentSong(song, playlist.songs);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const totalRuntime = useMemo(() => {
    if (!playlist) return 0;
    return playlist.songs.reduce((acc, song) => acc + (song.duration || 0), 0);
  }, [playlist]);

  const playlistSongIds = useMemo(() => {
    if (!playlist) return [];
    return playlist.songs.map((song) => ensureSongId(song._id));
  }, [playlist]);

  const playlistSongIdSet = useMemo(() => {
    return new Set(playlistSongIds);
  }, [playlistSongIds]);

  const filteredCatalog = useMemo(() => {
    const query = songSearch.trim().toLowerCase();
    if (!query) {
      return catalogSongs;
    }
    return catalogSongs.filter((song) => {
      const titleMatch = song.title?.toLowerCase().includes(query);
      const artistMatch = song.artist?.toLowerCase().includes(query);
      return titleMatch || artistMatch;
    });
  }, [catalogSongs, songSearch]);

  const formatTotalRuntime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
  };

  const currentSongId = currentSong ? ensureSongId(currentSong._id) : null;

  const sortedSongs = useMemo(() => {
    if (!playlist) return [];
    const base = [...playlist.songs];
    switch (sortOption) {
      case "title":
        return mergeSort(base, "title", "asc");
      case "artist":
        return mergeSort(base, "artist", "asc");
      case "duration":
        return mergeSort(base, "duration", "asc");
      case "added":
      default:
        return base;
    }
  }, [playlist, sortOption]);

  const sortLabel: Record<PlaylistSortOption, string> = {
    added: "Recently added",
    title: "Title (A–Z)",
    artist: "Artist (A–Z)",
    duration: "Duration (shortest)",
  };

  useEffect(() => {
    // Load favorites once for correct menu labels
    fetchFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserPlaylists = async () => {
    try {
      const auth = getAuth();
      if (!auth) return;
      const response = await fetch(`/api/playlists?userId=${auth.user.id}`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setMenuPlaylists(data.data);
        setMenuPlaylistsLoaded(true);
      }
    } catch (error) {
      console.error("Error fetching playlists for menu:", error);
    }
  };

  const handleToggleLike = async (songId: string) => {
    const auth = getAuth();
    if (!auth) return;
    try {
      const res = await fetch("/api/songs/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ songId }),
      });
      const data = await res.json();
      if (data.success) {
        setFavoriteSongIds((prev) => {
          const next = new Set(prev);
          if (data.isLiked) {
            next.add(songId);
          } else {
            next.delete(songId);
          }
          return next;
        });
        // Let global liked listeners update their own views
        window.dispatchEvent(
          new CustomEvent(data.isLiked ? "song-liked" : "song-unliked", {
            detail: { songId },
          })
        );
        if (data.isLiked) {
          showToast("Added to Favorites", "success");
        } else {
          showToast("Removed from Favorites", "info");
        }
      } else {
        showToast(data.error || "Could not update Favorites", "error");
      }
    } catch (error) {
      console.error("Error toggling like from playlist:", error);
      showToast("Something went wrong updating Favorites", "error");
    }
  };

  const handleRemoveSong = async (songId: string) => {
    if (!playlist) return;
    const auth = getAuth();
    if (!auth) return;

    try {
      setActionLoading(true);
      const remainingSongIds = playlist.songs
        .map((song) => ensureSongId(song._id))
        .filter((id) => id && id !== songId);

      const response = await fetch("/api/playlists", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          playlistId: playlist._id,
          songs: remainingSongIds,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPlaylist(data.data);
        notifyPlaylistUpdate();
        showToast("Removed from playlist", "success");
      } else {
        setFeedback(data.error || "Failed to remove song from playlist");
        showToast(data.error || "Failed to remove from playlist", "error");
      }
    } catch (error) {
      console.error("Error removing song from playlist:", error);
      setFeedback("Something went wrong. Please try again.");
      showToast("Something went wrong removing from playlist", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const openRenameModal = () => {
    if (!playlist) return;
    setFormName(playlist.name);
    setFormCover(playlist.coverUrl || "");
    setCoverPreview(playlist.coverUrl || null);
    setCoverFile(null);
    setFeedback(null);
    setManageModal("rename");
  };

  const openAddSongsModal = () => {
    setSelectedSongIds([]);
    setSongSearch("");
    setFeedback(null);
    setManageModal("addSongs");
    if (catalogSongs.length === 0) {
      fetchCatalogSongs();
    }
  };

  const closeModal = () => {
    setManageModal(null);
    setActionLoading(false);
    setFeedback(null);
    setSelectedSongIds([]);
    setFormCover("");
    setCoverPreview(null);
    setCoverFile(null);
  };

  const fetchCatalogSongs = async () => {
    try {
      setCatalogLoading(true);
      const response = await fetch("/api/songs?limit=300");
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setCatalogSongs(data.data);
      }
    } catch (error) {
      console.error("Error fetching songs catalog:", error);
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    if (manageModal === "addSongs" && catalogSongs.length === 0) {
      fetchCatalogSongs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manageModal]);

  const toggleSongSelection = (songId: string) => {
    setSelectedSongIds((prev) =>
      prev.includes(songId)
        ? prev.filter((id) => id !== songId)
        : [...prev, songId]
    );
  };

  const handleCoverFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setFeedback("Please select an image file.");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFeedback("Image file size must be less than 5MB.");
        return;
      }
      setCoverFile(file);
      setFeedback(null);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRenameSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!playlist) return;
    const trimmed = formName.trim();
    if (!trimmed) {
      setFeedback("Playlist name cannot be empty.");
      return;
    }
    const auth = getAuth();
    if (!auth) return;

    try {
      setActionLoading(true);
      let coverUrl = formCover.trim();

      // Upload cover file if one is selected
      if (coverFile) {
        const formData = new FormData();
        formData.append("image", coverFile);

        const uploadResponse = await fetch("/api/playlists/upload-cover", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        if (uploadData.success && uploadData.data?.coverUrl) {
          coverUrl = uploadData.data.coverUrl;
        } else {
          setFeedback(uploadData.error || "Failed to upload cover image.");
          setActionLoading(false);
          return;
        }
      }

      const response = await fetch("/api/playlists", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          playlistId: playlist._id,
          name: trimmed,
          coverUrl: coverUrl || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPlaylist(data.data);
        closeModal();
        notifyPlaylistUpdate();
        showToast("Playlist details updated", "success");
      } else {
        setFeedback(data.error || "Failed to update playlist");
      }
    } catch (error) {
      console.error("Error updating playlist:", error);
      setFeedback("Something went wrong. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!playlist) return;
    const auth = getAuth();
    if (!auth) return;
    try {
      setActionLoading(true);
      const response = await fetch("/api/playlists", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          playlistId: playlist._id,
        }),
      });
      const data = await response.json();
      if (data.success) {
        notifyPlaylistUpdate();
        showToast("Playlist deleted", "success");
        router.push("/playlists");
      } else {
        setFeedback(data.error || "Failed to delete playlist");
      }
    } catch (error) {
      console.error("Error deleting playlist:", error);
      setFeedback("Something went wrong. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddSongsSubmit = async () => {
    if (!playlist || selectedSongIds.length === 0) {
      setManageModal(null);
      return;
    }
    const auth = getAuth();
    if (!auth) return;
    const mergedIds = Array.from(
      new Set([...playlistSongIds, ...selectedSongIds])
    ).filter(Boolean);

    try {
      setActionLoading(true);
      const response = await fetch("/api/playlists", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          playlistId: playlist._id,
          songs: mergedIds,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setPlaylist(data.data);
        closeModal();
        notifyPlaylistUpdate();
        showToast("Added to playlist", "success");
      } else {
        setFeedback(data.error || "Failed to add songs");
      }
    } catch (error) {
      console.error("Error adding songs:", error);
      setFeedback("Something went wrong. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-8">
          <div className="h-64 bg-[#282828] rounded"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-[#282828] rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-gray-400">Playlist not found.</p>
        </div>
      </div>
    );
  }

  const fallbackCover =
    playlist.songs && playlist.songs.length > 0
      ? playlist.songs[0]?.coverFile
      : null;
  const coverImage = playlist.coverUrl || fallbackCover;
  const headerStyle = coverImage
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.85) 60%, #121212 100%), url(${coverImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {};

  return (
    <div className="relative">
      {/* Header with Blurred Background */}
      <div
        id="playlist-header"
        className="relative pt-16 pb-10 px-8"
        style={headerStyle}
      >
        <div className="flex flex-wrap items-end gap-6">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt={playlist.name}
              className="w-56 h-56 rounded-lg shadow-2xl object-cover border border-white/20"
            />
          ) : (
            <div className="w-56 h-56 bg-[#282828] rounded-lg shadow-2xl flex items-center justify-center">
              <svg
                className="w-24 h-24 text-gray-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] mb-2">
              Playlist
            </p>
            <h1 className="text-5xl md:text-7xl font-black mb-4 truncate">
              {playlist.name}
            </h1>
            <p className="text-sm text-gray-200 flex flex-wrap gap-2 items-center">
              <span className="font-semibold">{ownerName}</span>
              <span>•</span>
              <span>{playlist.songs.length} songs</span>
              <span>•</span>
              <span>{formatTotalRuntime(totalRuntime)}</span>
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            onClick={handlePlayAll}
            className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg hover:shadow-xl"
            aria-label="Play"
          >
            <svg
              className="w-6 h-6 text-black ml-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            onClick={handleShuffle}
            className="text-white/70 hover:text-white transition-colors flex items-center gap-2"
            aria-label="Shuffle"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 4a1 1 0 112 0v1.586l7 7L14.414 12H13a1 1 0 110-2h4a1 1 0 011 1v4a1 1 0 11-2 0v-1.586l-7-7L7.586 8H9a1 1 0 110 2H5a1 1 0 01-1-1V4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-semibold uppercase tracking-wide">
              Shuffle
            </span>
          </button>
          <button
            type="button"
            onClick={openAddSongsModal}
            className="px-4 py-2 rounded-full border border-white/30 text-sm text-white/80 hover:text-white"
          >
            Add songs
          </button>
          <button
            type="button"
            onClick={openRenameModal}
            className="px-4 py-2 rounded-full border border-white/30 text-sm text-white/80 hover:text-white"
          >
            Edit details
          </button>
          <button
            type="button"
            onClick={() => {
              setManageModal("delete");
              setFeedback(null);
            }}
            className="text-white/70 hover:text-white"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.5 6a.5.5 0 00-.5.5V8h8V6.5a.5.5 0 00-.5-.5h-7z" />
              <path
                fillRule="evenodd"
                d="M4 7h12l-.867 9.033A2 2 0 0113.14 18H6.86a2 2 0 01-1.993-1.967L4 7zm3 2a1 1 0 012 0v6a1 1 0 11-2 0V9zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V9a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
              <path d="M7 4a2 2 0 012-2h2a2 2 0 012 2v1H7V4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Songs Table */}
      <div className="px-0 pb-16">
        {playlist.songs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">This playlist is empty.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Sort bar */}
            <div className="flex items-center justify-end px-8 pt-4 pb-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSortMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-gray-200 border border-white/10"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3 5a1 1 0 011-1h9a1 1 0 110 2H7a1 1 0 01-1-1zm4 4a1 1 0 011-1h5a1 1 0 110 2h-5a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="uppercase tracking-wide text-[10px] text-gray-400">
                    Sort by
                  </span>
                  <span className="text-xs font-medium">
                    {sortLabel[sortOption]}
                  </span>
                </button>
                {sortMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[#181818] border border-white/10 shadow-xl text-xs text-gray-200 py-1 z-[55]">
                    {(Object.keys(sortLabel) as PlaylistSortOption[]).map(
                      (option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setSortOption(option);
                            setSortMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 hover:bg-white/10 ${
                            sortOption === option ? "text-white" : ""
                          }`}
                        >
                          <span>{sortLabel[option]}</span>
                          {sortOption === option && (
                            <span className="text-blue-400 text-[10px]">●</span>
                          )}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Table Header */}
            <div className="sticky top-16 z-10 grid grid-cols-[16px_1fr_1fr_auto] md:grid-cols-[40px_minmax(0,3fr)_minmax(0,2fr)_minmax(0,2fr)_auto] gap-4 px-8 py-3 text-xs text-gray-400 border-b border-[#282828] bg-[#121212]/95 backdrop-blur">
              <div>#</div>
              <div>TITLE</div>
              <div className="hidden md:block">ALBUM</div>
              <div className="hidden md:block">DATE ADDED</div>
              <div className="text-right">
                <svg
                  className="w-4 h-4 inline"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
              </div>
            </div>

            {/* Songs List */}
            {sortedSongs.map((song, index) => {
              const songId = ensureSongId(song._id);
              const isPlayingSong =
                currentSongId !== null && currentSongId === songId && isPlaying;

              return (
                <div
                  key={songId}
                  onClick={() => handleSongClick(song)}
                  className="relative grid grid-cols-[16px_1fr_1fr_auto] md:grid-cols-[40px_minmax(0,3fr)_minmax(0,2fr)_minmax(0,2fr)_auto] gap-4 px-8 py-3 rounded hover:bg-white/5 group cursor-pointer transition"
                >
                  <div className="flex items-center text-gray-400 group-hover:text-white">
                    {isPlayingSong ? (
                      <svg
                        className="w-4 h-4 text-blue-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <span className="group-hover:hidden">{index + 1}</span>
                    )}
                    <button
                      className="hidden group-hover:flex items-center justify-center text-white ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSongClick(song);
                      }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    {song.coverFile ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={song.coverFile}
                        alt={song.title}
                        className="w-12 h-12 rounded object-cover hidden md:block"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-white/5 hidden md:flex items-center justify-center text-white/40 text-xs">
                        No art
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-base font-medium truncate ${
                          isPlayingSong ? "text-blue-400" : "text-white"
                        }`}
                      >
                        {song.title}
                      </div>
                      <div className="text-sm text-gray-400 truncate">
                        {song.artist}
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center text-sm text-gray-400">
                    {song.category}
                  </div>
                  <div className="hidden md:flex items-center text-sm text-gray-400">
                    {new Date().toLocaleDateString()}
                  </div>
                  <div className="flex items-center justify-end text-sm text-gray-400 tabular-nums gap-2">
                    <span>{formatDuration(song.duration)}</span>

                    {/* Hover-only three-dots icon; menu opens on click, stays on same line */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSongMenuId((current) =>
                            current === songId ? null : songId
                          );
                          if (!menuPlaylistsLoaded) {
                            fetchUserPlaylists();
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10"
                        aria-label="Song options"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm2 2a2 2 0 100-4 2 2 0 000 4z" />
                        </svg>
                      </button>

                      {showSongMenuId === songId && (
                        <div className="absolute right-0 top-8 z-[60] w-56 bg-[#282828] rounded-xl shadow-xl border border-white/10 py-1 text-sm">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLike(songId);
                              setShowSongMenuId(null);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-white/10 text-white/90"
                          >
                            {favoriteSongIds.has(songId)
                              ? "Remove from Favorites"
                              : "Save to Favorites"}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSong(songId);
                              setShowSongMenuId(null);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-white/10 text-red-400"
                          >
                            Remove from this playlist
                          </button>
                          <div className="border-t border-white/10 my-1" />
                          <div className="px-3 py-1 text-xs uppercase tracking-wide text-white/40">
                            Add to playlist
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {menuPlaylists.length === 0 ? (
                              <div className="px-3 py-2 text-white/60 text-xs">
                                No other playlists
                              </div>
                            ) : (
                              menuPlaylists
                                .filter((p) => p._id !== playlist._id)
                                .map((p) => {
                                  const existingIds = Array.isArray(p.songs)
                                    ? p.songs.map((s) =>
                                        ensureSongId(
                                          typeof s === "string" ? s : s._id
                                        )
                                      )
                                    : [];
                                  const alreadyIn =
                                    existingIds.includes(songId);

                                  return (
                                    <button
                                      key={p._id}
                                      type="button"
                                      disabled={alreadyIn}
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (alreadyIn) return;
                                        const auth = getAuth();
                                        if (!auth) return;
                                        try {
                                          const nextIds = Array.from(
                                            new Set([...existingIds, songId])
                                          ).filter(Boolean);
                                          const res = await fetch(
                                            "/api/playlists",
                                            {
                                              method: "PUT",
                                              headers: {
                                                "Content-Type":
                                                  "application/json",
                                                Authorization: `Bearer ${auth.token}`,
                                              },
                                              body: JSON.stringify({
                                                playlistId: p._id,
                                                songs: nextIds,
                                              }),
                                            }
                                          );
                                          const updated = await res.json();
                                          if (updated.success) {
                                            notifyPlaylistUpdate();
                                            showToast(
                                              `Added to "${p.name}"`,
                                              "success"
                                            );
                                          } else {
                                            showToast(
                                              updated.error ||
                                                "Failed to add to playlist",
                                              "error"
                                            );
                                          }
                                        } catch (error) {
                                          console.error(
                                            "Error adding song to playlist:",
                                            error
                                          );
                                        } finally {
                                          setShowSongMenuId(null);
                                        }
                                      }}
                                      className={`w-full text-left px-3 py-2 hover:bg-white/10 text-white/90 ${
                                        alreadyIn
                                          ? "opacity-50 cursor-not-allowed"
                                          : ""
                                      }`}
                                    >
                                      {alreadyIn ? `In ${p.name}` : p.name}
                                    </button>
                                  );
                                })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rename playlist modal */}
      {manageModal === "rename" && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-md bg-[#181818] rounded-3xl p-6 border border-white/5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">Edit playlist name</h3>
              <button
                onClick={closeModal}
                className="text-white/60 hover:text-white"
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <form className="space-y-4" onSubmit={handleRenameSubmit}>
              <label className="block">
                <span className="text-sm text-white/60">Name</span>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white"
                  maxLength={120}
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm text-white/60">Cover image</span>
                <div className="mt-2 space-y-3">
                  {coverPreview && (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-white/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverPreview}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCoverPreview(null);
                          setCoverFile(null);
                          setFormCover("");
                        }}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center hover:bg-black/90 transition-colors"
                        aria-label="Remove image"
                      >
                        <svg
                          className="w-4 h-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverFileChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 file:cursor-pointer cursor-pointer"
                  />
                </div>
                <p className="text-xs text-white/40 mt-1">
                  Select an image from your device. Leave blank to pull artwork
                  from the first song.
                </p>
              </label>
              {feedback && <p className="text-sm text-red-400">{feedback}</p>}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-full border border-white/20 text-sm text-white/80 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-full bg-white text-black text-sm font-semibold disabled:opacity-60"
                >
                  {actionLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {manageModal === "delete" && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-md bg-[#181818] rounded-3xl p-6 border border-white/5 shadow-2xl text-center space-y-4">
            <h3 className="text-2xl font-bold">Delete playlist?</h3>
            <p className="text-white/70">
              This will permanently remove{" "}
              <span className="font-semibold">{playlist?.name}</span>.
            </p>
            {feedback && <p className="text-sm text-red-400">{feedback}</p>}
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setManageModal(null);
                  setFeedback(null);
                }}
                className="px-4 py-2 rounded-full border border-white/20 text-sm text-white/80 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePlaylist}
                disabled={actionLoading}
                className="px-6 py-2 rounded-full bg-red-500 text-black text-sm font-semibold disabled:opacity-60"
              >
                {actionLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add songs modal */}
      {manageModal === "addSongs" && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-2xl bg-[#181818] rounded-3xl p-6 border border-white/5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold">Add songs</h3>
                <p className="text-white/60 text-sm">
                  Choose tracks from your library to drop into this playlist.
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-white/60 hover:text-white"
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div className="mb-4">
              <input
                type="search"
                value={songSearch}
                onChange={(e) => setSongSearch(e.target.value)}
                placeholder="Search songs or artists"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white text-sm"
              />
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {catalogLoading ? (
                [...Array(6)].map((_, idx) => (
                  <div
                    key={idx}
                    className="h-16 rounded-2xl bg-white/5 animate-pulse"
                  ></div>
                ))
              ) : filteredCatalog.length === 0 ? (
                <p className="text-center text-white/60 py-12">
                  No songs found. Try a different search.
                </p>
              ) : (
                filteredCatalog.map((song) => {
                  const songId = ensureSongId(song._id);
                  const alreadyAdded = playlistSongIdSet.has(songId);
                  const selected = selectedSongIds.includes(songId);

                  return (
                    <button
                      key={songId}
                      type="button"
                      onClick={() => {
                        if (!alreadyAdded) {
                          toggleSongSelection(songId);
                        }
                      }}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl border border-white/10 text-left transition ${
                        alreadyAdded
                          ? "opacity-60 cursor-not-allowed"
                          : selected
                          ? "bg-white/10 border-white/30"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                        {song.coverFile ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={song.coverFile}
                            alt={song.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/50 text-xs">
                            No art
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {song.title}
                        </p>
                        <p className="text-xs text-white/60 truncate">
                          {song.artist}
                        </p>
                      </div>
                      {alreadyAdded ? (
                        <span className="text-xs uppercase tracking-wide text-white/50">
                          In playlist
                        </span>
                      ) : (
                        <div
                          className={`w-5 h-5 rounded border ${
                            selected
                              ? "bg-blue-400 border-blue-400"
                              : "border-white/30"
                          }`}
                        >
                          {selected && (
                            <svg
                              className="w-full h-full text-black"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8.25 8.25a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L7.75 12.586l7.543-7.543a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
            {feedback && manageModal === "addSongs" && (
              <p className="text-sm text-red-400 mt-4">{feedback}</p>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-full border border-white/20 text-sm text-white/80 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddSongsSubmit}
                disabled={selectedSongIds.length === 0 || actionLoading}
                className="px-6 py-2 rounded-full bg-white text-black text-sm font-semibold disabled:opacity-60"
              >
                {actionLoading
                  ? "Adding..."
                  : selectedSongIds.length
                  ? `Add ${selectedSongIds.length} song${
                      selectedSongIds.length > 1 ? "s" : ""
                    }`
                  : "Select tracks"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
