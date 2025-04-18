// src/App.tsx
import { useState, useEffect, useCallback } from 'react';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { IoTDataPlaneClient, PublishCommand } from '@aws-sdk/client-iot-data-plane';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { amplifyConfig } from './aws-iot-config';

function LocationTracker() {
  const { user, signOut } = useAuthenticator();
  const [iotClient, setIoTClient] = useState<IoTDataPlaneClient | null>(null);

  useEffect(() => {
    const initClient = async () => {
      const client = new IoTDataPlaneClient({
        region: amplifyConfig.region,
        credentials: fromCognitoIdentityPool({
          client: new CognitoIdentityClient({ region: awsConfig.region }),
          identityPoolId: amplifyConfig.identityPoolId,
          logins: {
            [`cognito-idp.${amplifyConfig.region}.amazonaws.com/${awsConfig.userPoolId}`]: 
              user?.getSignInUserSession()?.getIdToken().getJwtToken() || ''
          }
        })
      });
      setIoTClient(client);
    };

    if (user) initClient();
  }, [user]);

  const publishLocation = useCallback(async (coords: GeolocationCoordinates) => {
    if (!iotClient || !user) return;

    await iotClient.send(new PublishCommand({
      topic: `location/${user.username}`,
      payload: new TextEncoder().encode(JSON.stringify({
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: new Date().toISOString()
      }))
    }));
  }, [iotClient, user]);

  // ... rest of your component
}

export default function App() {
  return (
    <Authenticator>
      <LocationTracker/>
    </Authenticator>
  );
}


/*import { useState, useEffect } from 'react';
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
*/