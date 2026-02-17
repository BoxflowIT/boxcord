// Edit Modal for Channel or Workspace
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import ImageUpload from './ImageUpload';
import { api } from '../services/api';
import { logger } from '../utils/logger';

interface EditModalProps {
  isOpen: boolean;
  title: string;
  name: string;
  description?: string;
  iconUrl?: string;
  showIcon?: boolean;
  onSave: (data: {
    name: string;
    description: string;
    iconUrl?: string;
  }) => void | Promise<void>;
  onCancel: () => void;
}

export default function EditModal({
  isOpen,
  title,
  name: initialName,
  description: initialDescription = '',
  iconUrl: initialIconUrl = '',
  showIcon = false,
  onSave,
  onCancel
}: EditModalProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [iconUrl, setIconUrl] = useState(initialIconUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Update state when props change (when modal opens with new data)
  useEffect(() => {
    setName(initialName);
    setDescription(initialDescription);
    setIconUrl(initialIconUrl);
    setSelectedFile(null);
    setUploadError(null);
  }, [initialName, initialDescription, initialIconUrl, isOpen]);

  const handleImageSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleImageRemove = () => {
    setSelectedFile(null);
    setIconUrl('');
  };

  const handleSave = async () => {
    setUploading(true);
    setUploadError(null);
    try {
      let finalIconUrl = iconUrl;

      // Upload image if selected
      if (selectedFile) {
        try {
          const result = await api.uploadFile(selectedFile);
          // General upload returns {url, fileName}
          if ('url' in result) {
            finalIconUrl = result.url;
          }
        } catch (uploadErr) {
          setUploadError('Kunde inte ladda upp bilden');
          logger.error('Failed to upload image:', uploadErr);
          setUploading(false);
          return;
        }
      }

      // Wait for onSave to complete
      await onSave({
        name,
        description,
        ...(showIcon ? { iconUrl: finalIconUrl } : {})
      });
    } catch (err) {
      logger.error('Failed to save:', err);
      setUploadError('Kunde inte spara ändringarna');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              {showIcon ? 'Servernamn' : 'Kanalnamn'}
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Beskrivning
            </label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Valfritt"
            />
          </div>
          {showIcon && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Serverikon
              </label>
              <ImageUpload
                currentImage={iconUrl}
                onImageSelect={handleImageSelect}
                onImageRemove={handleImageRemove}
              />
            </div>
          )}
          {uploadError && <p className="text-sm text-red-400">{uploadError}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={uploading}>
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || uploading}>
            {uploading ? 'Sparar...' : 'Spara'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
