import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn, BeforeInsert } from "typeorm";
import { GameMapInDb } from '@fatpaper-monopoly/types';

@Entity()
export class GameMap implements GameMapInDb {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ type: "varchar", nullable: false })
	name: string;

  @Column({ type: "varchar", nullable: false })
	url: string;

	@Column({ type: "boolean", nullable: false, default: false })
	inuse: boolean;
}
