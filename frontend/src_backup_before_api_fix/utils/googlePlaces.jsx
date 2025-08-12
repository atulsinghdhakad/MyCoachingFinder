import axios from 'axios';

// Using the provided API Key
const GOOGLE_API_KEY = 'AIzaSyAH6mWdLBslsIZG1ESed3JNo4psMKelUK0'; // Replace with your actual API key

export const fetchCoachingInstitutes = async (location) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/textsearch/json`, {
        params: {
          query: 'coaching institutes in ' + location,
          key: GOOGLE_API_KEY,
        }
      });
    return response.data.results;
  } catch (error) {
    console.error('Error fetching data from Google Places API:', error);
    return [];
  }
};