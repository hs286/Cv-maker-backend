/* eslint-disable prettier/prettier */
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import * as jwt from "jsonwebtoken";
import {
    Inject,
    Logger,
    NotFoundException,
    OnModuleInit,
    forwardRef,
} from "@nestjs/common";
import { ChatService } from "src/chat/service/chat.service";
import { ConfigService } from "@nestjs/config";
import { NotificationService } from "src/notifications/notifications.service";
import { Role, UserStatus } from "../auth/0auth2.0/enums";
import { AuthService } from "../auth/0auth2.0/services/auth.service";
import * as process from "process";
import { TicketService } from "../ticket/services/ticket.service";
import { Message } from "../messages/entites/message.entity";
import { RandomService } from "./random.service";
import { User } from "../auth/0auth2.0/entites/user.entity";
import { FilesService } from "src/files/services/files.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    iat: number;
    exp: number;
}

interface UserConnectionInfo {
    userId: string;
    clientId: any;
    role: Role;
    status: UserStatus;
}

@WebSocketGateway({
    cors: { origin: "*" },
})
export class WebSocketGate
    implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
    @WebSocketServer()
    server: Server;

    private socketUserConnections: Map<string, UserConnectionInfo> = new Map();
    private pendingSocketConnections: Map<string, string> = new Map();
    private messages: any[] = [];
    private logger: Logger;

    constructor(
        private readonly chatService: ChatService,
        private readonly configService: ConfigService,
        private readonly notificationService: NotificationService,
        private readonly ticketService: TicketService,
        private readonly randomService: RandomService,
        private readonly filesService: FilesService,
        @Inject(forwardRef(() => AuthService))
        private readonly authService: AuthService,
        @InjectRepository(User) public userRepository: Repository<User>,
    ) { }

    onModuleInit() {
        this.logger = new Logger("WebSocketGate");
        console.log("Running Socket IO");
    }

    async handleConnection(@ConnectedSocket() client: Socket) {
        try {
            const token = client.handshake.query.token as string;
            if (token) {

                const decoded = jwt.verify(
                    token,
                    process.env.AT_SECRET,
                ) as JwtPayload;

                client.data = {
                    userId: decoded.sub,
                    email: decoded.email,
                    role: decoded.role,
                };

                // if (this.socketUserConnections.has(client.data.userId) || this.pendingSocketConnections.has(client.data.userId)) {
                //   console.log("client already exists", client.data.userId);
                //   client.disconnect();
                //   return;
                // }

                this.addUserToSocketConnection(
                    client.data.userId,
                    client.id,
                    decoded.role as Role,
                );

                console.log(`Connecting : ${client.data.userId}`);

                // this.pendingSocketConnections.set(client.data.userId, client.data.userId);

                const user = await this.authService.fetchUserById(
                    client.data.userId,
                );

                if (!user) {
                    throw new NotFoundException("Could not find the user");
                }

                await this.updateUserStatus(client.data.userId, UserStatus.Online);

                if (user.role === Role.CLIENT) {
                    let chatRoom = await this.randomService.findChatRoomByUserId(
                        user.userId,
                    );
                    if (!chatRoom) {
                        let admin;
                        if (user.cvSpecialistId) {
                            admin = await this.authService.fetchUserById(
                                user.cvSpecialistId,
                            );
                        } else admin = await this.randomService.findRandomAdmin();
                        chatRoom = await this.randomService.createChatRoom(
                            user.userId,
                            admin?.userId,
                        );
                    }
                    client.join(user.userId);
                    client.emit("chat-room", {
                        type: Role.CLIENT,
                        roomId: chatRoom.roomId,
                    });
                } else {
                    const chatRooms =
                        await this.randomService.findChatRoomsByAdminId(
                            user.userId,
                        );
                    chatRooms.forEach((room) => {
                        client.join(room.roomId);
                        console.log(
                            `${user.userId} just joined room ${room.roomId}`,
                        );
                        client.emit("chat-room", {
                            type: Role.ADMIN,
                            roomId: room.roomId,
                        });
                    });
                }
            }
        } catch (error) {
            console.log("Handle Connection Error: ", error);
            client.disconnect();
        }
    }

    @SubscribeMessage("message")
    async handleMessage(
        @MessageBody()
        data: {
            message: string;
            roomId?: string;
            fileId?: string;
        },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const userId = client.data.userId;
            const messageContent = data.message;
            let chatRoom;
            if (data.roomId && client.data.role === Role.ADMIN) {
                chatRoom = await this.randomService.getChatRoomById(
                    data.roomId,
                );
            } else {
                chatRoom =
                    await this.randomService.findChatRoomByUserId(userId);
            }
            const participants = await this.randomService.findParticipants(
                chatRoom.roomId,
            );
            let uploadedFile;
            const sender = new User();
            sender.userId = userId;
            if (data?.fileId) {
                uploadedFile = await this.filesService.getFile(
                    data.fileId,
                    userId,
                );
                this.randomService.createChat(
                    chatRoom,
                    sender,
                    messageContent,
                    uploadedFile.data,
                );
            } else
                this.randomService.createChat(chatRoom, sender, messageContent);
            participants.map((participant) => {
                if (participant.userId !== userId) {
                    const userConnection = this.socketUserConnections.get(
                        participant.userId,
                    );
                    if (userConnection) {
                        console.log(
                            `Message send to ${userConnection.clientId}`,
                        );
                        this.server
                            .to(userConnection.clientId)
                            .emit("message", {
                                sender: {
                                    ...participant,
                                    userId: userId,
                                },
                                text: messageContent,
                                files: uploadedFile?.data
                                    ? [uploadedFile.data]
                                    : [],
                                chatRoom: chatRoom,
                                createdAt: new Date(),
                            });
                    }
                }
            });
        } catch (error) {
            console.error(error);
            this.logger.error(`Error handling message: ${error.message}`);
        }
    }

    @SubscribeMessage("joinRoom")
    async handleJoinRoom(
        @MessageBody() data: { ticketId: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const ticketId = data.ticketId;
            // TODO: fetch user ?
            // const assignedUserResponse = await this.httpService.get<any>(`auth/ticket-user/${ticketId}`);
            const assignedUserResponse =
                await this.ticketService.checkTicketUser(ticketId);
            if (assignedUserResponse && assignedUserResponse.userId) {
                client.join(ticketId);
                this.sendNotificationToOtherParticipants(
                    client.data.userId,
                    ticketId,
                    "Admin member joined the conversation",
                );
                this.logger.log(
                    `Admin member ${assignedUserResponse.userId} joined room for ticket ${ticketId}`,
                );
            } else {
                this.logger.error(
                    `Admin member is not assigned to ticket ${ticketId}`,
                );
            }
        } catch (error) {
            this.logger.error(`Error in handleJoinRoom: ${error.message}`);
            console.log(error);
        }
    }

    @SubscribeMessage("leaveRoom")
    async leaveRoom(
        @MessageBody() data: { ticketId: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const userId = client.data.userId;
            const ticketId = data.ticketId;

            const isPartOfConversation = await this.isUserInConversation(
                userId,
                ticketId,
            );
            if (isPartOfConversation) {
                client.leave(ticketId);
                this.server
                    .to(ticketId)
                    .emit(
                        "notification",
                        `User ${userId} has left the room ${ticketId}`,
                    );
            } else {
                this.logger.error(
                    `User ${userId} is not part of the room ${ticketId}`,
                );
            }
        } catch (error) {
            this.logger.error(`Error leaving room: ${error.message}`);
        }
    }

    jobScoreProcessing(data: any) {
        if (data) {
            this.server.emit("jobScoreProcessing", data);
        } else {
            this.logger.warn(`No jobs found.`);
        }
    }

    async handleDisconnect(@ConnectedSocket() client: Socket) {
        try {
            this.removeUserToSocketConnection(client.data.userId);
            this.pendingSocketConnections.delete(client.data.userId);
            await this.updateUserStatus(client.data.userId, UserStatus.Offline);
            this.logger.log(
                `Client disconnected: ${client.id}--------------->`,
            );
        } catch (err) {
            console.log("Handle Disconnect Error: ", err);
        }
    }

    private addUserToSocketConnection(
        userId: string,
        clientId: any,
        role: Role,
    ) {
        const userConnectionInfo: UserConnectionInfo = {
            userId: userId,
            clientId: clientId,
            role: role,
            status: UserStatus.Online,
        };

        this.socketUserConnections.set(String(userId), userConnectionInfo);
    }

    private removeUserToSocketConnection(userId: string) {
        this.socketUserConnections.delete(userId);
    }

    private async isUserInConversation(
        userId: string,
        ticketId: string,
    ): Promise<boolean> {
        const conversation =
            await this.chatService.findConversationByTicketId(ticketId);
        return conversation
            ? conversation.participants.some((p) => p.userId === userId)
            : false;
    }

    private getUserClientIds(userId: string): any[] {
        return this.socketUserConnections.get(userId)?.clientId
            ? [this.socketUserConnections.get(userId).clientId]
            : [];
    }

    private async sendNotificationToOtherParticipants(
        senderId: string,
        ticketId: string,
        message: string,
        isMessage?: Message,
    ) {
        try {
            const conversation =
                await this.chatService.findConversationByTicketId(ticketId);
            if (conversation) {
                const participantIds = conversation.participants.map(
                    (participant) => participant.userId,
                );
                const otherParticipants = participantIds.filter(
                    (id) => id !== senderId,
                );
                for (const userId of otherParticipants) {
                    const clientIds = this.getUserClientIds(String(userId));
                    if (isMessage) {
                        await this.notificationService.createNotification(
                            userId,
                            ticketId,
                            `New message Received by => ${isMessage.sender}  Message => ${isMessage.content}`,
                        );
                    }
                    try {
                        for (const clientId of clientIds) {
                            this.server
                                .to(clientId)
                                .emit("notification", message);
                            if (isMessage) {
                                this.server
                                    .to(clientId)
                                    .emit(
                                        "message",
                                        `New message Received by => ${isMessage.sender.email}  Message => ${isMessage.content}`,
                                    );
                            }
                        }
                    } catch (error) {
                        this.logger.error(
                            `Error creating notification for user ${userId}: ${error.message}`,
                        );
                    }
                }
            }
        } catch (error) {
            this.logger.error(
                `Error retrieving conversation for ticket ${ticketId}: ${error.message}`,
            );
        }
    }

    sendToUserValuateProfile(userId: string, data: any) {
        const userConnection = this.socketUserConnections.get(userId);
        if (userConnection) {
            try {
                this.server
                    .to(userConnection.clientId)
                    .emit("valuateProfile", data);
            } catch (error) {
                console.error(`Error sending data to user ${userId}:`, error);
            }
        } else {
            console.error(`User ${userId} is not connected.`);
        }
    }

    sendToUserGetCvScore(userId: string, data: any) {
        const userConnection = this.socketUserConnections.get(userId);
        if (userConnection) {
            try {
                this.server
                    .to(userConnection.clientId)
                    .emit("getCvScore", data);
            } catch (error) {
                console.error(`Error sending data to user ${userId}:`, error);
            }
        } else {
            console.error(`User ${userId} is not connected.`);
        }
    }

    sendFetchuserprofile(userId: string, data: any) {
        // sending valuatorsalary, keywordscore and grammarScore
        const userConnection = this.socketUserConnections.get(userId);
        if (userConnection) {
            try {
                this.server
                    .to(userConnection.clientId)
                    .emit("fetchUserAiScores", data);
            } catch (error) {
                console.error(`Error sending data to user ${userId}:`, error);
            }
        } else {
            console.error(`User ${userId} is not connected.`);
        }
    }

    async updateUserStatus(userId: string, status: UserStatus) {
        const user = await this.userRepository.findOne({
            where: { userId },
        });
        if (!user) {
            throw new NotFoundException("Could not find user: " + userId);
        }
        user.status = status;
        await this.userRepository.save(user);
    }

}
