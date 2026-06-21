import { google } from 'googleapis';
import multiparty from 'multiparty';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Service role key is preferred for backend system updates, fallback to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getOrCreateFolder(drive, folderName, parentId) {
  let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed = false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id;
  }

  // Create subfolder
  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    fileMetadata.parents = [parentId];
  }

  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id',
  });

  // Make subfolder publicly readable
  await drive.permissions.create({
    fileId: folder.data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  return folder.data.id;
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const saEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const saKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;

  if (!saEmail || !saKey) {
    return res.status(500).json({
      error: 'Google Drive configuration missing. Please check service account environment variables.',
    });
  }

  const form = new multiparty.Form();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('[Drive Upload] Multipart parsing error:', err);
      return res.status(400).json({ error: 'Error parsing multipart form-data.' });
    }

    const fileArray = files.file;
    if (!fileArray || fileArray.length === 0) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const uploadedFile = fileArray[0];
    const category = fields.category ? fields.category[0] : 'Student Uploads';
    const uploadedBy = fields.uploadedBy ? fields.uploadedBy[0] : 'System';

    try {
      // 1. Authenticate with Google
      const auth = new google.auth.JWT(
        saEmail,
        null,
        saKey.replace(/\\n/g, '\n'),
        ['https://www.googleapis.com/auth/drive']
      );

      const drive = google.drive({ version: 'v3', auth });

      // 2. Resolve target folder in Google Drive
      let targetFolderId = parentFolderId;
      if (category && parentFolderId) {
        targetFolderId = await getOrCreateFolder(drive, category, parentFolderId);
      }

      // 3. Upload file to Google Drive
      const fileMetadata = {
        name: uploadedFile.originalFilename,
        parents: targetFolderId ? [targetFolderId] : [],
      };

      const media = {
        mimeType: uploadedFile.headers['content-type'],
        body: fs.createReadStream(uploadedFile.path),
      };

      const driveFile = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink, webContentLink',
      });

      const fileId = driveFile.data.id;
      // Get webViewLink or fall back to webContentLink (direct download)
      const driveLink = driveFile.data.webViewLink || `https://drive.google.com/uc?id=${fileId}&export=download`;

      // 4. Set permissions to public view
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      // 5. Store metadata in Supabase
      const { data, error } = await supabase
        .from('drive_files')
        .insert({
          file_name: uploadedFile.originalFilename,
          drive_file_id: fileId,
          drive_link: driveLink,
          uploaded_by: uploadedBy,
          category: category,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // 6. Clean up temporary local file
      fs.unlinkSync(uploadedFile.path);

      return res.status(200).json({
        success: true,
        file: data,
      });
    } catch (uploadErr) {
      console.error('[Drive Upload] Error occurred:', uploadErr);
      if (fs.existsSync(uploadedFile.path)) {
        fs.unlinkSync(uploadedFile.path);
      }
      return res.status(500).json({
        error: 'Failed to upload file to Google Drive.',
        message: uploadErr.message,
      });
    }
  });
}
