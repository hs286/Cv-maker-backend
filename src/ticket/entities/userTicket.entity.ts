import {
  Column,
  Entity,
  Index, JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "../../auth/0auth2.0/entites/user.entity";
import { Ticket } from "./ticket.entity";

@Entity('user_tickets')
export class UserTicket {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.tickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Ticket, (ticket) => ticket.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;
}