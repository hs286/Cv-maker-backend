import { Column, Entity, ManyToOne, PrimaryColumn, OneToMany } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { ChatRoom } from "./chatRoom.entity";
import { User } from "../auth/0auth2.0/entites/user.entity";
import { File } from "src/files/entities/file.entity";

@Entity()
export class ChatEntity {
    @ApiProperty({
        description: "unique identifier of the chat"
    })
    @PrimaryColumn()
    chatId: string;

    @ApiProperty({
        description: "chat room of the chat"
    })
    @ManyToOne(() => ChatRoom, (chatRoom) => chatRoom.roomId, {
        onDelete: "CASCADE"
    })
    chatRoom: ChatRoom;

    @OneToMany(() => File, (file) => file.chat, { nullable: true })
    files: File[];

    @ApiProperty({
        description: "sender of the chat"
    })
    @ManyToOne(() => User, (user) => user.chats)
    sender: User;

    @ApiProperty({
        description: "text of the chat"
    })
    @Column({
        nullable: true
    })
    text: string;

    @ApiProperty({
        description: "creation date of the chat"
    })
    @Column()
    createdAt: Date;

    @ApiProperty({
        description: "update date of the chat"
    })
    @Column({
        nullable: true
    })
    updatedAt: Date;
}
