const get_prisma_client = require('../prisma/get_prisma_client')
const prisma = get_prisma_client()
const { Prisma } = require("@prisma/client")
const { CreateUserSchema } = require("../input_schema/api_schema")

class UserController {
	create_user = async (req, res, next) => {

		try {
			const { name, email } = CreateUserSchema.validateSync(req.body, { abortEarly: false, stripUnknown: true })
			const newUser = await prisma.User.create({
				data: {
					name,
					email
				}
			});
			res.status(201).json({id:newUser.id});
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === 'P2002') {
					res.status(400).json({
						error:
							'There is a unique constraint violation, a new user cannot be created with this email'
					})
				}
			}
			else
				next(error)
		}
	}
}

module.exports = UserController
