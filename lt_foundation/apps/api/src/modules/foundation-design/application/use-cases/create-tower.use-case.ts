import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Tower } from '../../domain/entities/tower.entity';
import { Angle } from '../../domain/value-objects/angle.vo';
import { TowerRepository } from '../ports/tower.repository';
import { CreateTowerDto } from '@lt/shared-dtos';

@Injectable()
export class CreateTowerUseCase {
  constructor(private readonly towerRepository: TowerRepository) {}

  async execute(dto: CreateTowerDto): Promise<Tower> {
    const deflectionAngle = new Angle(
      dto.deflectionAngle.deg,
      dto.deflectionAngle.min,
      dto.deflectionAngle.sec,
      dto.deflectionAngle.dir,
    );

    const tower = new Tower({
      id: uuidv4(),
      type: dto.type,
      extension: dto.extension,
      Hu: dto.Hu,
      classification: dto.classification,
      deflectionAngle,
    });

    return this.towerRepository.save(tower);
  }
}
