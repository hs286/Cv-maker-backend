import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from "../../auth/0auth2.0/entites/user.entity";

@Entity()
export class Feedback {
  @ApiProperty({ description: 'Unique identifier in the database' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Feedback content' })
  @Column()
  feedback: string;

  @ApiProperty({ description: 'User ID' })
  @ManyToOne(() => User, (user) => user.userId, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  userId: User;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Flag to mark feedback as done' })
  @Column({ default: false })
  isDone: boolean;
}
