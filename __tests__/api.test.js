const request = require("supertest");

const { execSync } = require("child_process");
const testPrisma = require("../prisma/prisma_test_client");

// Import app, so it starts
const app = require("../app");

require("dotenv").config();

describe("Setu app test", () => {
	beforeAll(async () => {
		// Run migrations against the test database
		execSync(
			`DATABASE_URL=${process.env.TEST_DATABASE_URL} npx prisma migrate deploy`
		);

		await testPrisma.$connect();
	});

	// This hook runs before each test case
	beforeEach(async () => {
		// Clear the user, group, groupUser, table before each test\
		await testPrisma.transactionPayee.deleteMany()
		await testPrisma.transaction.deleteMany()
		await testPrisma.GroupUser.deleteMany()
		await testPrisma.Group.deleteMany()
		await testPrisma.User.deleteMany()
	});

	afterAll(async () => {
		// Close the Prisma client connection after all __tests__
		await testPrisma.$disconnect();
	});


	/* @ User tests */
	describe("Create user test", () => {
		it("It should create a user", async () => {
			const newUser = {
				"name": "John deo",
				"email": "johndeo@gmail.com"
			}

			// Send a POST request to the API endpoint
			const response = await request("http://localhost:8080")
				.post("/user/")
				.send(newUser)
				.expect(201);

			// Check the response body
			expect(response.body).toHaveProperty("id");

			// Check if the user is saved in the database
			const createdUser = await testPrisma.user.findFirst({
				where: { email: newUser.email, id:response.body.id },
			});

			expect(createdUser).toBeDefined();
		});

		it("It should return 500 if required fields are missing", async () => {
			const newUser = {
				"name": "John deo",
			}

			// Send a POST request to the API endpoint
			const response = await request("http://localhost:8080")
				.post("/user/")
				.send(newUser)
				.expect(500);

			// Check the response body
			expect(JSON.parse(response.error.text)).toHaveProperty("status");
			expect(JSON.parse(response.error.text).message).toBe("email is a required field");
		});
	});


	/* @ Group tests*/
	describe("Create user group test", () => {
		it("It should create a group", async () => {
			const user1 = await testPrisma.user.create({data:{
					"name": "John deo",
					"email": "johndeo@gmail.com"
				}})
			const user2 = await testPrisma.user.create({data:{
					"name": "John doe",
					"email": "johndoe@gmail.com"
				}})
			const newGroup = {
				"name": "John's group",
				"users": [user1.id, user2.id]
			}
			// Send a POST request to the API endpoint
			const response = await request("http://localhost:8080")
				.post("/group/")
				.send(newGroup)
				.expect(201);

			// Check the response body
			expect(response.body).toHaveProperty("group_id");

			// Check if the user is saved in the database
			const createdGroup = await testPrisma.group.findFirst({
				where: { id:response.body.id },
			});

			expect(createdGroup).toBeDefined();
		});

		it("It should return 400 if a user does not exist", async () => {
			const user1 = await testPrisma.user.create({
				data: {
					"name": "John deo",
					"email": "johndeo@gmail.com"
				}
			})
			const newGroup = {
				"name": "John's group",
				"users": [user1.id, 2333]
			}
			// Send a POST request to the API endpoint
			const response = await request("http://localhost:8080")
				.post("/group/")
				.send(newGroup)
				.expect(400);
			// Check the response body
			expect(response.body.error).toBe("One or more user(s) do not exists");
		});


		it("It should return 500 if required fields are missing", async () => {
			const user1 = await testPrisma.user.create({data:{
					"name": "John deo",
					"email": "johndeo@gmail.com"
				}})
			const user2 = await testPrisma.user.create({data:{
					"name": "John doe",
					"email": "johndoe@gmail.com"
				}})
			const newGroup = {
				"users": [user1.id, user2.id]
			}

			// Send a POST request to the API endpoint
			const response = await request("http://localhost:8080")
				.post("/group/")
				.send(newGroup)
				.expect(500);

			// Check the response body
			expect(JSON.parse(response.error.text)).toHaveProperty("status");
			expect(JSON.parse(response.error.text).message).toBe("Group name is required");
		});
	});

	/* @ Transaction test*/
	describe("Create a transaction test", () => {
		it("It should create a exact split transaction", async () => {
			const user1 = await testPrisma.user.create({data:{
					"name": "John deo",
					"email": "johndeo@gmail.com"
				}})
			const user2 = await testPrisma.user.create({data:{
					"name": "John doe",
					"email": "johndoe@gmail.com"
				}})
			const users = [user1.id, user2.id]
			const newGroup = await testPrisma.group.create({
				data: {
					name: "John's Group",
					members: {
						create: users.map(userId => ({
							User: { connect: { id: userId } }
						}))
					}
				}
			});

			const payeeMap = {}
			payeeMap[user1.id] = 140
			payeeMap[user2.id] = 60

			const newTransaction = {
				"groupId": newGroup.id,
				"description": "lunch",
				"payerId": user1.id,
				"total": 200,
				"splitType":"EXACT",
				"payeeMap":payeeMap
			}

			// Send a POST request to the API endpoint
			const response = await request("http://localhost:8080")
				.post("/transaction/")
				.send(newTransaction).expect(201)

			// Check the response body
			expect(response.body).toHaveProperty("transaction_id");

			// Check if the user is saved in the database
			const createdTransaction = await testPrisma.transaction.findFirst({
				where: { id:response.body.id, groupId: newGroup.id},
			});
			expect(createdTransaction).toBeDefined();
		});

		it("It should create a equal split transaction", async () => {
			const user1 = await testPrisma.user.create({data:{
					"name": "John deo",
					"email": "johndeo@gmail.com"
				}})
			const user2 = await testPrisma.user.create({data:{
					"name": "John doe",
					"email": "johndoe@gmail.com"
				}})
			const users = [user1.id, user2.id]
			const newGroup = await testPrisma.group.create({
				data: {
					name: "John's Group",
					members: {
						create: users.map(userId => ({
							User: { connect: { id: userId } }
						}))
					}
				}
			});


			const newTransaction = {
				"groupId": newGroup.id,
				"description": "lunch",
				"payerId": user1.id,
				"total": 200,
				"splitType":"EQUAL",
			}

			// Send a POST request to the API endpoint
			const response = await request("http://localhost:8080")
				.post("/transaction/")
				.send(newTransaction).expect(201)

			// Check the response body
			expect(response.body).toHaveProperty("transaction_id");

			// Check if the user is saved in the database
			const createdTransaction = await testPrisma.transaction.findFirst({
				where: { id:response.body.id, groupId: newGroup.id},
			});
			expect(createdTransaction).toBeDefined();
		});

		it("It should return 500 if required fields are missing", async () => {
			const user1 = await testPrisma.user.create({data:{
					"name": "John deo",
					"email": "johndeo@gmail.com"
				}})
			const user2 = await testPrisma.user.create({data:{
					"name": "John doe",
					"email": "johndoe@gmail.com"
				}})
			const users = [user1.id, user2.id]
			const newGroup = await testPrisma.group.create({
				data: {
					name: "John's Group",
					members: {
						create: users.map(userId => ({
							User: { connect: { id: userId } }
						}))
					}
				}
			});


			const newTransaction = {
				"groupId": newGroup.id,
				"description": "lunch",
				"payerId": user1.id,
				"total": 200,
			}
			// Send a POST request to the API endpoint
			const response = await request("http://localhost:8080")
				.post("/transaction/")
				.send(newTransaction)
				.expect(500);

			// Check the response body
			expect(JSON.parse(response.error.text)).toHaveProperty("status");
			expect(JSON.parse(response.error.text).message).toBe("You need to specify split type");
		});

		/* @ split type: exact but values don't add up to total */
		it("It should return 400 if in exact split all values do not addup to total", async () => {
			const user1 = await testPrisma.user.create({data:{
					"name": "John deo",
					"email": "johndeo@gmail.com"
				}})
			const user2 = await testPrisma.user.create({data:{
					"name": "John doe",
					"email": "johndoe@gmail.com"
				}})
			const users = [user1.id, user2.id]
			const newGroup = await testPrisma.group.create({
				data: {
					name: "John's Group",
					members: {
						create: users.map(userId => ({
							User: { connect: { id: userId } }
						}))
					}
				}
			});


			const payeeMap = {}
			payeeMap[user1.id] = 140
			payeeMap[user2.id] = 30

			const newTransaction = {
				"groupId": newGroup.id,
				"description": "lunch",
				"payerId": user1.id,
				"total": 200,
				"splitType":"EXACT",
				"payeeMap":payeeMap
			}
			// Send a POST request to the API endpoint
			const response = await request("http://localhost:8080")
				.post("/transaction/")
				.send(newTransaction)
				.expect(400);

			// Check the response body
			expect(JSON.parse(response.error.text)).toHaveProperty("status");
			expect(JSON.parse(response.error.text).message).toBe("Split money total is not equal to total!");
		});
	});
});
