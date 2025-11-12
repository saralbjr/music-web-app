# SoundWave - Music Player Web App

A full-stack music player web application built with Next.js, TypeScript, Tailwind CSS, MongoDB, and Mongoose.

## Features

- ✅ Add, edit, delete songs (admin)
- ✅ Upload MP3 files + cover images
- ✅ Play, pause, next, previous controls
- ✅ Seek bar + duration + volume slider
- ✅ Song list page with search and sorting
- ✅ Single song play page
- ✅ Playlists (create + add songs)
- ✅ User login system (email + password)
- ✅ Sorting algorithm (Merge Sort)
- ✅ Searching algorithm (KMP String Search)
- ✅ Shuffle algorithm (Fisher-Yates)
- ✅ Recommendation algorithm (content-based)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **State Management**: Zustand
- **Authentication**: bcryptjs for password hashing

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB running locally or MongoDB Atlas connection string

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd music-player
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/music-player?retryWrites=true&w=majority
```

**Note:** The `.env.local` file has been created with your MongoDB Atlas connection string. Make sure it's properly configured.

4. Create the uploads directory:
```bash
mkdir -p public/uploads
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/app
  /(site)
    page.tsx              # Home page
  /api
    /songs                # Songs API routes
    /upload               # File upload API
    /auth                 # Authentication API
    /playlists            # Playlists API
  /admin
    /upload               # Admin upload page
  /playlists              # Playlists pages
  /songs/[id]             # Single song page
  /auth                   # Auth pages
/components
  AudioPlayer.tsx         # Main audio player component
  SongCard.tsx            # Song card component
  Sidebar.tsx             # Sidebar navigation
  Header.tsx              # Header component
  UploadForm.tsx          # Upload form component
/lib
  db.ts                   # MongoDB connection
  /algorithms
    mergeSort.ts          # Merge sort implementation
    kmp.ts                # KMP search algorithm
    shuffle.ts            # Fisher-Yates shuffle
    recommend.ts          # Recommendation algorithm
  /store
    audioStore.ts         # Zustand audio state store
/models
  Song.ts                 # Song Mongoose model
  User.ts                 # User Mongoose model
  Playlist.ts             # Playlist Mongoose model
/public
  /uploads                # Uploaded files directory
```

## API Routes

### Songs
- `GET /api/songs` - Get all songs (with search and sort)
- `POST /api/songs` - Create a new song
- `GET /api/songs/[id]` - Get a single song
- `PUT /api/songs/[id]` - Update a song
- `DELETE /api/songs/[id]` - Delete a song

### Upload
- `POST /api/upload` - Upload MP3 and image files

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/[...nextauth]` - NextAuth.js OAuth endpoints

### Spotify API
- `GET /api/spotify/login` - Get current Spotify session
- `GET /api/spotify/top-tracks` - Get user's top tracks
- `GET /api/spotify/top-artists` - Get user's top artists
- `GET /api/spotify/recent` - Get recently played tracks
- `GET /api/spotify/recommendations` - Get song recommendations

### Music Search & Linking
- `GET /api/music/search-deezer` - Search Deezer for a song
- `GET /api/music/search-itunes` - Search iTunes for a song
- `POST /api/music/link` - Link Spotify song to Deezer/iTunes preview

### Playlists
- `GET /api/playlists?userId=...` - Get user playlists
- `POST /api/playlists` - Create a new playlist
- `PUT /api/playlists` - Update a playlist

## Algorithms

### Merge Sort
Used for sorting songs by title, duration, play count, or date created.

### KMP Search
Knuth-Morris-Pratt algorithm for efficient string searching in song titles and artist names.

### Fisher-Yates Shuffle
Randomly shuffles playlists for a better listening experience.

### Recommendation Algorithm
Content-based recommendation system that scores songs based on:
- Play count (60% weight)
- Category match (40% weight)

## Usage

1. **Register/Login**: Create an account or login to access admin features
2. **Browse Songs**: View all songs on the home page
3. **Search & Sort**: Use the search bar and sort options to find songs
4. **Play Music**: Click on any song to play it
5. **Create Playlists**: Create playlists and add songs to them
6. **Upload Songs**: Admin users can upload new songs with MP3 files and cover images

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## License

MIT

