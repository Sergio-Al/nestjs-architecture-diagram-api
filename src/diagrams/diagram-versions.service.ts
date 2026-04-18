import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiagramVersion } from './diagram-version.entity.js';
import { DiagramsService } from './diagrams.service.js';
import { CreateVersionDto } from './dto/create-version.dto.js';

@Injectable()
export class DiagramVersionsService {
  constructor(
    @InjectRepository(DiagramVersion)
    private readonly versionRepo: Repository<DiagramVersion>,
    private readonly diagramsService: DiagramsService,
  ) {}

  async create(diagramId: string, dto: CreateVersionDto): Promise<DiagramVersion> {
    const diagram = await this.diagramsService.findOne(diagramId);

    const count = await this.versionRepo.count({ where: { diagramId } });

    const version = this.versionRepo.create({
      diagramId,
      versionNumber: count + 1,
      label: dto.label ?? null,
      data: diagram.data,
      thumbnail: diagram.thumbnail,
    });

    return this.versionRepo.save(version);
  }

  findAll(diagramId: string): Promise<DiagramVersion[]> {
    return this.versionRepo.find({
      where: { diagramId },
      order: { versionNumber: 'DESC' },
      select: {
        id: true,
        diagramId: true,
        versionNumber: true,
        label: true,
        thumbnail: true,
        createdAt: true,
      },
    });
  }

  async findOne(diagramId: string, versionId: string): Promise<DiagramVersion> {
    const version = await this.versionRepo.findOne({
      where: { id: versionId, diagramId },
    });
    if (!version) throw new NotFoundException(`Version ${versionId} not found`);
    return version;
  }

  async restore(diagramId: string, versionId: string): Promise<void> {
    const version = await this.findOne(diagramId, versionId);
    await this.diagramsService.update(diagramId, { data: version.data });
  }

  async remove(diagramId: string, versionId: string): Promise<void> {
    const version = await this.findOne(diagramId, versionId);
    await this.versionRepo.remove(version);
  }
}
