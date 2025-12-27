'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * UploadForm Component
 * Form for uploading new songs (MP3 + cover image)
 */
export default function UploadForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    category: '',
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const storedUser =
        localStorage.getItem('adminUser') || localStorage.getItem('user');
      const token =
        localStorage.getItem('adminToken') || localStorage.getItem('token');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;

      if (!parsedUser || parsedUser.role !== 'admin') {
        throw new Error('Admin access required');
      }

      if (!token) {
        throw new Error('Authentication token missing');
      }

      // Validate form
      if (!formData.title || !formData.artist || !formData.category || !audioFile || !imageFile) {
        throw new Error('All fields are required');
      }

      // Upload files
      const uploadFormData = new FormData();
      uploadFormData.append('audio', audioFile);
      uploadFormData.append('image', imageFile);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload files');
      }

      const uploadData = await uploadResponse.json();
      const detectedDuration = uploadData?.data?.duration;
      if (!detectedDuration || detectedDuration <= 0) {
        throw new Error('Could not determine audio duration. Please try a different file.');
      }

      // Create song
      const songData = {
        title: formData.title,
        artist: formData.artist,
        category: formData.category,
        duration: detectedDuration,
        audioFile: uploadData.data.audioUrl,
        coverFile: uploadData.data.coverUrl,
      };

      const songResponse = await fetch('/api/songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(songData),
      });

      if (!songResponse.ok) {
        throw new Error('Failed to create song');
      }

      setSuccess(true);
      setFormData({ title: '', artist: '', category: '' });
      setAudioFile(null);
      setImageFile(null);

      // Reset file inputs
      const audioInput = document.getElementById('audio') as HTMLInputElement;
      const imageInput = document.getElementById('image') as HTMLInputElement;
      if (audioInput) audioInput.value = '';
      if (imageInput) imageInput.value = '';

      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500 text-white p-4 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500 text-white p-4 rounded">
          Song uploaded successfully!
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="artist" className="block text-sm font-medium mb-2">
          Artist *
        </label>
        <input
          type="text"
          id="artist"
          name="artist"
          value={formData.artist}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium mb-2">
          Category *
        </label>
        <input
          type="text"
          id="category"
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="audio" className="block text-sm font-medium mb-2">
          Audio File *
        </label>
        <input
          type="file"
          id="audio"
          name="audio"
          accept="audio/*"
          onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
          required
          className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="image" className="block text-sm font-medium mb-2">
          Cover Image *
        </label>
        <input
          type="file"
          id="image"
          name="image"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          required
          className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Uploading...' : 'Upload Song'}
      </button>
    </form>
  );
}

