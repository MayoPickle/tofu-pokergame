# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload (uses nodemon)
- `npm run build` - Build production bundles with webpack
- `npm run build:dev` - Build development bundles
- `npm run watch` - Build and watch for changes in development mode

### Testing
This project currently does not have a formal test suite. When adding tests, check the package.json scripts section.

## Architecture Overview

This is a real-time multiplayer party game platform called "甜梦小酒馆" (Sweet Dream Tavern) built with Node.js, Express, Socket.io, and React components.

### Technology Stack
- **Backend**: Node.js + Express + Socket.io for real-time communication
- **Frontend**: React (JSX) + Ant Design UI components + Webpack bundling
- **Real-time**: Socket.io for WebSocket connections
- **Build Tool**: Webpack with multiple entry points

### Key Architecture Patterns

#### Multi-Entry Webpack Setup
The project uses webpack with three distinct entry points:
- `src/index.js` → HomePage (main lobby)
- `src/room.js` → RoomPage (game room)  
- `src/debug.js` → DebugPage (development tools)

Each entry generates its own bundle and HTML page via HtmlWebpackPlugin.

#### Server-Side Game State Management
- **Room Management**: Centralized room/user state in `server.js` using Map structures
- **Game Classes**: Modular game implementations (NumberBombGame class)
- **User Session Handling**: 30-second reconnection grace period for network interruptions
- **Host Transfer**: Automatic host privilege transfer when room owner leaves

#### Socket.io Event Architecture
The real-time communication follows these key patterns:

**Room Management Events**:
- `createRoom` / `joinRoom` / `reconnectToRoom` - Room lifecycle
- `userListUpdate` - Broadcast user changes to all room members
- `hostChanged` - Notify room when host privileges transfer

**Game Events**:
- `startNumberBomb` - Host initiates game (only host can start)
- `numberBombGuess` - Player makes guess, server validates and broadcasts result
- `gameUpdate` / `gameFinished` - Game state synchronization

**Chat System**:
- `chatMessage` - Real-time chat with user identification via socket.id lookup

#### React Component Structure
- **Pages**: HomePage, RoomPage, DebugPage (top-level route components)
- **Components**: Reusable UI components (ChatPanel, UserList, NumberBombGame)
- **Utils**: Shared utilities (socket.js, storage.js, constants.js)

### Critical Implementation Details

#### User Identification Pattern
The server tracks users via UUID but identifies active connections by socket.id. When handling socket events, the server performs socket.id → User lookups:

```javascript
let currentUser = null;
for (const [userId, user] of users.entries()) {
    if (user.socketId === socket.id) {
        currentUser = user;
        break;
    }
}
```

#### Room State Synchronization
User numbers are dynamically reassigned to maintain sequential numbering (host always #1, others 2+). The `getUserList()` method handles this logic and must be called after any user changes.

#### Reconnection Handling
The system supports page refresh/network reconnection via `reconnectToRoom` event. Users have a 30-second grace period before being removed from rooms.

## File Structure Notes

- `server.js` - Main server file containing all game logic and Socket.io handlers
- `src/pages/` - React page components corresponding to webpack entries
- `src/components/` - Reusable React components for games and UI elements
- `src/utils/constants.js` - Shared constants (game types, statuses, routes)
- `public/` - Static assets and webpack build output
- `webpack.config.js` - Multi-entry build configuration

## Game Development Pattern

To add new games, follow the NumberBombGame pattern:
1. Create game class in `server.js` with room reference
2. Add Socket.io event handlers for game actions
3. Create React component in `src/components/`
4. Add game type constants to `src/utils/constants.js`
5. Integrate into RoomPage component

## Notable Dependencies

- **socket.io**: Real-time bidirectional communication
- **uuid**: User unique identification  
- **antd**: UI component library with Chinese localization
- **webpack + babel-loader**: JSX transpilation and bundling
- **nodemon**: Development auto-reload

## Development Notes

- The project uses Chinese language throughout (comments, UI text, console logs)
- Socket.io debugging is enabled - check browser console for connection details
- User state persists through page refreshes via localStorage and reconnection logic
- Host privileges are required for starting games - always check `isHost` flag in UI