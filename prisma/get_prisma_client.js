const testPrisma = require("./prisma_test_client");
const {PrismaClient} = require("@prisma/client");

const get_prisma_client = () => {
	if(process.env.NODE_ENV === 'test')
		return testPrisma;
	else
		return new PrismaClient();
}

module.exports = get_prisma_client
