import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { Diagram } from '../diagrams/diagram.entity.js';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Diagram)
    private readonly diagramRepo: Repository<Diagram>,
  ) {}

  create(dto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepo.create(dto);
    return this.projectRepo.save(project);
  }

  findAll(): Promise<Project[]> {
    return this.projectRepo.find({ order: { updatedAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    Object.assign(project, dto);
    return this.projectRepo.save(project);
  }

  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);
    await this.projectRepo.remove(project);
  }

  findDiagrams(projectId: string): Promise<Diagram[]> {
    return this.diagramRepo.find({
      where: { projectId },
      order: { updatedAt: 'DESC' },
      select: ['id', 'projectId', 'name', 'description', 'thumbnail', 'version', 'createdAt', 'updatedAt'],
    });
  }
}
