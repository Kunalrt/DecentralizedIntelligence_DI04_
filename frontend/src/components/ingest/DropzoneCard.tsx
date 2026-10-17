import React, { useRef, useState } from 'react';
import { Check, AlertCircle, X, Upload } from 'lucide-react';
import { Badge } from '../../design';

interface DropzoneCardProps {
  title: string;
  icon: React.ReactNode;
  acceptExtensions: string[];
  description: string;
  file: File | null;
  onFileSelect: (file: File | null) => void;
  error?: string | null;
  required?: boolean;
}

export const DropzoneCard: React.FC<DropzoneCardProps> = ({
  title,
  icon,
  acceptExtensions,
  description,
  file,
  onFileSelect,
  error,
  required = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragover' || e.type === 'dragenter') {
      setIsDragOver(true);
    } else if (e.type === 'dragleave') {
      setIsDragOver(false);
    }
  };

  const validateAndSet = (incoming: File) => {
    const name = incoming.name.toLowerCase();
    const matches = acceptExtensions.some((ext) => name.endsWith(ext.toLowerCase()));
    if (!matches) {
      onFileSelect(null);
      return;
    }
    onFileSelect(incoming);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSet(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSet(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border rounded-[4px] p-4 flex flex-col justify-between transition-colors cursor-pointer bg-white ${
        isDragOver
          ? 'border-[#1F4E5F] bg-[#FAF9F5]'
          : file
          ? 'border-[#16A34A] bg-[#FAFDFB]'
          : error
          ? 'border-[#DC2626] bg-[#FEF2F2]'
          : 'border-[#D9D6CE] hover:border-[#1F4E5F] hover:bg-[#FAF9F5]'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={acceptExtensions.join(',')}
        onChange={handleChange}
      />

      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-[2px] bg-[#FAF9F5] border border-[#D9D6CE] text-[#1F4E5F]">
            {icon}
          </span>
          <span className="font-serif font-bold text-sm text-[#1F2328]">{title}</span>
        </div>
        <div>
          {file ? (
            <Badge variant="success" icon={<Check size={12} strokeWidth={2} />}>
              Valid
            </Badge>
          ) : (
            <Badge variant="outline">{required ? 'Required' : 'Optional'}</Badge>
          )}
        </div>
      </div>

      {/* Central Drop Body */}
      <div className="py-4 text-center">
        {file ? (
          <div className="space-y-1">
            <div className="text-xs font-mono font-semibold text-[#1F2328] truncate px-2">
              {file.name}
            </div>
            <div className="text-2xs font-mono text-[#656D76]">
              {formatFileSize(file.size)}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <Upload size={22} strokeWidth={1.5} className="mx-auto text-[#656D76] mb-1.5" />
            <div className="text-xs text-[#1F2328] font-medium">
              Click or drag file here
            </div>
            <div className="text-2xs text-[#656D76]">{description}</div>
          </div>
        )}
      </div>

      {/* Bottom Formats & Error */}
      <div className="pt-2 border-t border-[#D9D6CE]/60">
        {error ? (
          <div className="flex items-center gap-1.5 text-2xs text-[#DC2626]">
            <AlertCircle size={13} strokeWidth={1.5} className="flex-shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        ) : file ? (
          <div className="flex items-center justify-between text-2xs">
            <span className="text-[#16A34A] font-medium">Ready for pipeline</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFileSelect(null);
              }}
              className="p-0.5 text-[#656D76] hover:text-[#DC2626] rounded focus:outline-none"
              title="Remove file"
            >
              <X size={13} strokeWidth={1.5} />
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1">
            {acceptExtensions.map((ext) => (
              <span
                key={ext}
                className="px-1.5 py-0.2 rounded-[2px] bg-[#ECEAE4] text-[#1F2328] font-mono text-2xs"
              >
                {ext}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
