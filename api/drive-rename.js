import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,PUT,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { driveFileId, newName } = req.body;

  if (!driveFileId || !newName) {
    return res.status(400).json({ error: 'Missing driveFileId or newName in request body.' });
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

    // 2. Rename file in Google Drive
    await drive.files.update({
      fileId: driveFileId,
      requestBody: {
        name: newName,
      },
    });

    // 3. Update metadata in Supabase
    const { data, error } = await supabase
      .from('drive_files')
      .update({
        file_name: newName,
      })
      .eq('drive_file_id', driveFileId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      file: data,
    });
  } catch (err) {
    console.error('[Drive Rename] Exception:', err);
    return res.status(500).json({
      error: 'Failed to rename file.',
      message: err.message,
    });
  }
}
