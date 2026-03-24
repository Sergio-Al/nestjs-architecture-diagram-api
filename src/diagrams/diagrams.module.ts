import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Diagram } from './diagram.entity.js';
import { DiagramsController } from './diagrams.controller.js';
import { DiagramsService } from './diagrams.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Diagram])],
  controllers: [DiagramsController],
  providers: [DiagramsService],
  exports: [DiagramsService],
})
export class DiagramsModule {}
