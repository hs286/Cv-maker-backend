import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Applicant } from "./applicant.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity()
export class Application {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, type: "bigint" })
  @ApiProperty({ description: "User ID for the Application" })
  userId: number;

  @Column({ nullable: false })
  @ApiProperty({ description: "Job Title of the Application" })
  jobTitle: string;

  @Column({ nullable: false })
  @ApiProperty({ description: "Job Job of the Application" })
  location: string;

  @Column({ nullable: false, default: 0 })
  @ApiProperty({ description: "Number of Times Applied" })
  applyCount: number;

  @Column({ nullable: true })
  @ApiProperty({ description: "Source of the Application" })
  source: string;

  // @Column({ nullable: true, default: () => new Date() })
  // @ApiProperty({ description: "Application Date" })
  // date: Date;

  @ManyToOne(() => Applicant, (applicant) => applicant.applications)
  applicant: Applicant;

  @CreateDateColumn()
  @ApiProperty({ description: "Creation Date of the Application" })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: "Update Date of the Application" })
  updatedAt: Date;
}
