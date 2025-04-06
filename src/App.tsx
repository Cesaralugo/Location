import { useState, useEffect } from 'react';
import { signOut, getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './App.css';
import { type Schema } from '../amplify/data/resource';

// Create API client with the schema
const client = generateClient<Schema>();

function App({ signOut: handleSignOut }) {
  const [user, setUser] = useState<any>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [trackingInterval, setTrackingInterval] = useState<number | null>(null);

  // Get current user on mount
  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    }
    fetchUser();
  }, []);

  // Fetch existing locations on component mount
  useEffect(() => {
    if (user) {
      fetchLocations();
    }
  }, [user]);

  async function fetchLocations() {
    if (!user) return;
    
    try {
      const response = await client.models.LocationRecord.list({
        filter: {
          userId: {
            eq: user.username
          }
        },
        sort: {
          field: 'timestamp',
          direction: 'DESC'
        }
      });
      setLocations(response.data);
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
          if (!user) return;
          
          const newLocation = {
            userId: user.username,
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

  if (!user) {
    return <div>Loading user information...</div>;
  }

  return (
    <div className="app-container">
      <header>
        <h1>Location Tracker</h1>
        <div className="user-info">
          <p>Welcome, {user.username}!</p>
          <button onClick={handleSignOut} className="sign-out-btn">Sign Out</button>
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

export default withAuthenticator(App);

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