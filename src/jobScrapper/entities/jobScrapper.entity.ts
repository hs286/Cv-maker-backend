import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryGeneratedColumn
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

@Entity()
export class ScrappedJobEntity {
    @ApiProperty({
        description: "unique identifier in database."
    })
    @PrimaryGeneratedColumn()
    j_id: number;

    @Column()
    @ApiProperty({
        description: "scrapped job id."
    })
    jobId: string;

    @Column({
        nullable: true
    })
    @ApiProperty()
    jobUrl: string;

    @Column({
        nullable: true
    })
    @ApiProperty()
    jobTitle: string;

    @ApiProperty()
    @Column({
        nullable: true
    })
    searchTitle: string;

    @Column({
        nullable: true
    })
    @ApiProperty()
    searchLocation: string;

    @Column({
        nullable: true
    })
    @ApiProperty()
    locationName: string;

    @Column({
        nullable: true
    })
    @ApiProperty()
    minimumSalary: string;

    @Column({
        nullable: true
    })
    @ApiProperty()
    maximumSalary: string;

    @Column({
        nullable: true,
        type: "longtext",
        charset: "utf8mb4",
        collation: "utf8mb4_unicode_ci"
    })
    @ApiProperty()
    jobDescription: string;

    @Column({
        nullable: false
    })
    @ApiProperty()
    userId: string;

    @Column({
        nullable: true
    })
    @ApiProperty()
    pageNbr: string;

    @Column({
        nullable: true
    })
    @ApiProperty()
    JobType: string;

    @Column({
        nullable: true
    })
    @ApiProperty()
    employerName: string;

    @Column({
        nullable: true
    })
    @ApiProperty()
    currency: string;

    @Column({
        nullable: true
    })
    @ApiProperty()
    textSalary: string;

    @Column({
        nullable: true
    })
    @ApiProperty()
    period: string;

    @Column({
        nullable: true
    })
    @ApiProperty()
    ContractType: string;

    @Column({
        nullable: true
    })
    @ApiProperty()
    SalaryType: string;

    // USER CENTRIC DETAILS keywords_score and wordsmatch
    @Column({
        nullable: true
    })
    @ApiProperty()
    keywordsScore: string;
    
    @Column({
        nullable: true,
        default: true
    })
    @ApiProperty()
    keywordsScoreProcessing: boolean;
    // JSON string. so we can later change it to an array by JSON PARSE.
    // It will be an array of objects so store as a json string',
    // response example  "words_matched": [ {"word": "string", "count": 0,"weightage": 0 (IMPORTANT) } ]
    @ApiProperty({
        description: "words match array of objects. Stored as json string."
    })
    @Column({
        nullable: true,
        type: "longtext"
    })
    wordsMatch: string;

    @ApiProperty({
        description: "words match array of objects. Stored as json string."
    })
    @Column({
        nullable: true
    })
    sector: string;

    @Column({
        default: false
    })
    isApplied: boolean;

    @Column({
        nullable: true
    })
    source: string;

    @CreateDateColumn()
    @ApiProperty()
    createdDate: Date;

    @UpdateDateColumn()
    @ApiProperty()
    updatedDate: Date;
}
