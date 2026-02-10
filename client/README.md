# Goal Counter Client (Vite + React)

Minimal Vite + React scaffold for the Goal Counter app frontend.

Quick start

1. cd into the client folder

   ```bash
   cd client
   ```

2. Install dependencies

   ```bash
   npm install
   # or
   # pnpm install
   # or
   # yarn
   ```

3. Run the dev server

   ```bash
   npm run dev
   ```

By default the frontend will attempt to call the backend at `http://localhost:5000`. You can change the API base URL by setting `VITE_API_URL` in your environment.

Files added
- `package.json` - small manifest with vite + react
- `index.html` - Vite entry
- `src/index.js`, `src/App.js`, `src/App.css` - app entry and styles
- `src/components/Header.js`, `src/components/ScoreDisplay.js` - small UI pieces
- `src/services/apiService.js` - simple fetch wrapper for backend calls

Next steps
- Wire up the backend endpoints (`/api/scores`) in your Node server
- Add tests or component stories if desired
- Replace placeholder styles and add assets in `src/assets/`
