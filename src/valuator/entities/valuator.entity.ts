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
export class Valuator {
  @ApiProperty({
    description: 'unique database. It acts as a unique identifier in the DB ',
  })
  @PrimaryGeneratedColumn('uuid')
  valuatorId: string;

  @ApiProperty({
    description: 'original salary by valuator.',
  })
  @Column({ nullable: true })
  originalSalary: string;

  @ApiProperty({
    description: 'Predicted salary by valuator.',
  })
  @Column({ nullable: true })
  estimatedSalary: string;

  // @ApiProperty({
  //   description: 'job description by valuator.',
  // })
  // @Column({ nullable: true, type: 'longtext' })
  // jobDescription: string;

  // @ApiProperty({
  //   description: 'ATS score by valuator',
  // })
  // @Column({ nullable: true })
  // score: number;

  @ApiProperty({
    description: 'ATS Score According to user CV',
  })
  @Column({ nullable: true })
  keyWordScore: number;

  @ApiProperty({
    description: 'Grammer Score According to user CV',
  })
  @Column({ nullable: true })
  grammerScore: number;

  @ApiProperty({
    description: 'country median calculated as per user profile',
  })
  @Column({ nullable: true })
  countryMedian: string;

  @ApiProperty({
    description: 'country mean calculated as per user profile',
  })
  @Column({ nullable: true })
  countryMean: string;

  @ApiProperty({
    description: 'User ID',
  })
  @OneToOne(() => User, (user) => user.valuator, {
    onDelete: 'CASCADE', // Add cascading delete behavior
  })
  @JoinColumn()
  user: User;
}
