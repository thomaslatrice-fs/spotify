let spotifyToken = null;
let tokenExpiresAt = 0;

async function getSpotifyToken() {
  if (spotifyToken && Date.now() < tokenExpiresAt) {
    return spotifyToken;
  }

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

  spotifyToken = data.access_token;

  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;

  return spotifyToken;
}
