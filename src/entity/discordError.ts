import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class DiscordError {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	command: string;

	@Column({ type: 'text' })
	variables?: string | undefined;

	@Column({ type: 'text' })
	error: string;
}
