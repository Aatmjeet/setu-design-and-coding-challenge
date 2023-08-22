const get_prisma_client = require('../prisma/get_prisma_client')
const {Prisma} = require("@prisma/client");
const prisma = get_prisma_client()
const { CreateGroupSchema } = require("../input_schema/api_schema")
class GroupController {
	create_group = async (req, res, next) => {

		try {
			const { name, users } = CreateGroupSchema.validateSync(req.body, { abortEarly: false, stripUnknown: true })
			const newGroup = await prisma.group.create({
				data: {
					name,
					members: {
						create: users.map(userId => ({
							User: { connect: { id: userId } }
						}))
					}
				}
			});
			res.status(201).json({group_id: newGroup.id});
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === 'P2025') {
					res.status(400).json({
						error:
							'One or more user(s) do not exists'
					})
				}
			}
			else{
				next(error);
			}
		}
	}

	getGroupMembers = async (groupId) => {
		return prisma.group.findFirst({
			where:{
				id: groupId
			},
			select:{
				members: true
			}
		})
	}
}

module.exports = GroupController
