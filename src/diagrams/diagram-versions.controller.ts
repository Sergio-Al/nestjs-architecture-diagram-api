import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DiagramVersionsService } from './diagram-versions.service.js';
import { CreateVersionDto } from './dto/create-version.dto.js';

@Controller('api/diagrams/:diagramId/versions')
export class DiagramVersionsController {
  constructor(private readonly versionsService: DiagramVersionsService) {}

  @Post()
  create(
    @Param('diagramId', ParseUUIDPipe) diagramId: string,
    @Body() dto: CreateVersionDto,
  ) {
    return this.versionsService.create(diagramId, dto);
  }

  @Get()
  findAll(@Param('diagramId', ParseUUIDPipe) diagramId: string) {
    return this.versionsService.findAll(diagramId);
  }

  @Get(':versionId')
  findOne(
    @Param('diagramId', ParseUUIDPipe) diagramId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ) {
    return this.versionsService.findOne(diagramId, versionId);
  }

  @Post(':versionId/restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  restore(
    @Param('diagramId', ParseUUIDPipe) diagramId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ) {
    return this.versionsService.restore(diagramId, versionId);
  }

  @Delete(':versionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('diagramId', ParseUUIDPipe) diagramId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ) {
    return this.versionsService.remove(diagramId, versionId);
  }
}
