// import {
//   WebSocketGateway,
//   WebSocketServer,
//   SubscribeMessage,
//   OnGatewayConnection,
//   OnGatewayDisconnect,
//   ConnectedSocket,
//   MessageBody
// } from "@nestjs/websockets";
// import { Server, Socket } from "socket.io";
// import * as jwt from "jsonwebtoken";
// import { Inject, Logger, NotFoundException, OnModuleInit } from "@nestjs/common";
// import { ChatService } from "src/chat/service/chat.service";
// import { ConfigService } from "@nestjs/config";
// import { API_STATUS } from "src/globals/enums";
// import { NotificationService } from "src/notifications/notifications.service";
// import { Role, UserStatus } from "../auth/0auth2.0/enums";
// import { UserService } from "../user/service/user.service";
// import { AuthService } from "../auth/0auth2.0/services/auth.service";
// import { HttpService } from "../http/http.service";
// import * as process from "process";
// import { TicketService } from "../ticket/services/ticket.service";
// import { Message } from "../messages/entites/message.entity";
//
// interface JwtPayload {
//   sub: string;
//   email: string;
//   role: string;
//   iat: number;
//   exp: number;
// }
//
// interface UserConnectionInfo {
//   userId: string;
//   clientId: any;
//   role: Role;
//   status: UserStatus;
// }
//
// @WebSocketGateway({
//   cors: { origin: "*" }
// })
// export class WebSocketGate
//   implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
//   @WebSocketServer()
//   server: Server;
//
//   private userConnections: Map<string, UserConnectionInfo> = new Map();
//   private logger: Logger;
//
//   constructor(
//     private readonly userService: UserService,
//     private readonly authService: AuthService,
//     private readonly chatService: ChatService,
//     private readonly configService: ConfigService,
//     // private readonly httpService: HttpService,
//     private readonly notificationService: NotificationService,
//     private readonly ticketService: TicketService
//   ) {
//   }
//
//   onModuleInit() {
//     this.logger = new Logger("WebSocketGate");
//     console.log("Running Socket IO");
//   }
//
//   async handleConnection(@ConnectedSocket() client: Socket) {
//     try {
//       console.log("Someone is trying to connect ?");
//
//       const token = client.handshake.query.token as string;
//
//       const decoded = jwt.verify(
//         token,
//         process.env.AT_SECRET
//       ) as JwtPayload;
//
//       client.data = {
//         userId: decoded.sub,
//         email: decoded.email,
//         role: decoded.role
//       };
//
//       let user = await this.authService.fetchUserById(client.data.userId);
//
//       console.log("User: ", user);
//
//       if (!user) {
//         throw new NotFoundException("Could not find the user");
//       }
//
//       this.addClientToUser(client.data.userId, client.id, decoded.role as Role);
//
//       console.log("Add user to user connections. UserId: " + user.userId);
//
//       await this.userService.updateUserStatus(client.data.userId, UserStatus.Online);
//
//       console.log("User status updated to online. UserId: " + user.userId);
//
//       this.logger.log(`User connected: ${client.id}`);
//
//       if (user.role === Role.CLIENT) {
//         const existingConversation = await this.chatService.getConversations(user.userId);
//         if (!existingConversation.data || existingConversation.data.length === 0) {
//           const createConversationResponse = await this.chatService.createConversation({
//             userId: user.userId,
//             email: user.email,
//             role: user.role
//           });
//           if (createConversationResponse.status === API_STATUS.SUCCESS) {
//             const room = createConversationResponse.data.ticketId;
//             this.notificationService.createNotification(user.userId, room, `New Conversation of user ${user.email}`);
//             client.join(room);
//             client.emit("ticketId", { ticketId: room });
//             this.sendNotificationToOtherParticipants(client.data.userId, room, "Client joined the conversation");
//             this.logger.log(`New conversation created and client joined room: ${room}`);
//           } else {
//             this.logger.error(`Failed to create conversation for client: ${user.email}`);
//           }
//         } else {
//           const room = existingConversation.data[0].ticketId;
//           console.log("room", room);
//           client.join(room);
//           this.logger.log(`Existing conversation found, client joined room: ${room}`);
//           this.sendNotificationToOtherParticipants(client.data.userId, room, "Client joined the conversation");
//         }
//       } else {
//         console.log("A Admin is connected!");
//       }
//     } catch (error) {
//       console.log("Handle Connection Error: ", error);
//       // TODO: uncomment this disconnect
//       // client.disconnect();
//     }
//   }
//
//
//   async handleDisconnect(@ConnectedSocket() client: Socket) {
//     try {
//       this.removeClientFromUser(client.data.userId);
//       await this.userService.updateUserStatus(
//         client.data.userId,
//         UserStatus.Offline
//       );
//       this.logger.log(`Client disconnected: ${client.id}--------------->`);
//     } catch (err) {
//       console.log("Hanlde Disconnect Error: ", err);
//     }
//   }
//
//   @SubscribeMessage("joinRoom")
//   async handleJoinRoom(
//     @MessageBody() data: { ticketId: string },
//     @ConnectedSocket() client: Socket
//   ) {
//     try {
//       const ticketId = data.ticketId;
//
//       // TODO: fetch user ?
//       // const assignedUserResponse = await this.httpService.get<any>(`auth/ticket-user/${ticketId}`);
//       const assignedUserResponse = await this.ticketService.checkTicketUser(ticketId);
//       if (assignedUserResponse && assignedUserResponse.userId) {
//         client.join(ticketId);
//         this.sendNotificationToOtherParticipants(client.data.userId, ticketId, "Admin member joined the conversation");
//         this.logger.log(`Admin member ${assignedUserResponse.userId} joined room for ticket ${ticketId}`);
//       } else {
//         this.logger.error(`Admin member is not assigned to ticket ${ticketId}`);
//       }
//     } catch (error) {
//       this.logger.error(`Error in handleJoinRoom: ${error.message}`);
//     }
//   }
//
//   @SubscribeMessage("leaveRoom")
//   async leaveRoom(
//     @MessageBody() data: { ticketId: string },
//     @ConnectedSocket() client: Socket
//   ) {
//     try {
//       const userId = client.data.userId;
//       const ticketId = data.ticketId;
//
//       const isPartOfConversation = await this.isUserInConversation(userId, ticketId);
//       if (isPartOfConversation) {
//         client.leave(ticketId);
//         this.server.to(ticketId).emit("notification", `User ${userId} has left the room ${ticketId}`);
//         this.logger.log(`User ${userId} left room ${ticketId}`);
//       } else {
//         this.logger.error(`User ${userId} is not part of the room ${ticketId}`);
//       }
//     } catch (error) {
//       this.logger.error(`Error leaving room: ${error.message}`);
//     }
//   }
//
//   @SubscribeMessage("message")
//   async handleMessage(
//     @MessageBody() data: { ticketId: string; message: string },
//     @ConnectedSocket() client: Socket
//   ) {
//     try {
//       const userId = client.data.userId;
//       const ticketId = data.ticketId;
//       const messageContent = data.message;
//
//       const conversation = await this.chatService.findConversationByTicketId(ticketId);
//
//       if (!conversation) {
//         throw new Error(`Conversation with ticket ID ${ticketId} not found.`);
//       }
//
//       const savedMessage = await this.chatService.sendMessage(conversation.id, userId, messageContent);
//
//       if (savedMessage.status === API_STATUS.SUCCESS) {
//         this.sendNotificationToOtherParticipants(userId, ticketId, `New Message sent by ${userId}: ${messageContent}`, savedMessage?.data);
//         this.logger.log(`Message sent in room ${ticketId} by ${userId}: ${messageContent}`);
//       } else {
//         this.logger.error(`Failed to save message for room ${ticketId} by ${userId}`);
//       }
//     } catch (error) {
//       this.logger.error(`Error handling message: ${error.message}`);
//     }
//   }
//
//   private addClientToUser(userId: string, clientId: any, role: Role) {
//     const userConnectionInfo: UserConnectionInfo = {
//       userId: userId,
//       clientId: clientId,
//       role: role,
//       status: UserStatus.Online
//     };
//
//     this.userConnections.set(String(userId), userConnectionInfo);
//   }
//
//   private removeClientFromUser(userId: string) {
//     this.userConnections.delete(userId);
//   }
//
//   private async isUserInConversation(userId: string, ticketId: string): Promise<boolean> {
//     const conversation = await this.chatService.findConversationByTicketId(ticketId);
//     return conversation ? conversation.participants.some(p => p.userId === userId) : false;
//   }
//
//   private getUserClientIds(userId: string): any[] {
//     return this.userConnections.get(userId)?.clientId ? [this.userConnections.get(userId).clientId] : [];
//   }
//
//   private async sendNotificationToOtherParticipants(senderId: string, ticketId: string, message: string, isMessage?: Message) {
//     try {
//       const conversation = await this.chatService.findConversationByTicketId(ticketId);
//       if (conversation) {
//         const participantIds = conversation.participants.map(participant => participant.userId);
//         const otherParticipants = participantIds.filter(id => id !== senderId);
//         for (const userId of otherParticipants) {
//
//           const clientIds = this.getUserClientIds(String(userId));
//           if (isMessage) {
//             await this.notificationService.createNotification(userId, ticketId, `New message Received by => ${isMessage.sender}  Message => ${isMessage.content}`);
//           }
//           try {
//             for (const clientId of clientIds) {
//               this.server.to(clientId).emit("notification", message);
//               if (isMessage) {
//                 this.server.to(clientId).emit("message", `New message Received by => ${isMessage.sender.email}  Message => ${isMessage.content}`);
//               }
//             }
//           } catch (error) {
//             this.logger.error(`Error creating notification for user ${userId}: ${error.message}`);
//           }
//         }
//       }
//     } catch (error) {
//       this.logger.error(`Error retrieving conversation for ticket ${ticketId}: ${error.message}`);
//     }
//   }
// }
