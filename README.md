# 🏗️ Architecture Flow Designer — API

Backend for [Architecture Flow Designer](../architecture-diagram), providing project/diagram persistence and real-time collaboration.

Built with NestJS 11, TypeORM, PostgreSQL 16, and Socket.IO.

![NestJS](https://img.shields.io/badge/NestJS-11-red) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue) ![Socket.IO](https://img.shields.io/badge/Socket.IO-realtime-purple)

## Features

- **Projects CRUD** — Create, read, update, delete projects
- **Diagrams CRUD** — Create, read, update, delete diagrams with JSONB data storage
- **Thumbnail Storage** — Base64 diagram thumbnails for card previews
- **Real-time Collaboration** — Socket.IO WebSocket gateway with room-per-diagram
  - User presence (join/leave with display name + color)
  - Live cursor broadcasting (viewport-independent flow coordinates)
  - Diagram state sync (nodes/edges broadcast to all room members)
  - Yjs CRDT document sync with persistent update storage
- **Yjs Persistence** — Binary update chunks stored in `yjs_updates` table, replayed on client join

## API Surface

```
GET    /api/projects                          # List all projects
POST   /api/projects                          # Create project
GET    /api/projects/:id                      # Get project
PATCH  /api/projects/:id                      # Update project
DELETE /api/projects/:id                      # Delete project
GET    /api/projects/:id/diagrams             # List diagrams in project

POST   /api/projects/:projectId/diagrams      # Create diagram
GET    /api/diagrams/:id                      # Get diagram
PATCH  /api/diagrams/:id                      # Update diagram
DELETE /api/diagrams/:id                      # Delete diagram
PUT    /api/diagrams/:id/thumbnail            # Update thumbnail
```

## WebSocket Events (namespace: `/collaboration`)

| Event (Client → Server) | Payload | Description |
|--------------------------|---------|-------------|
| `join-room` | `{ diagramId, userName }` | Join a diagram room |
| `leave-room` | `{ diagramId }` | Leave a diagram room |
| `cursor-update` | `{ diagramId, cursor, userName, color }` | Broadcast cursor position |
| `diagram-state` | `{ diagramId, nodes, edges }` | Broadcast diagram changes |
| `yjs-update` | `{ diagramId, update }` | Send Yjs CRDT update |
| `yjs-sync` | `{ diagramId, type, data }` | Yjs sync protocol messages |

| Event (Server → Client) | Payload | Description |
|--------------------------|---------|-------------|
| `users-changed` | `{ users: [{ name, color }] }` | Updated online user list |
| `cursor-update` | `{ socketId, cursor, userName, color }` | Remote cursor position |
| `diagram-state` | `{ nodes, edges }` | Remote diagram state |
| `yjs-update` | `{ update }` | Remote Yjs update |
| `yjs-sync` | `{ type, data }` | Yjs sync response |

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose

### Setup

```bash
# Start PostgreSQL + Adminer
docker compose up -d

# Install dependencies
npm install

# Start in watch mode
npm run start:dev
```

The API will be available at `http://localhost:3000`
Adminer (DB admin UI) at `http://localhost:8080`

### Environment Variables

Copy `.env.example` to `.env`:

```env
DATABASE_URL=postgres://archdiagram:archdiagram_dev@localhost:5432/archdiagram
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

### Build for Production

```bash
npm run build
npm run start:prod
```

## Tech Stack

- **NestJS 11** — Framework
- **TypeORM** — ORM with auto-sync in development
- **PostgreSQL 16** — Database (via Docker)
- **Socket.IO** — WebSocket transport (via @nestjs/platform-socket.io)
- **Yjs** — CRDT for conflict-free collaborative editing
- **class-validator** — DTO validation (whitelist + forbidNonWhitelisted)

## Project Structure

```
src/
├── app.module.ts              # Root module
├── main.ts                    # Bootstrap (CORS, ValidationPipe)
├── database/
│   └── database.module.ts     # TypeORM + PostgreSQL connection
├── projects/
│   ├── project.entity.ts      # Project entity (uuid, name, color, timestamps)
│   ├── projects.controller.ts # REST endpoints
│   ├── projects.service.ts    # Business logic
│   ├── projects.module.ts
│   └── dto/                   # CreateProjectDto, UpdateProjectDto
├── diagrams/
│   ├── diagram.entity.ts      # Diagram entity (uuid, jsonb data, version, thumbnail)
│   ├── diagrams.controller.ts # REST endpoints
│   ├── diagrams.service.ts    # Business logic
│   ├── diagrams.module.ts
│   └── dto/                   # CreateDiagramDto, UpdateDiagramDto, UpdateThumbnailDto
└── collaboration/
    ├── collaboration.gateway.ts  # WebSocket gateway (rooms, cursors, sync)
    ├── collaboration.module.ts
    └── yjs-update.entity.ts      # Persisted Yjs binary updates
```

## License

MIT
