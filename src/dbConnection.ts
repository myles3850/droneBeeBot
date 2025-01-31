import 'dotenv/config';
import { DataSource } from 'typeorm';

const dbSource = new DataSource({
	type: 'mysql',
	host: process.env.dbHost,
	port: Number(process.env.dbPort),
	database: process.env.database,
	username: process.env.dbUsername,
	password: process.env.dbPassword,
	entities: ['src/entity/*.ts', './entity/*.*'],
	migrations: ['src/migration/*.ts'],
	ssl: {
		ca: process.env.cert,
		rejectUnauthorized: false,
	},
});

export default dbSource;
