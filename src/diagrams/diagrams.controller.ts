import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { DiagramsService } from './diagrams.service.js';
import { CreateDiagramDto } from './dto/create-diagram.dto.js';
import { UpdateDiagramDto } from './dto/update-diagram.dto.js';
import { UpdateThumbnailDto } from './dto/update-thumbnail.dto.js';

@Controller('api')
export class DiagramsController {
  constructor(private readonly diagramsService: DiagramsService) {}

  @Post('projects/:projectId/diagrams')
  create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateDiagramDto,
  ) {
    return this.diagramsService.create(projectId, dto);
  }

  @Get('diagrams/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.diagramsService.findOne(id);
  }

  @Patch('diagrams/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDiagramDto,
  ) {
    return this.diagramsService.update(id, dto);
  }

  @Delete('diagrams/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.diagramsService.remove(id);
  }

  @Put('diagrams/:id/thumbnail')
  updateThumbnail(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateThumbnailDto,
  ) {
    return this.diagramsService.updateThumbnail(id, dto.thumbnail);
  }
}
