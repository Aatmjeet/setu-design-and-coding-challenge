const get_prisma_client = require('../prisma/get_prisma_client')
const {Prisma} = require("@prisma/client");
const prisma = get_prisma_client()
const GroupController = require("../controllers/group_controller")
const eqSet =  require("../utils/compare_sets")
const HttpError = require('../custom_error_handler/custom_http_error')
const { CreateTransactionSchema } = require("../input_schema/api_schema")

class TransactionController {
	groupController
	constructor() {
		this.groupController = new GroupController()
	}
	create_transaction = async (req, res, next) => {

		try {
			const { groupId, description, payerId, total, splitType, payeeMap } = CreateTransactionSchema.validateSync(req.body, { abortEarly: false, stripUnknown: true })
			const groupMembers = await this.groupController.getGroupMembers(groupId)

			if(groupMembers === null)
				throw new HttpError("Invalid group in request!",  400)

			let payeeValues = []

			if(splitType === "EXACT")
			{
				if(Object.keys(payeeMap).length < 1)
					throw new HttpError("Minimum one payee is required for a transaction!",  400)
				if(!this.validateAllMembers(groupMembers.members.map(el => el.userId), Object.keys(payeeMap).map(el => parseInt(el))))
					throw new HttpError("All members not found!", 400)
				if(!this.validateTotalMoney(total, Object.values(payeeMap)))
					throw new HttpError("Split money total is not equal to total!", 400)


				Object.keys(payeeMap).forEach((el) => payeeValues.push({userId: el, amount: payeeMap[el]}))
			}
			else{
				groupMembers.members.forEach(el => {
					payeeValues.push({userId: el.userId, amount: total / groupMembers.members.length})
				})
			}
			const newTransaction = await prisma.transaction.create({
				data: {
					groupId,
					description,
					payerId,
					total,
					splitType,
					TransactionPayee: {
						create: payeeValues.filter((el) => parseInt(el.userId) !== payerId).map(el => ({
							Payee: { connect: { id: parseInt(el.userId) } },
							amount: el.amount
						}))
					}
				}
			});
			res.status(201).json({transaction_id: newTransaction.id});
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
				next(error)
			}
		}
	}

	list_all_transactions = async (req, res) => {
		let { userId } = req.params
		let { groupId, startDate, endDate } = req.query

		userId = parseInt(userId)


		const startDateQueryString = !!startDate ? Prisma.sql`AND tt."createdAt" >= ${new Date(startDate)}` : Prisma.sql``
		const endDateQueryString = !!endDate ? Prisma.sql`AND tt."createdAt" <= ${new Date(endDate)}` : Prisma.sql``

		const groupQueryString = !!groupId ?
			Prisma.sql`WHERE tt."groupId" IN ( SELECT tgu."groupId" FROM tbl__group_user tgu WHERE tgu."userId" = ${userId} AND tgu."groupId" = ${parseInt(groupId)})`:
			Prisma.sql`WHERE tt."groupId" IN ( SELECT tgu."groupId" FROM tbl__group_user tgu WHERE tgu."userId" = ${userId})`

		const result = await prisma.$queryRaw(
			Prisma.sql`Select
				tt.id,
				tt.description,
				tg.name as groupName,
				tt."createdAt",
				tt."splitType",
				tu.name as payer,
				tt.total,
				CASE
					WHEN tt."payerId" = ${userId} THEN (
							  SELECT SUM(ttp.amount)
							  FROM tbl__transaction_payee ttp
							  WHERE ttp."transactionId" = tt.id
					)
					ELSE (
							  	SELECT -SUM(ttp.amount)
								FROM tbl__transaction_payee ttp
								WHERE ttp."transactionId" = tt.id
								AND ttp."payeeId" = ${userId}
					)
				END AS pendingAmount
				FROM
					tbl__transaction tt
					INNER JOIN tbl__user tu ON tu.id=tt."payerId"
					INNER JOIN tbl__group tg ON tg.id=tt."groupId"
					${groupQueryString}
					${startDateQueryString}
					${endDateQueryString};`
		)

		/*
		* @Important:
		* converting this to string to typecase the BigInt values of sum from prisma tuple
		* link: https://github.com/prisma/studio/issues/614#issuecomment-1328105236
		*/
		let convertedRes = JSON.stringify(result, (key, value) =>
			typeof value === 'bigint' ? parseInt(value.toString()) : value,
		)
		res.status(200).json(JSON.parse(convertedRes))
	}


	validateAllMembers = (members, inputMembers) => {
		return eqSet(new Set(members), new Set(inputMembers))
	}

	validateTotalMoney = (total, payeeValues) =>{
		let payeeSum = 0;
		payeeValues.forEach((el) =>  payeeSum += el)
		return payeeSum === total
	}
}

module.exports = TransactionController
