import { Controller, Post, Get, Put, Body, Param, Delete, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateTowerUseCase } from '../../application/use-cases/create-tower.use-case';
import { TowerRepository } from '../../application/ports/tower.repository';
import { CreateTowerInputDto } from '../dtos/create-tower.dto';

@ApiTags('towers')
@Controller('api/v1/towers')
export class TowerController {
  constructor(
    private readonly createTowerUseCase: CreateTowerUseCase,
    private readonly towerRepository: TowerRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'EP-001: Create tower' })
  @ApiResponse({ status: 201 })
  async create(@Body() dto: CreateTowerInputDto) {
    const tower = await this.createTowerUseCase.execute(dto);
    return {
      id: tower.id,
      type: tower.type,
      extension: tower.extension,
      Hu: tower.Hu,
      classification: tower.classification,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'EP-002: Get tower by id' })
  async findOne(@Param('id') id: string) {
    const tower = await this.towerRepository.findById(id);
    if (!tower) throw new NotFoundException(`Tower ${id} not found`);
    return tower;
  }

  @Get()
  @ApiOperation({ summary: 'List all towers' })
  async findAll() {
    return this.towerRepository.findAll();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete tower' })
  async remove(@Param('id') id: string) {
    await this.towerRepository.delete(id);
  }
}
