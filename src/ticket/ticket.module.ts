import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../auth/0auth2.0/entites/user.entity";
import { TicketService } from "./services/ticket.service";
import { Ticket } from "./entities/ticket.entity";
import { UserTicket } from "./entities/userTicket.entity";


@Module({
  imports: [TypeOrmModule.forFeature([User, Ticket, UserTicket])],
  providers: [TicketService],
  exports: [TicketService]
})

export class TicketModule {
}
