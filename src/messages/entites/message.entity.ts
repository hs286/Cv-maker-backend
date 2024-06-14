
import { User } from "../../auth/0auth2.0/entites/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Conversation } from "../../conversation/entites/conversation.entity";

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Conversation, conversation => conversation.messages)
  conversation: Conversation;

  @ManyToOne(() => User, user => user.userId)
  sender: User;

  @Column()
  content: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

}
