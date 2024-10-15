import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import FileUpload from './FileUpload';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css'; // Import the CSS

function Dashboard() {
  const [files, setFiles] = useState([]);
  const [shapes, setShapes] = useState([]);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFiles();
    fetchShapes();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await api.get('/files');
      setFiles(response.data);
    } catch (error) {
      console.error('Failed to fetch files', error);
    }
  };

  const fetchShapes = async () => {
    try {
      const response = await api.get('/shapes');
      setShapes(response.data);
    } catch (error) {
      console.error('Failed to fetch shapes', error);
    }
  };

  const handleFileUpload = () => {
    fetchFiles();
  };

  const handleFileClick = (fileId) => {
    navigate(`/files/${fileId}`);
  };

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <p>Authentication status: {isAuthenticated ? 'Logged in' : 'Not logged in'}</p>

      <div className="file-upload">
        <FileUpload onUploadSuccess={handleFileUpload} />
      </div>

      <h2>Files</h2>
      <ul>
        {files.map((file) => (
          <li key={file.ID}>
            <button onClick={() => handleFileClick(file.ID)}>View Details</button>
          </li>
        ))}
      </ul>

      <h2>Shapes</h2>
      <ul>
        {shapes.map((shape) => (
          <li key={shape.ID}>
            {shape.Name}
            <Link to={`/shapes/${shape.ID}/edit`} className="link-button">Edit</Link>
          </li>
        ))}
      </ul>
      <div><span>--------------------------------------------------------------------</span></div>
      <Link to="/map" className="map-link">Go to Map</Link>
    </div>
  );
}

export default Dashboard;
