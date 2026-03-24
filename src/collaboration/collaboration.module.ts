import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollaborationGateway } from './collaboration.gateway.js';
import { YjsUpdate } from './yjs-update.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([YjsUpdate])],
  providers: [CollaborationGateway],
})
export class CollaborationModule {}
