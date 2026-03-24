import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Diagram } from './diagram.entity.js';
import { CreateDiagramDto } from './dto/create-diagram.dto.js';
import { UpdateDiagramDto } from './dto/update-diagram.dto.js';

@Injectable()
export class DiagramsService {
  constructor(
    @InjectRepository(Diagram)
    private readonly diagramRepo: Repository<Diagram>,
  ) {}

  create(projectId: string, dto: CreateDiagramDto): Promise<Diagram> {
    const diagram = this.diagramRepo.create({
      ...dto,
      projectId,
      data: dto.data ?? { nodes: [], edges: [] },
    });
    return this.diagramRepo.save(diagram);
  }

  async findOne(id: string): Promise<Diagram> {
    const diagram = await this.diagramRepo.findOne({ where: { id } });
    if (!diagram) throw new NotFoundException(`Diagram ${id} not found`);
    return diagram;
  }

  async update(id: string, dto: UpdateDiagramDto): Promise<Diagram> {
    const diagram = await this.findOne(id);
    Object.assign(diagram, dto);
    return this.diagramRepo.save(diagram);
  }

  async remove(id: string): Promise<void> {
    const diagram = await this.findOne(id);
    await this.diagramRepo.remove(diagram);
  }

  async updateThumbnail(id: string, thumbnail: string): Promise<Diagram> {
    const diagram = await this.findOne(id);
    diagram.thumbnail = thumbnail;
    return this.diagramRepo.save(diagram);
  }
}
