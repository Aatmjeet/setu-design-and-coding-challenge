const { PrismaClient } = require('@prisma/client');

// Define the test database connection
const prisma_test_client = new PrismaClient({
	datasources: {
		db: {
			url: process.env.TEST_DATABASE_URL,
		},
	},
});


module.exports = prisma_test_client
