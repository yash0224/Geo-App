import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, FeatureGroup, GeoJSON } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import api from '../utils/api';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

function FileViewer() {
  const [file, setFile] = useState(null);
  const [geoJSONContent, setGeoJSONContent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedGeoJSON, setEditedGeoJSON] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const mapRef = useRef();

  useEffect(() => {
    fetchFileContent();
  }, [id]);

  const fetchFileContent = async () => {
    try {
      const response = await api.get(`/files/${id}/content`);
      setFile(response.data.file);
      const parsedGeoJSON = JSON.parse(response.data.content);
      setGeoJSONContent(parsedGeoJSON);
      setEditedGeoJSON(parsedGeoJSON);
    } catch (error) {
      console.error('Failed to fetch file content', error);
    }
  };

  const handleClose = () => {
    navigate('/dashboard');
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCreated = (e) => {
    const { layer } = e;
    const newFeature = layer.toGeoJSON();
    setEditedGeoJSON((prevGeoJSON) => ({
      ...prevGeoJSON,
      features: prevGeoJSON?.features ? [...prevGeoJSON.features, newFeature] : [newFeature],
    }));
  };

  const handleEdited = (e) => {
    const { layers } = e;
    const updatedFeatures = editedGeoJSON?.features.map((feature) => {
      const updatedLayer = layers.getLayers().find((layer) => layer.feature.id === feature.id);
      return updatedLayer ? updatedLayer.toGeoJSON() : feature;
    });
    setEditedGeoJSON({ ...editedGeoJSON, features: updatedFeatures });
  };

  const handleDeleted = (e) => {
    const { layers } = e;
    const deletedIds = layers.getLayers().map((layer) => layer.feature.id);
    setEditedGeoJSON((prevGeoJSON) => ({
      ...prevGeoJSON,
      features: prevGeoJSON?.features.filter((feature) => !deletedIds.includes(feature.id)),
    }));
  };

  const handleSave = async () => {
    try {
      await api.put(`/files/${id}/content`, {
        content: JSON.stringify(editedGeoJSON),
      });
      setGeoJSONContent(editedGeoJSON);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save file content', error);
    }
  };

  const handleCancel = () => {
    setEditedGeoJSON(geoJSONContent);
    setIsEditing(false);
  };

  // if (!file || !geoJSONContent) {
  //   return <div>Loading...</div>;
  // }

  return (
    <div>
      <h2>{file?.Name || 'Loading..'}</h2>
      <MapContainer
        center={[0, 0]}
        zoom={2}
        style={{ height: '400px', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FeatureGroup>
          {isEditing && (
            <EditControl
              position="topright"
              onCreated={handleCreated}
              onEdited={handleEdited}
              onDeleted={handleDeleted}
              draw={{
                rectangle: true,
                polygon: true,
                circle: false,
                circlemarker: false,
                marker: true,
                polyline: true,
              }}
            />
          )}
          {/* {geoJSONContent?.features && <GeoJSON data={isEditing ? editedGeoJSON : geoJSONContent} />} */}
        </FeatureGroup>
      </MapContainer>
      <div>
        {!isEditing && <button onClick={handleEdit}>Edit</button>}
        {isEditing && (
          <>
            <button onClick={handleSave}>Save</button>
            <button onClick={handleCancel}>Cancel</button>
          </>
        )}
        <button onClick={handleClose}>Close</button>
      </div>
    </div>
  );
}

export default FileViewer;
