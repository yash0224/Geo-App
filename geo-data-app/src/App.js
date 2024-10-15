// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
// import PrivateRoute from './components/PrivateRoute';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import MapView from './components/MapView';
import Navbar from './components/Navbar';
import FileViewer from './components/FileViewer';
import ShapeEditor from './components/ShapeEditor'; // Import ShapeEditor
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Private Routes */}
            <Route
              path="/dashboard"
              element={
                // <PrivateRoute>
                  <Dashboard />
                // </PrivateRoute>
              }
            />
            <Route
              path="/map"
              element={
                // <PrivateRoute>
                  <MapView />
                // </PrivateRoute>
              }
            />
            <Route
              path="/shapes/:id/edit" // New route for ShapeEditor
              element={<ShapeEditor />} 
            />
            <Route path="/files/:id" element={<FileViewer />} />

            {/* Redirect from root to login */}
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
