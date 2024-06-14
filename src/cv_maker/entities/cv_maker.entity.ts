import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn
} from "typeorm";

@Entity()
export class Cv_Maker {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false, unique: true }) // Make name not nullable
    name: string;

    @Column({ nullable: false, unique: true }) // Make api_name not nullable
    api_name: string;

    @Column({ nullable: false, type: "text" }) // Make command not nullable
    command: string;

    @Column({ nullable: true }) // Make content nullable
    content: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
