import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from "typeorm";
import { Package } from "../../package/entities/package.entity";
@Entity()
export class Service {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToMany(() => Package, pkg => pkg.services)
  @JoinTable()
  packages: Package[];
}
