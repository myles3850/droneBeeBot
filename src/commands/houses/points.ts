import { ChatInputCommandInteraction, GuildMember, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import dbSource from '../../dbConnection';
import { House, Point, User } from '../../entity';
import ErrorLogger from '../../classes/errorHandling';

export const data = new SlashCommandBuilder()
	.setName('points')
	.setDescription('point allocation')
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addSubcommand( subcommand =>
		subcommand
			.setName('award')
			.setDescription('Allocate points to a house and user')
			.addUserOption( option =>
				option
					.setName('user')
					.setDescription('The user who has won points for their house')
					.setRequired(true)
			)
			.addNumberOption( option =>
				option
					.setName('points')
					.setDescription('amount of points to award')
					.setRequired(true)
			)
	)
	.addSubcommand( subcommand =>
		subcommand
			.setName('punish')
			.setDescription('Allocate points to a house and user')
			.addUserOption( option =>
				option
					.setName('user')
					.setDescription('The user who has lost points for their house')
					.setRequired(true)
			)
			.addNumberOption( option =>
				option
					.setName('points')
					.setDescription('amount of points to remove (enter a positive value)')
					.setRequired(true)
			)
	)
	.addSubcommandGroup( group =>
		group
			.setName('tally')
			.setDescription('total up the points and show who is in what position')
			.addSubcommand( subcommand =>
				subcommand
					.setName('house')
					.setDescription('tally all the points for a house')
					.addStringOption( option =>
						option
							.setName('house')
							.setDescription('select house to check total points')
							.setChoices()
					)
			)
			.addSubcommand( subcommand =>
				subcommand
					.setName('users')
					.setDescription('tally to top contributors of points')
			)
	)


export const execute = async (interaction: ChatInputCommandInteraction) => {
	const subcommandGroup = interaction.options.getSubcommandGroup();

	await interaction.deferReply();

	switch (subcommandGroup) {
		case 'tally':
			await pointTallyingLogic(interaction);
			return;
		case null:
			await pointAllocationLogic(interaction);
			return;
		default:
			break;
	}
};


const pointAllocationLogic = async (interaction: ChatInputCommandInteraction): Promise<void> => {
	const user = interaction.options.getMember('user') as GuildMember;
	const points = interaction.options.getNumber('points') as number;
	const commandSelected = interaction.options.getSubcommand();

	const pointsRepo = dbSource.getRepository(Point);


	const userData = await dbSource.getRepository(User).findOne({
		where: {discordId: user.id},
		relations: {houseId: true}
	});

	if (userData === null || userData.houseId == null) {
		await interaction.editReply(`Something's gone wrong, contact @choccobear`);
		await interaction.followUp({ content: `the likely cause is that the user isn't assigned a house, try that and call the boss if i still cant do it`,
									ephemeral: true
								});
		new ErrorLogger('userData = null', 'points#preFlightChecks', {userData, user});
		return;
	};
	const houseData = await dbSource.getRepository(House).findOne({where: {id: userData.houseId.id}});



	if (commandSelected === 'award') {
		const pointsData = new Point();
		pointsData.pointsAwarded = points;
		pointsData.userAwarded = userData;
		pointsData.houseAwarded = houseData as House;

		try {
			await pointsRepo.save(pointsData);
			await interaction.editReply('awarded');
		} catch (error) {
			new ErrorLogger(error, 'points#awardPoints', {pointsData, userData, points});
		};

	} else if (commandSelected === 'punish') {
		const pointsData = new Point();
		pointsData.pointsAwarded = -points;
		pointsData.userAwarded = userData;
		pointsData.houseAwarded = houseData as House;

		try {
			await pointsRepo.save(pointsData);
			await interaction.editReply('punished');
		} catch (error) {
			new ErrorLogger(error, 'points#punishPoints', {pointsData, userData, points});
		};
	};
};


const pointTallyingLogic = async (interaction: ChatInputCommandInteraction): Promise<void> => {
	const commandSelected = interaction.options.getSubcommand();

	const pointsRepo = dbSource.getRepository(Point);



	if (commandSelected === 'house') {
		const houseSelected = interaction.options.getString('house') as string;

		const houseObj = await dbSource.getRepository(House).findOne({where: {name: houseSelected}});

		if (houseObj === null){
			return;
		}

		const pointsForHouse = await pointsRepo
		.createQueryBuilder('point') // Replace 'entity' with the alias for your entity in the query.
		.leftJoinAndSelect('point.house', 'id') // Replace 'relatedField' with the actual related field name.
		.where('house.id = :houseId', { houseId: houseObj.id })
		.getMany();

		await interaction.editReply('house');

	}


}