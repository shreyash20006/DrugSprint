export interface DriveFile {
  id: string;
  file_name: string;
  drive_file_id: string;
  drive_link: string;
  uploaded_by: string;
  created_at: string;
  category: 'Notices' | 'Events' | 'Gallery' | 'Student Uploads' | 'Certificates';
}

/**
 * Uploads a file directly to Google Drive via serverless API and tracks progress.
 */
export function uploadFileToDrive(
  file: File,
  category: string,
  uploadedBy: string,
  onProgress?: (percent: number) => void
): Promise<DriveFile> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/drive-upload', true);

    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.success && response.file) {
            resolve(response.file);
          } else {
            reject(new Error(response.error || 'Upload failed'));
          }
        } catch (e) {
          reject(new Error('Invalid response received from server.'));
        }
      } else {
        try {
          const response = JSON.parse(xhr.responseText);
          reject(new Error(response.error || `Server responded with status ${xhr.status}`));
        } catch {
          reject(new Error(`Server responded with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error occurred during file upload.'));
    };

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('uploadedBy', uploadedBy);

    xhr.send(formData);
  });
}

/**
 * Deletes a file from Google Drive and removes metadata from Supabase.
 */
export async function deleteFileFromDrive(driveFileId: string): Promise<boolean> {
  const response = await fetch('/api/drive-delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ driveFileId }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete file from Google Drive.');
  }

  const data = await response.json();
  return data.success;
}

/**
 * Renames a file on Google Drive and updates the record in Supabase.
 */
export async function renameFileInDrive(driveFileId: string, newName: string): Promise<DriveFile> {
  const response = await fetch('/api/drive-rename', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ driveFileId, newName }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to rename file in Google Drive.');
  }

  const data = await response.json();
  return data.file;
}
