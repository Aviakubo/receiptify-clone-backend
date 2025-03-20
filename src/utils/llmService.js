// backend/src/utils/llmService.js
const axios = require('axios');

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY; // Free API key from Hugging Face

// Function to generate music taste analysis
const generateMusicTasteAnalysis = async (formattedData) => {
  try {
    const prompt = `Analyze this Spotify listening data and provide insights about the user's music taste. 
    Be creative, thoughtful and personalized in your analysis. Structure your response like a receipt with
    sections for main genres, mood tendencies, listening patterns, and any interesting observations.
    
    Top Tracks:
    ${JSON.stringify(formattedData.tracks.slice(0, 20), null, 2)}
    
    Top Artists:
    ${JSON.stringify(formattedData.artists.slice(0, 10), null, 2)}
    
    Provide your analysis in the following format:
    1. Music Personality: A one-line description of their overall music personality
    2. Main Genres: List the top genres they listen to with percentages
    3. Mood Analysis: Describe the emotional tendency of their music
    4. Hidden Gems: Mention any less-popular artists or tracks that stand out
    5. Music Receipt: Format the insights like a store receipt with total "emotional value"
    `;
    
    // Using one of the free, capable models on Hugging Face
    const response = await axios({
      url: "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      data: {
        inputs: prompt,
        parameters: {
          max_new_tokens: 1000,
          return_full_text: false
        }
      },
    });
    
    return response.data[0].generated_text;
    
  } catch (error) {
    console.error('Error generating music taste analysis:', error);
    throw new Error('Failed to generate music taste analysis');
  }
};