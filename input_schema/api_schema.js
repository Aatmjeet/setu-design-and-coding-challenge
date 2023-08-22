const yup = require('yup')
const mapValues = require('lodash/mapValues')

const CreateUserSchema = yup.object({
	name:yup.string().trim().min(2).max(50).required("User's name is required"),
	email: yup.string().required().email(),
}).required()


const CreateGroupSchema = yup.object({
	name: yup.string().required("Group name is required"),
	users:yup.array().of(yup.number().required()).required()
}).required()


const CreateTransactionSchema = yup.object({
	groupId: yup.number().required("Group ID is required"),
	description:yup.string().notRequired(),
	payerId: yup.number().required("You need to specify payer"),
	total: yup.number().required("You need to specify total value"),
	splitType: yup.string().oneOf(["EXACT", "EQUAL"]).required("You need to specify split type"),
	payeeMap: yup.lazy(obj => yup.object(
		mapValues(obj, () => yup.number())
	))
}).required()

module.exports = { CreateUserSchema, CreateGroupSchema, CreateTransactionSchema }
