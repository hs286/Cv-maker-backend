// this cv profile response will be used in valuation APIs.

import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'src/auth/0auth2.0/entites/user.entity';

@Entity()
export class CVProfile {
  @ApiProperty({
    description:
      'unique  identifier. It acts as a unique identifier in the DB ',
  })
  @PrimaryGeneratedColumn('uuid')
  CVProfileId: string;

  @ApiProperty({
    description: 'CV Profile Stringified.',
  })
  @Column({ nullable: true, type: 'longtext' })
  CVProfileStringified: string;

  @ApiProperty({
    description: 'User ID',
  })
  @OneToOne(() => User, (user) => user.cvProfile, {
    onDelete: 'CASCADE', // Add cascading delete behavior
  })
  @JoinColumn()
  user: User;
}
