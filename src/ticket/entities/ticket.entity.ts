import {
  Column,
  Entity, OneToMany,
  PrimaryGeneratedColumn
} from "typeorm";
import { UserTicket } from "./userTicket.entity";


@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  ticket: string;

  @OneToMany(() => UserTicket, (userTicket) => userTicket.ticket)
  users: UserTicket[];
}