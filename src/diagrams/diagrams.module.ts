import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Diagram } from './diagram.entity.js';
import { DiagramVersion } from './diagram-version.entity.js';
import { DiagramsController } from './diagrams.controller.js';
import { DiagramsService } from './diagrams.service.js';
import { DiagramVersionsController } from './diagram-versions.controller.js';
import { DiagramVersionsService } from './diagram-versions.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Diagram, DiagramVersion])],
  controllers: [DiagramsController, DiagramVersionsController],
  providers: [DiagramsService, DiagramVersionsService],
  exports: [DiagramsService],
})
export class DiagramsModule {}
