# MosMA Chat (Chat Application)

Full‑stack real‑time chat app with a **Node/Express + Socket.IO** backend and a **React + Vite** frontend.

## Features

- **Auth**: register/login with JWT
- **Rooms + DMs**: create group rooms and start 1:1 direct messages
- **Real‑time messaging**: live updates via Socket.IO
- **Typing indicators** and **online presence**
- **Message reactions** (emoji)
- **File uploads** (images + documents) with download/preview
- **Friends**: send/accept/decline friend requests
- **Social feed**: posts, likes, comments
- **Task board**: create/update/reorder tasks
- **Admin dashboard**: user/room/post management, ban users, broadcast messages
- **Calls**: WebRTC signaling (voice/video) over Socket.IO

## Tech stack

- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.IO, JWT, Multer
- **Frontend**: React, Vite, React Router, Axios, Socket.IO client

## Project structure

- `server.js`: Express server + Socket.IO
- `config/db.js`: MongoDB connection (expects `MONGO_URI`)
- `routes/`, `controllers/`, `models/`: API structure
- `client/`: Vite React app (UI)
- `public/uploads/`: uploaded files (served from `/uploads`)

## Requirements

- Node.js (LTS recommended)
- MongoDB connection string (local MongoDB or MongoDB Atlas)

## Environment variables

### Server (`.env` in project root)

Copy the example and edit it:

```bash
cp .env.example .env
```

Or create `./.env` manually:

```env
MONGO_URI=mongodb://127.0.0.1:27017/nexchat
JWT_SECRET=change_me
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

Notes:
- `MONGO_URI` is required (`config/db.js` connects using `process.env.MONGO_URI`).
- `JWT_SECRET` has a fallback in code, but you should set it for real deployments.
- `PORT` defaults to `5000` if not provided.

### Client (`client/.env`)

Copy the example and edit it:

```bash
cp client/.env.example client/.env
```

Or create `./client/.env` manually:

```env
VITE_API_URL=http://localhost:5000
```

The client uses `import.meta.env.VITE_API_URL` and falls back to `http://localhost:5000`.

## Install

From the project root:

```bash
npm install
```

Then install the client:

```bash
npm install --prefix client
```

## Run in development

### 1) Start the backend

From the project root:

```bash
npm run dev
```

Backend runs on `http://localhost:5000` by default.

### 2) Start the frontend

In another terminal:

```bash
npm run dev --prefix client
```

Vite will print the local URL (commonly `http://localhost:5173`).

## Build & run production

Build the client:

```bash
npm run build --prefix client
```

Then run the server:

```bash
npm start
```

In production, the server serves `client/dist` automatically (`server.js`).

## API overview (high level)

All API routes are prefixed with `/api`:

- `POST /api/auth/register` / `POST /api/auth/login`
- `GET /api/rooms` / `POST /api/rooms` / `POST /api/rooms/dm`
- `GET /api/friends` / `POST /api/friends/request`
- `GET /api/posts` / `POST /api/posts`
- `GET /api/tasks` / `POST /api/tasks`

Most routes require `Authorization: Bearer <token>`.

## File uploads

- Upload endpoint: `POST /api/upload` with `multipart/form-data` and field name `file`
- Uploaded files are stored in `public/uploads` and served at `/uploads/<filename>`
- Upload endpoint requires `Authorization: Bearer <token>`

## Notes

- **Do not commit secrets**: keep `.env` and `client/.env` out of version control.
- If `node_modules/` appears in git changes, it should typically be ignored (recommended to add it to `.gitignore`).

