import React, { useState } from 'react';
import api from '../utils/api';

function FileUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFile(null);
      setError('');
      onUploadSuccess();
    } catch (error) {
      setError('File upload failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="error">{error}</p>}
      <input type="file" onChange={handleFileChange} accept=".geojson,.kml" />
      <button type="submit">Upload</button>
    </form>
  );
}

export default FileUpload;