import UploadForm from '@/components/UploadForm';

/**
 * Admin Upload Page
 * Page for uploading new songs
 */
export default function UploadPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Upload New Song</h1>
      <div className="bg-gray-900 rounded-lg p-6">
        <UploadForm />
      </div>
    </div>
  );
}

