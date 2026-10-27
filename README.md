WorkVibes
Music that matches your 9-to-5.
Project Overview
WorkVibes is a Spotify-powered web application developed for Project Portfolio III at Full Sail University. Users sign in with Spotify, select their profession, and discover songs that fit their workday.

The backend maps each profession to a list of genres, randomly selects one genre, and searches Spotify for up to five tracks. These are genre-based suggestions, rather than personalized recommendations based on listening history.
Features
- Spotify account authorization using the Authorization Code flow.
- A WorkVibes JWT stored in an HTTP-only cookie with a one-hour expiration.
- A login page and frontend session checks.
- Protected recommendations API that rejects missing, expired, or invalid JWTs.
- Logout that clears the application's login cookie.
- Eight professions: Developer, Nurse, Teacher, Accountant, Designer, Trainer, Writer, and Chef.
- Track cards with song title, artist, album, artwork, and a link to Spotify.
- Loading and error messages.
Technology
- Frontend: HTML, CSS, and vanilla JavaScript.
- Backend: Node.js and Express.
- Authentication: jsonwebtoken, cookie-parser, and Node.js crypto.
- Configuration: dotenv.
- Development: nodemon.
- External service: Spotify Web API.
Express serves both the frontend and API on port 3001. A separate frontend development server is not required.
Prerequisites
- A currently supported Node.js LTS release with built-in fetch support.
- npm and Git.
- A modern web browser.
- A Spotify account and a Spotify Developer application.
- Spotify Client ID and Client Secret.
- Internet access for Spotify authorization and API requests.
The server uses Node.js's built-in fetch function; Node.js 16 is not sufficient without additional changes.
Getting Started
1. Clone the repository
git clone https://github.com/thomaslatrice-fs/spotify.git
cd spotify
npm install
Run these commands from the project root containing package.json.
2. Create your environment file
Create a file named .env in the project root and add your own values:
PORT=3001
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3001/auth/spotify/callback
JWT_SECRET=your_generated_random_secret
Generate a JWT signing secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
Copy the generated value into JWT_SECRET. Keep .env out of version control. Example configuration files must contain placeholders only. If a credential has been committed or exposed, rotate it in the provider dashboard; deleting it from a file does not invalidate the old credential.
3. Configure Spotify
Open your application in the Spotify Developer Dashboard. Add and save this exact Redirect URI:
http://127.0.0.1:3001/auth/spotify/callback
Use the same Spotify application whose Client ID is in .env. The redirect URI must match the configured value, including protocol, host, port, path, and trailing-slash behavior. Ensure the account used for testing is permitted by your Spotify application's development-mode settings.
4. Start the application
For development:
npm run dev
To start without nodemon:
npm start
Open WorkVibes. Use 127.0.0.1 consistently rather than switching between it and localhost, because login cookies belong to the host that created them.

Restart the server after changing .env.
5. Use WorkVibes
1. Open the homepage. Logged-out visitors are redirected to the login page.
2. Click Log in with Spotify and complete authorization.
3. Choose a profession and click Find My Work Vibe.
4. Browse the returned tracks and use Listen on Spotify to open a song.
5. Click Log out to clear the WorkVibes session.
Authentication Flow
1. The login link opens GET /auth/spotify.
2. The backend creates a random state value and stores it in a temporary HTTP-only cookie.
3. Spotify returns an authorization code to /auth/spotify/callback.
4. The backend validates state, exchanges the code for a Spotify access token, and retrieves the user's profile.
5. WorkVibes signs its own JWT and stores it in the workvibes_token cookie.
6. The frontend checks /api/auth/status before revealing the homepage.
7. Protected API requests validate the JWT on the server.
The Spotify access token and WorkVibes JWT are different tokens. The JWT establishes the application's login session. Recommendation searches currently use a separate Spotify Client Credentials access token, not the user's authorization token.

The temporary state cookie lasts ten minutes. The WorkVibes login lasts one hour. Cookies use HTTP-only and SameSite=Lax settings; Secure is enabled when NODE_ENV is production, which requires HTTPS.
API Routes
Method	Route	Purpose	Login required
GET	/api/status	Check that the backend is running	No
GET	/auth/spotify	Start Spotify authorization	No
GET	/auth/spotify/callback	Process authorization and issue the JWT	OAuth state validation
GET	/api/auth/status	Return login status and basic user information	No
POST	/api/auth/logout	Clear the WorkVibes login cookie	No
GET	/api/recommendations/:profession	Return genre-based track suggestions	Yes


A logged-out status response is:
{
  "authenticated": false,
  "user": null
}
The recommendations route returns HTTP 401 without a valid JWT, HTTP 404 for an unsupported profession after authentication, and HTTP 500 if recommendation retrieval fails.
Project Structure
Path	Purpose
frontend/index.html	Profession selection and recommendations page
frontend/login.html	Spotify login screen
frontend/script.js	Session checks, logout, and recommendation rendering
frontend/login.js	Login-page session check
frontend/styles.css	Application styling
server/server.js	Active Express application, authentication, and recommendations
server/data/professionGenres.js	Separate profession mapping file
server/services/spotifyService.js	Separate Spotify token helper
package.json	Dependencies and run scripts
.env	Local credentials and configuration; do not commit


The active server currently defines its profession mapping and token retrieval function directly in server/server.js. The separate data and service files are not imported by that server.
Manual Testing Checklist
Use this checklist before submission. These are verification steps, not a claim that all tests have passed.
- [ ] The homepage redirects a logged-out user to /login.html.
- [ ] The login button opens Spotify authorization.
- [ ] Successful authorization returns to the homepage.
- [ ] /api/auth/status reports authenticated: true after login.
- [ ] Each supported profession can request recommendations.
- [ ] Returned tracks display their details and working Spotify links.
- [ ] Submitting without a profession shows a helpful message.
- [ ] The recommendations API returns HTTP 401 with no cookie or an invalid JWT.
- [ ] An expired JWT is rejected and the frontend requires login again.
- [ ] Logout clears the session and returns to the login screen.
- [ ] Reopening the homepage after logout requires login.
- [ ] Login and recommendations layouts work at desktop and mobile widths.
- [ ] The final interface matches the approved class design.
- [ ] Loading and error messages display when appropriate.
The repository's npm test script is currently a placeholder and exits with an error. An automated test suite has not been configured.
Troubleshooting
Problem	Check
redirect_uri: Not matching configuration	Save the exact callback URL in the matching Spotify application's settings and restart login from /auth/spotify.
HTTP 401 from recommendations	Sign in, check /api/auth/status, and use 127.0.0.1 consistently.
JWT_SECRET is required	Add JWT_SECRET to the root .env and restart the server.
Homepage only displays an API-running message	Remove an older GET / text response that intercepts static frontend serving.
Unable to sign in	Check backend logs, Spotify credentials, callback configuration, and account access.
Unable to get recommendations	Check backend logs and Spotify API access; a successful app login does not guarantee a successful Spotify search.


If a session expires during a recommendation request, the current frontend redirects directly to /auth/spotify. Its initial homepage session check redirects to /login.html.
Links
- Repository
- WorkVibes homepage
- Login page
- Backend status
- Login status
- Spotify Developer Dashboard
- Spotify Web API documentation
Project Status
The repository includes Spotify authorization, JWT session handling, a login screen, protected recommendation requests, and the profession-based frontend. Complete the manual checklist and confirm the interface against the class design before marking final testing and styling tickets complete.
Author
Latrice Thomas — Full Sail University, Project Portfolio III.
