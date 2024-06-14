import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Application } from "./application.entity";
import { ApiProperty } from "@nestjs/swagger";


@Entity()
export class Applicant {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  @ApiProperty({ description: "First Name of the Applicant" })
  firstName: string;

  @Column({ nullable: false })
  @ApiProperty({ description: "Last Name of the Applicant" })
  lastName: string;

  // userId that was used to signup for cvlib, reed & total jobs
  @Column({ nullable: false, unique: true, type: "bigint" })
  @ApiProperty({ description: "User ID of the Applicant" })
  userId: number;

  @Column({ nullable: false, unique: true })
  @ApiProperty({ description: "Email Address of the Applicant" })
  email: string;

  @Column({ nullable: true })
  @ApiProperty({ description: "County of the Applicant" })
  county: string;

  @Column({ nullable: true })
  @ApiProperty({ description: "Postcode of the Applicant" })
  postcode: string;

  @Column({ nullable: true })
  @ApiProperty({ description: "Town of the Applicant" })
  town: string;

  @Column({ nullable: true })
  @ApiProperty({ description: "Desired Job Title" })
  desiredJob: string;

  @Column({ nullable: true })
  @ApiProperty({ description: "Desired Minimum Salary" })
  desiredMinSalary: number;

  @Column({ nullable: true })
  @ApiProperty({ description: "Salary Range of the Applicant" })
  salaryRange: string;

  @Column({ nullable: true })
  @ApiProperty({ description: "Job Type of the Applicant" })
  jobType: string;

  @Column({ nullable: true })
  @ApiProperty({ description: "Cover Letter Content" })
  coverContent: string;

  @Column({ nullable: true, default: false })
  @ApiProperty({ description: "Auto Apply Flag" })
  autoApply: boolean;

  @Column({ nullable: true })
  @ApiProperty({ description: "Last Applied At Date" })
  lastAppliedAt: Date;

  @OneToMany(() => Application, application => application.applicant)
  applications: Application[];

  @Column({ nullable: true })
  @ApiProperty({ description: "Is automatically generated or created by Admin (Intra CRM)" })
  type: string;

  @CreateDateColumn()
  @ApiProperty({ description: "Creation Date of the Applicant" })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: "Update Date of the Applicant" })
  updatedAt: Date;
}
