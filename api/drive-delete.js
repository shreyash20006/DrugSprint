import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { driveFileId } = req.body;

  if (!driveFileId) {
    return res.status(400).json({ error: 'Missing driveFileId in request body.' });
  }

  const saEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const saKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!saEmail || !saKey) {
    return res.status(500).json({
      error: 'Google Drive configuration missing. Please check service account environment variables.',
    });
  }

  try {
    // 1. Authenticate with Google
    const auth = new google.auth.JWT(
      saEmail,
      null,
      saKey.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/drive']
    );

    const drive = google.drive({ version: 'v3', auth });

    // 2. Delete file from Google Drive
    try {
      await drive.files.delete({
        fileId: driveFileId,
      });
      console.log(`[Drive Delete] Successfully deleted file ${driveFileId} from Google Drive.`);
    } catch (driveErr) {
      // If the file is already deleted or not found, log it and proceed to remove database record
      console.warn(`[Drive Delete] Warning: File not found or failed to delete in Google Drive: ${driveErr.message}`);
    }

    // 3. Delete metadata from Supabase
    const { error } = await supabase
      .from('drive_files')
      .delete()
      .eq('drive_file_id', driveFileId);

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: `File ${driveFileId} deleted successfully.`,
    });
  } catch (err) {
    console.error('[Drive Delete] Exception:', err);
    return res.status(500).json({
      error: 'Failed to delete file.',
      message: err.message,
    });
  }
}
