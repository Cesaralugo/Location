import { useState, useEffect } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './App.css';
import { type Schema } from '../amplify/data/resource';
import { generateClient } from 'aws-amplify/api';

const client = generateClient<Schema>();

function App() {
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [trackingInterval, setTrackingInterval] = useState<number | null>(null);

  // Fetch locations when component mounts
  useEffect(() => {
    fetchLocations();
  }, []);

  async function fetchLocations() {
    try {
      const response = await client.models.LocationRecord.list();
      const sortedLocations = [...response.data].sort((a,b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setLocations(sortedLocations);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  }

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    const interval = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date().toISOString(),
            accuracy: position.coords.accuracy
          };

          setCurrentLocation(newLocation);

          try {
            await client.models.LocationRecord.create(newLocation);
            fetchLocations();
          } catch (err) {
            console.error('Error saving location:', err);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }, 5000);

    setTrackingInterval(interval);
    setIsTracking(true);
  };

  const stopTracking = () => {
    if (trackingInterval) {
      window.clearInterval(trackingInterval);
      setTrackingInterval(null);
      setIsTracking(false);
    }
  };

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="app-container">
          <header>
            <h1>Location Tracker</h1>
            <div className="user-info">
              <p>Logged in as: {user?.username}</p>
              <button onClick={signOut}>Sign out</button>
            </div>
          </header>

          <main>
            <div className="tracking-controls">
              {!isTracking ? (
                <button onClick={startTracking} className="start-btn">
                  Start Tracking
                </button>
              ) : (
                <button onClick={stopTracking} className="stop-btn">
                  Stop Tracking
                </button>
              )}
            </div>

        {currentLocation && (
          <div className="current-location">
            <h2>Current Location</h2>
            <div className="location-details">
              <p><strong>Latitude:</strong> {currentLocation.latitude.toFixed(6)}</p>
              <p><strong>Longitude:</strong> {currentLocation.longitude.toFixed(6)}</p>
              <p><strong>Time:</strong> {new Date(currentLocation.timestamp).toLocaleString()}</p>
              <p><strong>Accuracy:</strong> {currentLocation.accuracy?.toFixed(2) || 'N/A'} meters</p>
            </div>
          </div>
        )}

        <div className="location-history">
          <h2>Location History</h2>
          {locations.length === 0 ? (
            <p className="no-data">No location data available yet</p>
          ) : (
            <div className="locations-list">
              {locations.map((location) => (
                <div key={location.id} className="location-item">
                  <p><strong>Latitude:</strong> {location.latitude.toFixed(6)}</p>
                  <p><strong>Longitude:</strong> {location.longitude.toFixed(6)}</p>
                  <p><strong>Time:</strong> {new Date(location.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
          </main>
        </div>
      )}
    </Authenticator>
  );
}

export default App;

/*import { useState, useEffect } from 'react';
import '@aws-amplify/ui-react/styles.css';
import './App.css';
import { type Schema } from '../amplify/data/resource';
import { generateClient } from 'aws-amplify/api';
import { Authenticator } from '@aws-amplify/ui-react';
// Create API client with the schema
const client = generateClient<Schema>();

function App() {
  const [userId, setUserId] = useState<string>('default-user'); // Provide a default user ID or let user input it
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [trackingInterval, setTrackingInterval] = useState<number | null>(null);

  // Fetch existing locations on component mount
  useEffect(() => {
    fetchLocations();
  }, []);

  async function fetchLocations() {
    try {
      const response = await client.models.LocationRecord.list({
        filter: {
          userId: {
            eq: userId
          }
        }
      });
      const sortedLocations = [...response.data].sort((a,b)=>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setLocations(sortedLocations);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  }

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    // Start tracking interval
    const interval = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const newLocation = {
            userId: userId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date().toISOString(),
            accuracy: position.coords.accuracy
          };

          setCurrentLocation(newLocation);

          // Save to DynamoDB
          try {
            await client.models.LocationRecord.create(newLocation);
            fetchLocations(); // Refresh the list
          } catch (err) {
            console.error('Error saving location:', err);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          alert(`Error getting location: ${error.message}`);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }, 5000);

    setTrackingInterval(interval);
    setIsTracking(true);
  };

  const stopTracking = () => {
    if (trackingInterval) {
      window.clearInterval(trackingInterval);
      setTrackingInterval(null);
      setIsTracking(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>Location Tracker</h1>
        <div className="user-info">
          <input 
            type="text" 
            value={userId} 
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter User ID" 
          />
        </div>
      </header>

      <main>
        <div className="tracking-controls">
          {!isTracking ? (
            <button onClick={startTracking} className="start-btn">
              Start Tracking
            </button>
          ) : (
            <button onClick={stopTracking} className="stop-btn">
              Stop Tracking
            </button>
          )}
        </div>

        {currentLocation && (
          <div className="current-location">
            <h2>Current Location</h2>
            <div className="location-details">
              <p><strong>Latitude:</strong> {currentLocation.latitude.toFixed(6)}</p>
              <p><strong>Longitude:</strong> {currentLocation.longitude.toFixed(6)}</p>
              <p><strong>Time:</strong> {new Date(currentLocation.timestamp).toLocaleString()}</p>
              <p><strong>Accuracy:</strong> {currentLocation.accuracy?.toFixed(2) || 'N/A'} meters</p>
            </div>
          </div>
        )}

        <div className="location-history">
          <h2>Location History</h2>
          {locations.length === 0 ? (
            <p className="no-data">No location data available yet</p>
          ) : (
            <div className="locations-list">
              {locations.map((location) => (
                <div key={location.id} className="location-item">
                  <p><strong>Latitude:</strong> {location.latitude.toFixed(6)}</p>
                  <p><strong>Longitude:</strong> {location.longitude.toFixed(6)}</p>
                  <p><strong>Time:</strong> {new Date(location.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
/*

/*
import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);

  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }, []);

  function createTodo() {
    client.models.Todo.create({ content: window.prompt("Todo content") });
  }

  return (
    <main>
      <h1>My todos</h1>
      <button onClick={createTodo}>+ new</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.content}</li>
        ))}
      </ul>
      <div>
        🥳 App successfully hosted. Try creating a new todo.
        <br />
        <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates">
          Review next step of this tutorial.
        </a>
      </div>
    </main>
  );
}

export default App;
*/