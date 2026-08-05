import { useRef, useState, useCallback, type DragEvent } from 'react';
import { Upload, X, FileText } from 'lucide-react';

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
}

export function CVUploadDropzone({ files, onChange, maxFiles = 50 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ext === 'pdf' || ext === 'docx' || ext === 'doc';
    });
    onChange([...files, ...valid].slice(0, maxFiles));
  }, [files, maxFiles, onChange]);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl p-8 text-center transition-all border-2 border-dashed ${
          isDragging
            ? 'bg-slate-100 dark:bg-white/10 border-slate-900 dark:border-white'
            : 'bg-gray-50 dark:bg-white/5 border-gray-300 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/20'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc"
          className="hidden"
          onChange={e => addFiles(e.target.files)}
        />
        <Upload size={32} className={`mx-auto mb-3 ${isDragging ? 'text-slate-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`} />
        <p className="text-gray-900 dark:text-white font-bold text-sm">Drop candidate CV files here or click to browse</p>
        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">PDF, DOCX · up to {maxFiles} files · 10 MB per file</p>
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <FileText size={15} className="text-slate-700 dark:text-slate-300 shrink-0" />
              <span className="text-gray-900 dark:text-white text-xs font-medium flex-1 truncate">{file.name}</span>
              <span className="text-gray-400 dark:text-gray-500 text-xs shrink-0 font-mono">{(file.size / 1024).toFixed(0)} KB</span>
              <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-red-500 hover:text-red-700 transition-colors p-1">
                <X size={14} />
              </button>
            </div>
          ))}
          <p className="text-xs text-gray-500 dark:text-gray-400 text-right font-medium">{files.length}/{maxFiles} files selected</p>
        </div>
      )}
    </div>
  );
}
