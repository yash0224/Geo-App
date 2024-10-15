import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, FeatureGroup, GeoJSON } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import api from '../utils/api';

function ShapeEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shape, setShape] = useState(null);
  const [name, setName] = useState('');
  const [attributes, setAttributes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchShape = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/shape/${id}`);
      setShape(response.data);
      setName(response.data.Name || '');
      
      // Safely parse attributes, using an empty object as fallback
      let parsedAttributes = {};
      try {
        parsedAttributes = JSON.parse(response.data.Attributes || '{}');
      } catch (parseError) {
        console.error('Failed to parse attributes:', parseError);
        setError('Failed to parse shape attributes. Using empty object as fallback.');
      }
      setAttributes(parsedAttributes);
    } catch (error) {
      console.error('Failed to fetch shape', error);
      setError('Failed to fetch shape data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchShape();
  }, [id, fetchShape]);

  const handleGeometryEdit = (e) => {
    const { layers } = e;
    layers.eachLayer((layer) => {
      const geoJSON = layer.toGeoJSON();
      setShape((prevShape) => ({
        ...prevShape,
        Geometry: JSON.stringify(geoJSON.geometry)
      }));
    });
  };
  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handleAttributeChange = (key, value) => {
    setAttributes((prevAttributes) => ({
      ...prevAttributes,
      [key]: value
    }));
  };

  const handleAddAttribute = () => {
    setAttributes((prevAttributes) => ({
      ...prevAttributes,
      ['new_' + Object.keys(prevAttributes).length]: ''
    }));
  };

  const handleRemoveAttribute = (key) => {
    setAttributes((prevAttributes) => {
      const newAttributes = { ...prevAttributes };
      delete newAttributes[key];
      return newAttributes;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.put(`/shapes/${id}`, {
        Name: name,
        Geometry: shape.Geometry,
        Attributes: JSON.stringify(attributes),
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to update shape', error);
      setError('Failed to update shape. Please try again later.');
    } finally {
      setLoading(false);
    }
  };



if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!shape || !shape.ID) {
    return <div>No valid shape data available.</div>;
  }

  return (
    <div className="shape-editor">
      <h1>Edit Shape</h1>
      <form onSubmit={handleSubmit}>
      <div>
          <label htmlFor="shapeName">Name:</label>
          <input
            id="shapeName"
            type="text"
            value={name}
            onChange={handleNameChange}
          />
        </div>
        <div>
          <h3>Attributes</h3>
          {Object.entries(attributes).map(([key, value]) => (
            <div key={key} className="attribute-row">
              <input
                type="text"
                value={key}
                onChange={(e) => {
                  const newKey = e.target.value;
                  if (newKey !== key) {
                    setAttributes((prevAttributes) => {
                      const newAttributes = { ...prevAttributes };
                      delete newAttributes[key];
                      newAttributes[newKey] = value;
                      return newAttributes;
                    });
                  }
                }}
              />
              <input
                type="text"
                value={value}
                onChange={(e) => handleAttributeChange(key, e.target.value)}
              />
              <button type="button" onClick={() => handleRemoveAttribute(key)}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={handleAddAttribute}>
            Add Attribute
          </button>
        </div>
        <div className="map-container">
          <MapContainer
            center={[0, 0]}
            zoom={2}
            style={{ height: '400px', width: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <FeatureGroup>
              <EditControl
                position="topright"
                onEdited={handleGeometryEdit}
                draw={{
                  rectangle: true,
                  polygon: true,
                  circle: true,
                  circlemarker: true,
                  marker: true,
                  polyline: true,
                }}
                edit={{
                  edit: true,
                  remove: true,
                }}
              />
              {shape.Geometry && (
                <GeoJSON data={JSON.parse(shape.Geometry)} />
              )}
            </FeatureGroup>
          </MapContainer>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

export default ShapeEditor;