import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, GeoJSON } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import api from '../utils/api';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

function MapView() {
  const [shapes, setShapes] = useState([]);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchShapes();
    fetchFiles();
  }, []);

  const fetchShapes = async () => {
    try {
      const response = await api.get('/shapes');
      setShapes(response.data);
    } catch (error) {
      console.error('Failed to fetch shapes', error);
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await api.get('/files');
      setFiles(response.data);
    } catch (error) {
      console.error('Failed to fetch files', error);
    }
  };

  const handleCreated = async (e) => {
    const { layer } = e;
    const geoJSON = layer.toGeoJSON();
    try {
      await api.post('/shapes', {
        name: 'New Shape',
        geometry: JSON.stringify(geoJSON.geometry),
      });
      fetchShapes(); // Refresh shapes after successful creation
    } catch (error) {
      console.error('Failed to create shape', error);
    }
  };

  const handleEdited = async (e) => {
    const { layers } = e;
    layers.eachLayer(async (layer) => {
      const geoJSON = layer.toGeoJSON();
      try {
        await api.put(`/shapes/${layer.feature.id}`, {
          geometry: JSON.stringify(geoJSON.geometry),
        });
        fetchShapes(); // Refresh shapes after successful edit
      } catch (error) {
        console.error('Failed to update shape', error);
      }
    });
  };

  const handleDeleted = async (e) => {
    const { layers } = e;
    layers.eachLayer(async (layer) => {
      try {
        await api.delete(`/shapes/${layer.feature.id}`);
        fetchShapes(); // Refresh shapes after deletion
      } catch (error) {
        console.error('Failed to delete shape', error);
      }
    });
  };

  return (
    <MapContainer center={[0, 0]} zoom={2} style={{ height: '500px', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FeatureGroup>
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
        {/* Safely handle GeoJSON parsing */}
        {/* {shapes.map((shape) => {
          try {
            const geometry = JSON.parse(shape.Geometry);
            return (
              <GeoJSON
                key={shape.ID}
                data={geometry}
                onEachFeature={(feature, layer) => {
                  layer.bindPopup(`
                    <strong>${shape.Name}</strong><br>
                    <a href="/shapes/${shape.ID}/edit">Edit</a>
                  `);
                }}
              />
            );
          } catch (error) {
            console.error('Error parsing shape geometry:', error);
            return null; // Skip this shape if parsing fails
          }
        })}
        {files.map((file) => {
          if (file.Data) {
            try {
              const geometry = JSON.parse(file.Data);
              return <GeoJSON key={file.ID} data={geometry} />;
            } catch (error) {
              console.error('Error parsing file data:', error);
              return null; // Skip this file if parsing fails
            }
          }
          return null; // Skip if Data is undefined
        })} */}
      </FeatureGroup>
    </MapContainer>
  );
}

export default MapView;
