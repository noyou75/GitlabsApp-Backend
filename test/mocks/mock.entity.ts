import { IsString } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class MockEntity {
  constructor(name?: string) {
    this.name = name;
  }

  @PrimaryGeneratedColumn()
  id: string | number;

  @Column()
  @IsString()
  name: string;
}
