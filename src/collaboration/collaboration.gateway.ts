import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import { YjsUpdate } from './yjs-update.entity.js';

interface RoomState {
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  clients: Map<string, { socketId: string; name: string; color: string }>;
}

const USER_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b',
];

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/collaboration',
})
export class CollaborationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CollaborationGateway.name);
  private rooms = new Map<string, RoomState>();

  constructor(
    @InjectRepository(YjsUpdate)
    private readonly yjsUpdateRepo: Repository<YjsUpdate>,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove client from all rooms and broadcast awareness
    for (const [diagramId, room] of this.rooms.entries()) {
      if (room.clients.has(client.id)) {
        room.clients.delete(client.id);

        // Remove awareness state for this client
        awarenessProtocol.removeAwarenessStates(
          room.awareness,
          [client.id as unknown as number],
          'disconnect',
        );

        // Broadcast updated user list
        this.broadcastUsers(diagramId, room);

        // Clean up empty rooms
        if (room.clients.size === 0) {
          room.doc.destroy();
          this.rooms.delete(diagramId);
          this.logger.log(`Room ${diagramId} destroyed (no clients)`);
        }
      }
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { diagramId: string; userName: string },
  ) {
    const { diagramId, userName } = data;

    if (!diagramId || !userName) {
      client.emit('error', { message: 'diagramId and userName are required' });
      return;
    }

    // Join socket.io room
    client.join(diagramId);

    // Get or create room state
    const room = await this.getOrCreateRoom(diagramId);

    // Assign a color to this user
    const colorIndex = room.clients.size % USER_COLORS.length;
    const color = USER_COLORS[colorIndex];

    // Register client
    room.clients.set(client.id, { socketId: client.id, name: userName, color });

    // Send initial Yjs sync (step 1)
    const encoder = encoding.createEncoder();
    syncProtocol.writeSyncStep1(encoder, room.doc);
    client.emit('yjs-sync', {
      type: 'sync-step-1',
      data: Array.from(encoding.toUint8Array(encoder)),
    });

    // Broadcast updated user list
    this.broadcastUsers(diagramId, room);

    this.logger.log(
      `${userName} joined room ${diagramId} (${room.clients.size} client(s))`,
    );
  }

  @SubscribeMessage('yjs-sync')
  handleYjsSync(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { diagramId: string; type: string; data: number[] },
  ) {
    const room = this.rooms.get(data.diagramId);
    if (!room) return;

    const message = new Uint8Array(data.data);
    const decoder = decoding.createDecoder(message);
    const encoder = encoding.createEncoder();
    const messageType = decoding.readVarUint(decoder);

    switch (messageType) {
      case 0: {
        // Sync step 1
        syncProtocol.readSyncStep1(decoder, encoder, room.doc);
        if (encoding.length(encoder) > 0) {
          client.emit('yjs-sync', {
            type: 'sync-step-2',
            data: Array.from(encoding.toUint8Array(encoder)),
          });
        }
        break;
      }
      case 1: {
        // Sync step 2
        syncProtocol.readSyncStep2(decoder, room.doc, client.id);
        break;
      }
      case 2: {
        // Update
        syncProtocol.readUpdate(decoder, room.doc, client.id);
        break;
      }
    }
  }

  @SubscribeMessage('yjs-update')
  async handleYjsUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { diagramId: string; update: number[] },
  ) {
    const room = this.rooms.get(data.diagramId);
    if (!room) return;

    const update = new Uint8Array(data.update);

    // Apply update to the server doc
    Y.applyUpdate(room.doc, update, client.id);

    // Persist the update
    await this.persistUpdate(data.diagramId, update);

    // Broadcast to all other clients in the room
    client.to(data.diagramId).emit('yjs-update', {
      update: Array.from(update),
    });
  }

  @SubscribeMessage('awareness-update')
  handleAwarenessUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { diagramId: string; update: number[] },
  ) {
    // Broadcast awareness update to all other clients in the room
    client.to(data.diagramId).emit('awareness-update', {
      update: data.update,
    });
  }

  @SubscribeMessage('cursor-update')
  handleCursorUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      diagramId: string;
      cursor: { x: number; y: number } | null;
      userName: string;
      color: string;
    },
  ) {
    // Broadcast cursor position to all other clients in the room
    client.to(data.diagramId).emit('cursor-update', {
      socketId: client.id,
      cursor: data.cursor,
      userName: data.userName,
      color: data.color,
    });
  }

  @SubscribeMessage('diagram-state')
  handleDiagramState(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      diagramId: string;
      nodes: unknown[];
      edges: unknown[];
    },
  ) {
    // Broadcast diagram state to all other clients in the room
    client.to(data.diagramId).emit('diagram-state', {
      nodes: data.nodes,
      edges: data.edges,
    });
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { diagramId: string },
  ) {
    const room = this.rooms.get(data.diagramId);
    if (!room) return;

    client.leave(data.diagramId);
    room.clients.delete(client.id);

    this.broadcastUsers(data.diagramId, room);

    if (room.clients.size === 0) {
      room.doc.destroy();
      this.rooms.delete(data.diagramId);
      this.logger.log(`Room ${data.diagramId} destroyed (no clients)`);
    }
  }

  private async getOrCreateRoom(diagramId: string): Promise<RoomState> {
    if (this.rooms.has(diagramId)) {
      return this.rooms.get(diagramId)!;
    }

    const doc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(doc);

    // Replay persisted updates
    const storedUpdates = await this.yjsUpdateRepo.find({
      where: { diagramId },
      order: { id: 'ASC' },
    });

    for (const stored of storedUpdates) {
      Y.applyUpdate(doc, new Uint8Array(stored.update));
    }

    this.logger.log(
      `Room ${diagramId} created (replayed ${storedUpdates.length} updates)`,
    );

    // Listen for doc updates to broadcast
    doc.on('update', (update: Uint8Array, origin: string) => {
      if (origin !== 'server') {
        // Already handled in handleYjsUpdate
        return;
      }
    });

    const room: RoomState = { doc, awareness, clients: new Map() };
    this.rooms.set(diagramId, room);
    return room;
  }

  private async persistUpdate(
    diagramId: string,
    update: Uint8Array,
  ): Promise<void> {
    const entity = this.yjsUpdateRepo.create({
      diagramId,
      update: Buffer.from(update),
    });
    await this.yjsUpdateRepo.save(entity);
  }

  private broadcastUsers(diagramId: string, room: RoomState) {
    const users = Array.from(room.clients.values()).map((c) => ({
      name: c.name,
      color: c.color,
    }));

    this.server.to(diagramId).emit('users-changed', { users });
  }
}
