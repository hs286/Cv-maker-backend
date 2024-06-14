import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from "../../auth/0auth2.0/entites/user.entity";
import { Conversation } from "../../conversation/entites/conversation.entity";

@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Conversation, conversation => conversation.notifications)
  conversation: Conversation;

  @Column()
  content: string;

  @Column({ default: false })
  acknowledged: boolean;

  @Column({ default: false })
  dismissed: boolean;

  @ManyToOne(() => User, user => user.notifications) 
  user: User; 
}
