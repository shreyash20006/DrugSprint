import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/admin/ProtectedRoute';
import { useToast } from '../../components/admin/Toast';
import { uploadFileToDrive, deleteFileFromDrive, renameFileInDrive, type DriveFile } from '../../lib/drive';
import { logActivity } from '../../lib/logs';
import {
  FolderOpen, UploadCloud, Trash2, Edit2, Copy, ExternalLink,
  Loader2, FileText, Film, Image as ImageIcon, Search, Check, X,
  FileCode, ShieldCheck, FolderPlus, Info
} from 'lucide-react';

const CATEGORIES = ['Notices', 'Events', 'Gallery', 'Student Uploads', 'Certificates'] as const;
type CategoryType = typeof CATEGORIES[number];

export const AdminFileManager: React.FC = () => {
  const { email: myEmail } = useAuth();
  const toast = useToast();

  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CategoryType>('Notices');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload States
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<CategoryType>('Notices');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Rename States
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Deleting States
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch file metadata from Supabase
  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('drive_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (err: any) {
      console.error('Failed to load drive files:', err);
      toast.error('❌ Failed to retrieve file records: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Handle file drop/select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setUploadFile(selected);
    }
  };

  // Upload file handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploaded = await uploadFileToDrive(
        uploadFile,
        uploadCategory,
        myEmail || 'Admin',
        (percent) => setUploadProgress(percent)
      );

      // Add to local state
      setFiles((prev) => [uploaded, ...prev]);
      toast.success(`📤 File "${uploaded.file_name}" uploaded to Google Drive successfully!`);

      // Log action
      await logActivity(
        myEmail,
        'drive_upload',
        `Uploaded file to Google Drive: "${uploaded.file_name}" in folder: "${uploadCategory}"`
      );

      // Reset form
      setUploadFile(null);
    } catch (err: any) {
      console.error('[Drive Upload UI] Error:', err);
      toast.error('❌ Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Delete file handler
  const handleDelete = async (driveFileId: string, name: string) => {
    if (!window.confirm(`⚠️ Are you sure you want to permanently delete "${name}" from Google Drive? This cannot be undone.`)) {
      return;
    }

    setDeletingId(driveFileId);
    try {
      await deleteFileFromDrive(driveFileId);

      // Remove from local state
      setFiles((prev) => prev.filter((f) => f.drive_file_id !== driveFileId));
      toast.success(`🗑️ Deleted "${name}" successfully.`);

      // Log action
      await logActivity(
        myEmail,
        'drive_delete',
        `Deleted file from Google Drive: "${name}" (${driveFileId})`
      );
    } catch (err: any) {
      console.error('[Drive Delete UI] Error:', err);
      toast.error('❌ Delete failed: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Start Rename handler
  const startRename = (file: DriveFile) => {
    setRenamingId(file.drive_file_id);
    setRenameValue(file.file_name);
  };

  // Rename submit handler
  const handleRenameSubmit = async (driveFileId: string) => {
    if (!renameValue.trim()) return;

    setIsRenaming(true);
    try {
      const updated = await renameFileInDrive(driveFileId, renameValue.trim());

      // Update state
      setFiles((prev) => prev.map((f) => (f.drive_file_id === driveFileId ? updated : f)));
      toast.success('✏️ File renamed successfully!');
      
      // Log action
      await logActivity(
        myEmail,
        'drive_rename',
        `Renamed Google Drive file to: "${renameValue.trim()}" (${driveFileId})`
      );

      setRenamingId(null);
    } catch (err: any) {
      console.error('[Drive Rename UI] Error:', err);
      toast.error('❌ Rename failed: ' + err.message);
    } finally {
      setIsRenaming(false);
    }
  };

  // Clipboard copy helper
  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('📋 File link copied to clipboard!');
  };

  // Render appropriate file type icon
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return <ImageIcon className="w-5 h-5 text-amber-400" />;
    }
    if (['mp4', 'webm', 'ogg', 'mov'].includes(ext || '')) {
      return <Film className="w-5 h-5 text-emerald-400" />;
    }
    if (['pdf'].includes(ext || '')) {
      return <FileText className="w-5 h-5 text-rose-400" />;
    }
    return <FileCode className="w-5 h-5 text-blue-400" />;
  };

  // Filter and search logic
  const filteredFiles = files.filter((file) => {
    const matchesTab = file.category === activeTab;
    const matchesSearch = file.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D1B3E]/40 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-lg">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-orange-burnt/10 flex items-center justify-center text-orange-burnt border border-orange-burnt/25">
            <FolderOpen className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-lg text-white">Google Drive Asset Manager</h2>
            <p className="text-[10px] text-white/40 font-sans mt-0.5">
              Service Account storage for council files. All assets are synced in real-time.
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-semibold text-emerald-400/90 shadow-sm shrink-0">
          <ShieldCheck className="w-4 h-4 mr-1.5" />
          <span>Drive Integration Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Upload Box */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0D1B3E]/40 border border-white/10 rounded-2xl p-5 shadow-lg space-y-5">
            <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
              <UploadCloud className="w-4 h-4 text-orange-burnt" />
              <h3 className="font-display font-bold text-sm text-white">Upload to Google Drive</h3>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Category selector */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">Target Folder</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as CategoryType)}
                  className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-orange-burnt/50 outline-none text-xs text-white"
                  disabled={isUploading}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#0D1B3E] text-white">
                      📂 {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Drag & Drop File Selector */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">Select File</label>
                <div className="border border-dashed border-white/10 hover:border-orange-burnt/40 rounded-xl p-6 text-center cursor-pointer transition-colors relative bg-white/[0.01]">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                    data-testid="drive-file-input"
                  />
                  <UploadCloud className="w-8 h-8 mx-auto mb-2 text-white/20" />
                  {uploadFile ? (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-white truncate max-w-xs px-2">
                        {uploadFile.name}
                      </p>
                      <p className="text-[10px] text-white/40">
                        {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-white/60 font-semibold">Click or drag file here</p>
                      <p className="text-[9px] text-white/30 mt-1">Supports PDF, Images, Videos & Docs up to 50MB</p>
                    </>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {isUploading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-white/55">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-burnt to-gold-accent transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={!uploadFile || isUploading}
                className="w-full py-2.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white rounded-lg font-display text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-orange-burnt/15 flex items-center justify-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading to Drive...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Start Asset Upload</span>
                  </>
                )}
              </button>

              {uploadFile && !isUploading && (
                <button
                  type="button"
                  onClick={() => setUploadFile(null)}
                  className="w-full py-2 border border-white/10 hover:bg-white/5 text-white/50 hover:text-white rounded-lg font-display text-xs transition-colors"
                >
                  Clear Selection
                </button>
              )}
            </form>
          </div>

          {/* Service account description box */}
          <div className="bg-[#0D1B3E]/20 border border-white/5 rounded-2xl p-5 text-xs text-white/50 font-sans space-y-2.5 leading-relaxed">
            <h4 className="font-display font-bold text-white flex items-center text-[11px] uppercase tracking-wider text-orange-burnt">
              <Info className="w-3.5 h-3.5 mr-1.5" />
              Drive Storage Policy
            </h4>
            <p>
              Files uploaded here are stored in dedicated Google Drive folders. The system automatically sets permissions to **anyone with link can view** (public read).
            </p>
            <p>
              Deleting a file from this panel will delete the file from your Google Drive and delete its database metadata from Supabase.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Browser List */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Tabs header + Search bar */}
          <div className="bg-[#0D1B3E]/40 border border-white/10 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Folder tabs */}
            <div className="flex bg-white/5 p-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-white/5 overflow-x-auto no-scrollbar scrollbar-none shrink-0">
              {CATEGORIES.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-2 rounded-md transition-all shrink-0 flex items-center space-x-1.5 ${
                    activeTab === tab
                      ? 'bg-orange-burnt text-white shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <span>{activeTab === tab ? '📂' : '📁'}</span>
                  <span>{tab}</span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex-grow max-w-sm md:ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg outline-none text-xs text-white placeholder:text-white/20 transition-all focus:border-orange-burnt/50"
              />
            </div>

          </div>

          {/* Files List Panel */}
          <div className="bg-[#0D1B3E]/40 border border-white/10 rounded-2xl shadow-lg p-5">
            {isLoading ? (
              <div className="py-24 text-center text-white/40">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-orange-burnt" />
                <span className="font-display text-xs">Fetching drive metadata...</span>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-white/20">
                  <FolderPlus className="w-8 h-8" />
                </div>
                <h4 className="font-display font-bold text-white/60 text-sm">No assets found</h4>
                <p className="text-white/30 text-xs mt-1 max-w-xs mx-auto leading-relaxed">
                  There are no files uploaded in folder **{activeTab}** {searchQuery && `matching "${searchQuery}"`}. Upload files on the left to start.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFiles.map((file) => {
                  const isRenamingThis = renamingId === file.drive_file_id;
                  const isDeletingThis = deletingId === file.drive_file_id;

                  // Google Drive dynamic thumbnail helper
                  const thumbnailSrc = `https://drive.google.com/thumbnail?id=${file.drive_file_id}&sz=w800`;

                  return (
                    <div
                      key={file.id}
                      className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
                    >
                      {/* Premium asset thumbnail/type block */}
                      <div className="h-32 rounded-lg bg-black/40 overflow-hidden relative border border-white/5 flex items-center justify-center group-hover:scale-[1.01] transition-transform">
                        {/* Direct preview from Drive Thumbnail API */}
                        <img
                          src={thumbnailSrc}
                          alt={file.file_name}
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-85 transition-opacity"
                          onError={(e) => {
                            // Hide image and fall back to generic icon design
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                          <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center mb-1 shadow">
                            {getFileIcon(file.file_name)}
                          </div>
                        </div>
                      </div>

                      {/* File Details */}
                      <div className="space-y-1.5 flex-grow">
                        {isRenamingThis ? (
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              className="flex-grow px-2 py-1 bg-[#0A1428] border border-orange-burnt/50 rounded text-xs text-white outline-none focus:ring-1 focus:ring-orange-burnt"
                              disabled={isRenaming}
                            />
                            <button
                              onClick={() => handleRenameSubmit(file.drive_file_id)}
                              disabled={isRenaming}
                              className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 rounded text-white text-[10px] font-bold"
                            >
                              {isRenaming ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => setRenamingId(null)}
                              disabled={isRenaming}
                              className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white/60 text-[10px] font-bold"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <h4 className="font-display font-bold text-xs text-white truncate group-hover:text-orange-burnt transition-colors pr-8">
                            {file.file_name}
                          </h4>
                        )}

                        <div className="text-[10px] text-white/40 space-y-0.5 leading-none">
                          <p>By: <span className="font-mono text-white/50">{file.uploaded_by}</span></p>
                          <p>Date: {new Date(file.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* File Actions */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-3">
                        <div className="flex space-x-1.5">
                          <button
                            onClick={() => copyLink(file.drive_link)}
                            title="Copy Drive Link"
                            className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer border border-white/5"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={file.drive_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open Google Drive File"
                            className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer border border-white/5 flex items-center justify-center"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => startRename(file)}
                            title="Rename Asset"
                            className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer border border-white/5"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleDelete(file.drive_file_id, file.file_name)}
                          disabled={isDeletingThis}
                          className="p-1.5 rounded bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-colors cursor-pointer border border-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDeletingThis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFileManager;
