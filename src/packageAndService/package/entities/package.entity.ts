import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from "typeorm";
import { Service } from "../../service/entities/service.entity";

@Entity()
export class Package {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @ManyToMany(() => Service, service => service.packages)
  services: Service[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}