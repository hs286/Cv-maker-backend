import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  Query,
  Inject
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryFailedError, Repository } from "typeorm";
import { CreateMessageDto, PaginationDto, UpdateMessageDto, UserDto } from "../dtos/chat.dto";
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiExtraModels,
  ApiInternalServerErrorResponse
} from "@nestjs/swagger";
import { ApiResponse } from "src/globals/responses";
import { API_STATUS } from "src/globals/enums";
import { v4 as uuidv4 } from "uuid";
import { Notification } from "../../notifications/entites/notification.entity";
import { User } from "../../auth/0auth2.0/entites/user.entity";
import { Role } from "../../auth/0auth2.0/enums";
import { HttpService } from "../../http/http.service";
import { TicketService } from "../../ticket/services/ticket.service";
import { Message } from "../../messages/entites/message.entity";
import { Conversation } from "../../conversation/entites/conversation.entity";


@ApiTags("Chat")
@Injectable()
@ApiExtraModels(CreateMessageDto, UpdateMessageDto, UserDto, Conversation, Message, User, ApiResponse)
export class ChatService {

  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @Inject(HttpService) private httpService: HttpService,
    private readonly ticketService: TicketService
  ) {
  }

  /**
   * Create a new chat conversation.
   * @returns The newly created conversation.
   * @param user
   */
  @ApiOkResponse({ description: "Successfully created conversation", type: ApiResponse<Conversation> })
  @ApiNotFoundResponse({ description: "One or more participants not found.", type: ApiResponse })
  @ApiForbiddenResponse({
    description: "Failed to create conversation. Duplicate participants found.",
    type: ApiResponse
  })
  @ApiInternalServerErrorResponse({ description: "Internal server error.", type: ApiResponse })
  async createConversation(user: UserDto): Promise<ApiResponse<Conversation>> {
    try {
      const existingConversation = await this.findConversationByParticipants(Array.from([user.userId]));
      if (existingConversation) {
        return {
          status: API_STATUS.SUCCESS,
          message: "Successfully retrieved conversation",
          data: existingConversation
        };
      }
      const ticketId = uuidv4();

      const adminUser = await this.ticketService.assignTicket(ticketId);

      console.log("adminUser", adminUser);

      const participants = [user, { email: adminUser.user.email, userId: adminUser.user.userId, role: Role.ADMIN }];

      console.log("participants", participants);

      const participantsEntities = await this.createOrUpdateParticipants(participants);

      const conversation = new Conversation();
      conversation.ticketId = ticketId;
      conversation.participants = participantsEntities;
      return {
        status: API_STATUS.SUCCESS,
        message: "Successfully created conversation",
        data: await this.conversationRepository.save(conversation)
      };
    } catch (error) {
      console.log("🚀 ~ file: chat.service.ts:73 ~ ChatService ~ createConversation ~ error:", error);
      if (error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof QueryFailedError && error.message.includes("Duplicate entry")) {
        throw new ForbiddenException({
          status: API_STATUS.FAILURE,
          message: "Failed to create conversation. Duplicate entry error."
        });
      }
      throw new ForbiddenException({
        status: API_STATUS.FAILURE,
        message: error.message
      });
    }
  }

  /**
   * Get messages from a specific conversation.
   * @param conversationId ID of the conversation.
   * @returns List of messages in the conversation.
   */
  @ApiOkResponse({ description: "Successfully retrieved messages", type: ApiResponse<[Message]> })
  @ApiNotFoundResponse({ description: "Conversation not found.", type: ApiResponse })
  @ApiInternalServerErrorResponse({ description: "Internal server error.", type: ApiResponse })
  async getMessages(conversationId: string): Promise<ApiResponse<Message[]>> {
    try {
      const data = await this.messageRepository.find({
        where: { conversation: { id: conversationId } },
        relations: ["conversation", "sender"]
      });
      return {
        status: API_STATUS.SUCCESS,
        message: "Successfully retrieved messages",
        data: data
      };
    } catch (error) {
      throw new NotFoundException({
        status: API_STATUS.FAILURE,
        message: "Conversation not found."
      });
    }
  }

  /**
   * Create a new message in a specific conversation.
   * @param senderId ID of the sender.
   * @param conversationId ID of the conversation.
   * @param content
   * @returns The newly created message.
   */
  @ApiOkResponse({ description: "Successfully created message", type: ApiResponse<Message> })
  @ApiNotFoundResponse({ description: "Conversation or sender not found.", type: ApiResponse })
  @ApiForbiddenResponse({ description: "Sender is not a participant in the conversation.", type: ApiResponse })
  @ApiInternalServerErrorResponse({ description: "Internal server error.", type: ApiResponse })
  async sendMessage(conversationId: string, senderId: string, content: string): Promise<ApiResponse<Message>> {
    try {
      const conversation = await this.conversationRepository.findOne({ where: { id: conversationId } });
      const sender = await this.userRepository.findOne({ where: { userId: senderId } });

      if (!conversation || !sender) {
        throw new NotFoundException({
          status: API_STATUS.FAILURE,
          message: "Conversation or sender not found."
        });
      }

      const message = new Message();
      message.conversation = conversation;
      message.sender = sender;
      message.content = content;

      return {
        status: API_STATUS.SUCCESS,
        message: "Successfully created message",
        data: await this.messageRepository.save(message)
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ForbiddenException({
        status: API_STATUS.FAILURE,
        message: "Failed to send message."
      });
    }
  }

  /**
   * Update a specific message.
   * @param messageId ID of the message.
   * @param updateMessageDto DTO containing updated message content.
   * @returns The updated message.
   */
  @ApiOkResponse({ description: "Successfully updated message", type: ApiResponse<Message> })
  @ApiNotFoundResponse({ description: "Message not found.", type: ApiResponse })
  @ApiInternalServerErrorResponse({ description: "Internal server error.", type: ApiResponse })
  async updateMessage(messageId: string, updateMessageDto: UpdateMessageDto): Promise<ApiResponse<Message>> {
    try {
      const message = await this.messageRepository.findOne({
        where: { id: messageId }
      });
      if (!message) {
        throw new NotFoundException({
          status: API_STATUS.FAILURE,
          message: "Message not found."
        });
      }

      Object.assign(message, updateMessageDto);

      return {
        status: API_STATUS.SUCCESS,
        message: "Successfully updated message",
        data: await this.messageRepository.save(message)
      };
    } catch (error) {
      throw new NotFoundException({
        status: API_STATUS.FAILURE,
        message: "Message not found."
      });
    }
  }

  /**
   * Delete a specific message.
   * @param messageId ID of the message.
   * @returns The deleted message.
   */
  @ApiOkResponse({ description: "Successfully deleted message", type: ApiResponse<Message> })
  @ApiNotFoundResponse({ description: "Message not found.", type: ApiResponse })
  @ApiInternalServerErrorResponse({ description: "Internal server error.", type: ApiResponse })
  async deleteMessage(messageId: string): Promise<ApiResponse<Message>> {
    try {
      const message = await this.messageRepository.findOne({
        where: { id: messageId }
      });
      if (!message) {
        throw new NotFoundException({
          status: API_STATUS.FAILURE,
          message: "Message not found."
        });
      }

      await this.messageRepository.remove(message);

      return {
        status: API_STATUS.SUCCESS,
        message: "Successfully deleted message",
        data: message
      };
    } catch (error) {
      throw new NotFoundException({
        status: API_STATUS.FAILURE,
        message: "Message not found."
      });
    }
  }

  /**
   * Get conversations for a user.
   * @param userId ID of the user.
   * @returns List of conversations for the user.
   */
  @ApiOkResponse({ description: "Successfully retrieved conversations", type: ApiResponse<[Conversation]> })
  @ApiNotFoundResponse({ description: "User not found.", type: ApiResponse })
  @ApiInternalServerErrorResponse({ description: "Internal server error.", type: ApiResponse })
  async getConversations(userId: string): Promise<ApiResponse<Conversation[]>> {
    try {
      const conversations = await this.conversationRepository
        .createQueryBuilder("conversation")
        .leftJoin("conversation.participants", "user")
        .where("user.userId = :userId", { userId })
        .getMany();

      return {
        status: API_STATUS.SUCCESS,
        message: "Successfully retrieved conversations",
        data: conversations
      };
    } catch (error) {
      throw new NotFoundException({
        status: API_STATUS.FAILURE,
        message: "User not found."
      });
    }
  }

  /**
   * Get the history of a specific chat conversation.
   * @param conversationId ID of the conversation.
   * @returns List of messages in the conversation.
   */
  @ApiOkResponse({ description: "Successfully retrieved conversation history", type: ApiResponse<[Message]> })
  @ApiNotFoundResponse({ description: "Conversation not found.", type: ApiResponse })
  @ApiInternalServerErrorResponse({ description: "Internal server error.", type: ApiResponse })
  async getConversationHistory(
    conversationId: string,
    @Query() paginationDto: PaginationDto
  ): Promise<ApiResponse<Message[]>> {
    try {
      const { page = 1, pageSize = 10 } = paginationDto;
      const data = await this.getMessagesByConversation(conversationId, (page - 1) * pageSize, pageSize);

      return {
        status: API_STATUS.SUCCESS,
        message: "Successfully retrieved conversation history",
        data: data.data
      };
    } catch (error) {
      throw new NotFoundException({
        status: API_STATUS.FAILURE,
        message: "Conversation not found."
      });
    }
  }

  /**
   * Get messages for a specific conversation.
   * @param conversationId ID of the conversation.
   * @returns List of messages in the conversation.
   */
  @ApiOkResponse({ description: "Successfully retrieved messages", type: ApiResponse<[Message]> })
  @ApiNotFoundResponse({ description: "Conversation not found.", type: ApiResponse })
  @ApiInternalServerErrorResponse({ description: "Internal server error.", type: ApiResponse })
  async getMessagesByConversation(conversationId: string, skip: number, take: number): Promise<ApiResponse<Message[]>> {
    try {
      const data = await this.messageRepository.find({
        where: { conversation: { id: conversationId } },
        skip,
        take
      });
      return {
        status: API_STATUS.SUCCESS,
        message: "Successfully retrieved messages",
        data: data
      };
    } catch (error) {
      throw new NotFoundException({
        status: API_STATUS.FAILURE,
        message: "Conversation not found."
      });
    }
  }

  async findConversationByTicketId(ticketId: string): Promise<Conversation | undefined> {
    return await this.conversationRepository.findOne({
      where: { ticketId },
      relations: ["participants"]
    });
  }

  private async findConversationByParticipants(participantIds: string[]): Promise<Conversation | undefined> {
    const conversations = await this.conversationRepository
      .createQueryBuilder("conversation")
      .leftJoinAndSelect("conversation.participants", "participant")
      .where("participant.userId IN (:...participantIds)", { participantIds })
      .getMany();

    return conversations.find(
      convo =>
        convo.participants.length === participantIds.length &&
        convo.participants.every(participant => participantIds.includes(participant.userId))
    );
  }

  async getAdminMembersByTicketId(ticketId: string): Promise<User[]> {
    const conversation = await this.conversationRepository.findOne({
      where: { ticketId },
      relations: ["participants"]
    });

    if (!conversation) {
      throw new Error(`Conversation with ticket ID ${ticketId} not found.`);
    }
    const adminMembers = conversation.participants.filter(participant => participant.role === Role.ADMIN);

    return adminMembers;
  }

  private async createOrUpdateParticipants(participants: UserDto[]): Promise<User[]> {
    return Promise.all(
      participants.map(async ({ userId, email, role }) => {
        let user = await this.userRepository.findOne({ where: { userId } });

        const roleValue = role as Role;

        if (!user) {
          user = this.userRepository.create({ userId, email, role: roleValue });
        } else if (user.role !== roleValue) {
          throw new BadRequestException(`User with ID ${userId} already exists with a different role.`);
        }

        await this.userRepository.save(user);
        return user;
      })
    );
  }
}
