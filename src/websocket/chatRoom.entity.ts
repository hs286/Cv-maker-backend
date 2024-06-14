import { Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "../auth/0auth2.0/entites/user.entity";

@Entity()
export class ChatRoom {
  @ApiProperty({
    description: 'unique identifier of the chat room'
  })
  @PrimaryColumn()
  roomId: string;

  @ApiProperty({
    description: 'client user of the chat room'
  })
  @ManyToOne(() => User, (user) => user.userId)
  client: User;

  @ApiProperty({
    description: 'admin user of the chat room'
  })
  @ManyToOne(() => User, (user) => user.userId)
  admin: User;
}