import { Events, Message } from 'discord.js';
import ErrorLogger from '../classes/errorHandling';
import dbSource from '../dbConnection';
import { House, Point, User } from '../entity';

export const name = Events.MessageCreate;

export const execute = async (interaction: Message) => {
	const messageUser = interaction.author;
	const userDetails = await dbSource.getRepository(User).findOne({where: {discordId: messageUser.id}});

	if (userDetails === null || userDetails?.houseId === null) { return };

	const pointSource = dbSource.getRepository(Point);
	const pointAllocation = new Point();

	pointAllocation.userId = userDetails;
	pointAllocation.pointsAwarded = 1;
	pointAllocation.houseAwarded = userDetails.houseId as House;

	try {
		await pointSource.save(pointAllocation);
	} catch (error) {
		new ErrorLogger(error, 'messageReceived.savePoint', {interaction, userDetails})
	}

};