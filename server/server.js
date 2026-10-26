require("dotenv").config();

const cors = require("cors");
const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

const professionGenres = {
  developer: ["lo-fi", "electronic", "ambient"],
  nurse: ["r&b", "pop", "chill"],
  teacher: ["acoustic", "pop", "instrumental"],
  accountant: ["jazz", "classical", "lo-fi"],
  designer: ["indie", "alternative", "electronic"],
  trainer: ["hip-hop", "dance", "pop"],
  writer: ["classical", "ambient", "jazz"],
  chef: ["soul", "funk", "pop"],
};

// Status route
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    message: "WorkVibes API is running",
  });
});

// Get Spotify access token
async function getSpotifyToken() {
  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
  ).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error("Unable to get Spotify access token");
  }

  return data.access_token;
}

// Music recommendations
app.get("/api/recommendations/:profession", async (req, res) => {
  try {
    const profession = req.params.profession.toLowerCase();

    const genres = professionGenres[profession];

    if (!genres) {
      return res.status(404).json({
        success: false,
        message: "Profession not found",
      });
    }

    const selectedGenre = genres[Math.floor(Math.random() * genres.length)];

    const token = await getSpotifyToken();

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=genre:${encodeURIComponent(
        selectedGenre,
      )}&type=track&limit=5&market=US`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.log("Spotify status:", response.status);
      console.log("Spotify response:", data);

      throw new Error("Spotify search failed");
    }

    const tracks = data.tracks.items.map((track) => ({
      name: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      image: track.album.images[0]?.url,
      spotifyUrl: track.external_urls.spotify,
    }));

    res.json({
      success: true,
      profession,
      genre: selectedGenre,
      tracks,
    });
  } catch (error) {
    console.error("Recommendation error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to get recommendations",
    });
  }
});
app.get("/", (req, res) => {
  res.send("WorkVibes API is running");
});
app.listen(PORT, () => {
  console.log(`WorkVibes API running on port ${PORT}`);
});
