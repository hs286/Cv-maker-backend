import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn
} from "typeorm";

@Entity()
export class Cv_Type {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    section: string;

    @Column({ nullable: false })
    name: string;

    @Column({ nullable: true })
    standard: boolean;

    @Column({ nullable: true })
    graduate: boolean;

    @Column({ nullable: true })
    academic: boolean;

    @Column({ nullable: true })
    transition: boolean;

    @Column({ nullable: true })
    contractor: boolean;

    @Column({ nullable: true })
    combined: boolean;

    @Column({ nullable: true })
    international: boolean;

    @Column({ nullable: true })
    picture: boolean;

    @Column({ nullable: true })
    executive: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
