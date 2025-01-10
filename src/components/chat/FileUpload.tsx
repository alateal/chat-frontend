import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface FileUploadProps {
  onFileUpload: (fileData: FileMetadata) => void;
}

interface FileMetadata {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
}

export const FileUpload = ({ onFileUpload }: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { getToken } = useAuth();

  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const token = await getToken();
      console.log('Uploading to:', `${API_URL}/api/files/upload`);
      
      const response = await fetch(`${API_URL}/api/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        const errorMessage = contentType?.includes('application/json') 
          ? (await response.json()).details || 'Upload failed'
          : 'Upload failed';
        throw new Error(errorMessage);
      }

      if (!contentType?.includes('application/json')) {
        throw new Error('Invalid server response');
      }

      const fileData = await response.json();
      if (!fileData?.id) {
        throw new Error('Invalid file data received');
      }

      onFileUpload(fileData);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        className="hidden"
        id="file-upload"
        onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
      />
      <label 
        htmlFor="file-upload"
        className="btn btn-ghost btn-sm"
      >
        {isUploading ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
          </svg>
        )}
      </label>
    </div>
  );
}; 