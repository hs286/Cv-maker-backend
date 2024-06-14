import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("location")
export class Location {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255, nullable: false })
  county: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  town: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  postcode: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
