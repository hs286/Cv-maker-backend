import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOperator, Repository } from "typeorm";
import { ChatRoom } from "./chatRoom.entity";
import { User } from "../auth/0auth2.0/entites/user.entity";
import { ChatEntity } from "./chat.entity";
import { File } from "src/files/entities/file.entity";

@Injectable()
export class RandomService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ChatRoom)
    private chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatEntity)
    private chatRepository: Repository<ChatEntity>
  ) {
  }


  async getChatRoomById(roomId: string): Promise<ChatRoom> {
    return this.chatRoomRepository.findOneBy({ roomId });
  }

  async getChatsByUser(userId: string): Promise<ChatEntity[]> {
    console.log("getChatsByUser: ",userId);
    return this.chatRepository
      .createQueryBuilder("chat")
      .innerJoinAndSelect("chat.sender", "sender")
      .innerJoinAndSelect("chat.chatRoom", "chatRoom")
      .innerJoinAndSelect("chatRoom.client", "client")
      .innerJoinAndSelect("chatRoom.admin", "admin")
      .leftJoinAndSelect("chat.files", "files")
      .where("client.userId = :userId", { userId })
      .orWhere("admin.userId = :userId", { userId })
      .orderBy("chat.createdAt", "ASC")
      .getMany();
  }

  // find an admin randomly from the user
  async findRandomAdmin(): Promise<User> {
    const admins = await this.userRepository.find({ where: { role: "admin" } });
    const randomIndex = Math.floor(Math.random() * admins.length);
    return admins[randomIndex];
  }

  // create a chatroom with clientId and adminId
  async createChatRoom(clientId: string, adminId: string): Promise<ChatRoom> {
    const client = await this.userRepository.findOne({
      where: {
        userId: clientId
      }
    });
    const admin = await this.userRepository.findOne({
      where: {
        userId: adminId
      }
    });
    const chatRoom = new ChatRoom();
    chatRoom.client = client;
    chatRoom.admin = admin;
    chatRoom.roomId = this.generateRoomId();
    return this.chatRoomRepository.save(chatRoom);
  }

// find chat room by userId, where it can be either clientId or adminId
  async findChatRoomByUserId(userId: string): Promise<ChatRoom> {
    return this.chatRoomRepository.findOne({
      where: [
        { client: { userId: userId } },
        { admin: { userId: userId } }
      ],
      relations: ["client", "admin"]
    });
  }

  async findChatRoomsByAdminId(userId: string): Promise<ChatRoom[]> {
    const user = await this.userRepository.findOne({
      where: {
        userId
      }
    });
    return this.chatRoomRepository.find({
      where: {
        admin: user
      }
    });
  }

  // find all participants from roomId
  async findParticipants(roomId: string): Promise<User[]> {
    const chatRoom = await this.chatRoomRepository.findOne({
        where: {
          roomId
        }, relations: ["client", "admin"]
      })
    ;
    return [chatRoom.client, chatRoom.admin];
  }

  async createChat(chatRoom: ChatRoom, sender: User, content: string,file?:File): Promise<ChatEntity> {
    const chat = new ChatEntity();
    chat.chatId = this.generateRoomId();
    chat.chatRoom = chatRoom;
    chat.sender = sender;
    chat.text = content;
    chat.createdAt = new Date();
    if (file) chat.files=[file]
    return this.chatRepository.save(chat);
  }

  // generate a unique roomId
  private generateRoomId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
