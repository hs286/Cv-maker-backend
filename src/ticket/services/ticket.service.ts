import { HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../auth/0auth2.0/entites/user.entity";
import { Ticket } from "../entities/ticket.entity";
import { UserTicket } from "../entities/userTicket.entity";
import { Role } from "../../auth/0auth2.0/enums";

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket) private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(UserTicket) private readonly userTicketRepository: Repository<UserTicket>
  ) {
  }


  async assignTicket(ticketId: string): Promise<{ message: string; user: User }> {

    const ticket = await this.ticketRepository.findOne({ where: { ticket: ticketId } });

    if (!ticket) {
      // Create a new ticket if it doesn't exist
      const newTicket = this.ticketRepository.create({ ticket: ticketId });
      await this.ticketRepository.save(newTicket);
    } else {
      throw new NotFoundException("Ticket already exists");
    }

    // Find admin/cvSpecialist with the least assigned tickets

    // TODO: currently it just search for the admins. but we have to check if the client has already a cvSpecialist then his/her message should be send to the CV Specialist. So we need to find the cvSpecialist then.

    const userWithLeastTickets = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.tickets", "userTicket")
      .where("user.role = :role", {
        role: Role.ADMIN
      })
      .groupBy("user.userId")  // Use 'groupBy' instead of 'addGroupBy'
      .orderBy("COUNT(userTicket.id)", "ASC")
      .getOne();

    console.log("userWithLeastTickets", userWithLeastTickets);

    if (!userWithLeastTickets) {
      throw new NotFoundException("No admin users found");
    }

    // Assign the selected user to the ticket
    const userTicketAssociation = this.userTicketRepository.create({
      user: userWithLeastTickets,
      ticket
    });

    console.log("userTicketAssociation", userTicketAssociation);

    await this.userTicketRepository.save(userTicketAssociation);

    return {
      message: `Ticket ${ticketId} assigned to user ${userWithLeastTickets.userId}`,
      user: userWithLeastTickets
    };
  }

  async listAllTickets(): Promise<Ticket[]> {
    return this.ticketRepository.find();
  }

  async checkTicketUser(ticketId: string): Promise<User> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .innerJoin("user.tickets", "ticket")
      .where("ticket.ticket = :ticketId", { ticketId })
      .getOne();

    if (!user) {
      throw new HttpException(
        `Ticket ${ticketId} not found or not assigned to any user`,
        HttpStatus.NOT_FOUND
      );
    }

    return user;
  }

  async listTicketsOfCurrentUser(user: User): Promise<Ticket[]> {
    return this.ticketRepository
      .createQueryBuilder("ticket")
      .innerJoin("ticket.users", "user")
      .where("user.userId = :userId", { userId: user.userId })
      .getMany();
  }
}
