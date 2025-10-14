import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

export default function ImageUploader({ onUpload, onCancel }) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload an image file');
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  return (
    <div className="card border-2 border-sac-red shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-sac-red">
        <h3 className="text-lg font-bold text-sac-navy">Upload Damage Photos</h3>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-sac-red transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {!preview ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            dragActive
              ? 'border-sac-red bg-red-50'
              : 'border-gray-300 hover:border-sac-red'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <ImageIcon className={`w-16 h-16 mx-auto mb-4 ${dragActive ? 'text-sac-red' : 'text-gray-400'}`} />
          <p className="text-sac-navy font-semibold mb-2">
            Drag and drop your damage photo here
          </p>
          <p className="text-sm text-gray-500 mb-4">or</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary"
          >
            <Upload className="w-5 h-5 inline mr-2" />
            Browse Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-64 object-cover rounded-lg border-2 border-sac-red"
            />
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleUpload}
              className="btn-primary flex-1"
            >
              Upload Photo
            </button>
            <button
              onClick={() => {
                setPreview(null);
                setSelectedFile(null);
              }}
              className="btn-secondary"
            >
              Choose Different
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-sac-navy mt-3 bg-gray-50 p-2 rounded">
        📸 Please upload clear photos showing the damaged area
      </p>
    </div>
  );
}

