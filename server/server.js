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

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required in .env");
}

// Start Spotify authorization.
app.get("/auth/spotify", (req, res) => {
  const state = crypto.randomBytes(32).toString("hex");

  res.cookie("spotify_state", state, {
    ...cookieOptions,
    maxAge: 10 * 60 * 1000,
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    state,
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
});

// Handle the response from Spotify.
app.get("/auth/spotify/callback", async (req, res) => {
  const { code, state, error } = req.query;
  const savedState = req.cookies.spotify_state;

  res.clearCookie("spotify_state", cookieOptions);

  if (typeof state !== "string" || !savedState || state !== savedState) {
    return res.status(400).send("Invalid login request. Please try again.");
  }

  if (error || typeof code !== "string") {
    return res.status(400).send("Spotify login was cancelled or unsuccessful.");
  }

  try {
    const credentials = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
    ).toString("base64");

    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        }),
      },
    );

    if (!tokenResponse.ok) {
      throw new Error("Spotify token exchange failed");
    }

    const tokenData = await tokenResponse.json();

    const profileResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      throw new Error("Unable to retrieve Spotify profile");
    }

    const profile = await profileResponse.json();

    if (!profile.id) {
      throw new Error("Spotify profile is missing its user ID");
    }

    const token = jwt.sign(
      {
        name: profile.display_name || "WorkVibes listener",
      },
      process.env.JWT_SECRET,
      {
        algorithm: "HS256",
        subject: profile.id,
        expiresIn: "1h",
      },
    );

    res.cookie("workvibes_token", token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 1000,
    });

    res.redirect("/");
  } catch (error) {
    console.error("Spotify login failed:", error.message);
    res.status(502).send("Unable to sign in. Please try again.");
  }
});

// Check the application's JWT.
function readLogin(req) {
  try {
    return jwt.verify(req.cookies.workvibes_token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch {
    return null;
  }
}

app.get("/api/auth/status", (req, res) => {
  res.set("Cache-Control", "no-store");

  const user = readLogin(req);

  res.json({
    authenticated: Boolean(user),
    user: user ? { id: user.sub, name: user.name } : null,
  });
});

// Require a valid JWT for protected API routes.
function requireAuth(req, res, next) {
  const user = readLogin(req);

  if (!user) {
    return res.status(401).json({
      success: false,
      authenticated: false,
      message: "Please log in.",
    });
  }

  req.user = user;
  next();
}

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("workvibes_token", cookieOptions);
  res.json({ success: true });
});

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
app.get("/api/recommendations/:profession", requireAuth, async (req, res) => {
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

app.use(express.static(path.join(__dirname, "../frontend")));
app.listen(PORT, () => {
  console.log(`WorkVibes API running on port ${PORT}`);
});
