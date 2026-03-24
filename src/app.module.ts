import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { DiagramsModule } from './diagrams/diagrams.module.js';
import { CollaborationModule } from './collaboration/collaboration.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    ProjectsModule,
    DiagramsModule,
    CollaborationModule,
  ],
})
export class AppModule {}
