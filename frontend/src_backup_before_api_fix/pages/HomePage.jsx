import React, { useState, useEffect } from 'react';

const HomePage = () => {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Coordinates and other constants
  const LOCATION = '37.7749,-122.4194'; // San Francisco coordinates
  const RADIUS = 5000; // Search within 5km radius

  useEffect(() => {
    const fetchPlaces = async () => {
      setLoading(true);
      try {
        // Backend API call
        const url = `/api/places?lat=37.7749&lng=-122.4194`;

        // Fetch data from backend
        const response = await fetch(url);

        // Check if response is successful
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();

        console.log("API Response:", data); // Log the API response

        // If the response is OK, update the institutes state
        if (data.status === 'OK') {
          setInstitutes(data.results);
        } else {
          setError('Error fetching places: ' + data.status);
        }
      } catch (err) {
        setError('Failed to fetch data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    // Trigger the function to fetch places
    fetchPlaces();
  }, []);

  // If still loading
  if (loading) return <div>Loading institutes...</div>;

  // If there's an error
  if (error) return <div>{error}</div>;

  return (
    <div className="home-page bg-white dark:bg-gray-900 text-black dark:text-white min-h-screen">
      <div className="container mx-auto p-6">
        {/* Header Section */}
        <header className="text-center py-10 bg-teal-500 text-white rounded-lg shadow-lg">
          <h1 className="text-4xl font-bold mb-4">Welcome to Coaching Finder</h1>
          <p className="text-xl">Find the best coaching institutes near you.</p>
        </header>

        {/* Institutes Section */}
        <section className="my-10">
          <h2 className="text-2xl font-semibold text-teal-600 mb-4 text-center">Featured Coaching Institutes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {institutes.map((place) => (
              <div key={place.place_id} className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                <img
                  src={
                    place.photos ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=YOUR_GOOGLE_API_KEY` : 'https://via.placeholder.com/400'
                  }
                  alt={place.name}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-teal-600">{place.name}</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{place.vicinity}</p>
                  <button className="bg-teal-500 text-white py-2 px-4 rounded-lg">View Details</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;