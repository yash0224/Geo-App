# GeoData Management System

## Overview

The GeoData Management System is a web-based application designed to help users upload, view, edit, and manage geographical data. It provides an intuitive interface for working with GeoJSON files and custom shapes, making it easier for organizations to handle spatial data.

## Features

- User authentication system
- File upload for GeoJSON data
- Interactive map for viewing and editing geographical shapes
- Dashboard for managing uploaded files and custom shapes
- Ability to add, edit, and delete custom attributes for shapes

## How It Works

### 1. User Authentication

- Users can register for an account or log in to an existing one.
- Authentication is required to access the main features of the application.

### 2. Dashboard

- After logging in, users are directed to the dashboard.
- The dashboard displays a list of uploaded files and custom shapes.
- Users can view, edit, or delete existing items from here.

### 3. File Upload

- Users can upload GeoJSON files through the dashboard.
- Uploaded files are stored and can be viewed or used to create new shapes.

### 4. Map View

- The Map View provides an interactive map interface.
- Users can see all their shapes and uploaded GeoJSON data visualized on the map.
- Clicking on a shape opens a popup with basic information and an edit option.

### 5. Shape Editor

- Users can create new shapes or edit existing ones.
- The Shape Editor provides tools to modify the geometry of a shape.
- Custom attributes can be added, edited, or removed for each shape.
- Changes are saved back to the server and reflected in the dashboard and map view.

### 6. GeoJSON Viewer

- Users can view the content of uploaded GeoJSON files.
- The viewer displays the file on a map and shows the raw JSON data.

## Technical Stack

- Frontend: React.js with React Router for navigation
- Map Visualization: React Leaflet
- Backend: Go
- Database: MySQL

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up your backend server and database `go run main.go`
4. Configure the API endpoint in the frontend code
5. Run the development server with `npm start`

## API Endpoints

- `POST /login`: User login
- `POST /register`: User registration
- `GET /files`: Fetch list of uploaded files
- `POST /upload`: Upload a new GeoJSON file
- `GET /files/:id/content`: Fetch content of a specific file
- `GET /shapes`: Fetch list of custom shapes
- `POST /shapes`: Create a new shape
- `GET /shapes/:id`: Fetch a specific shape
- `PUT /shapes/:id`: Update a specific shape
- `DELETE /shapes/:id`: Delete a specific shape

## Contributing

We welcome contributions to the GeoData Management System. Please read our contributing guidelines before submitting pull requests.

## License

[Your chosen license, e.g., MIT License]
