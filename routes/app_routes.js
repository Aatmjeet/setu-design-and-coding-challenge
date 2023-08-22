const UserController = require("../controllers/user_controller.js")
const TransactionController = require("../controllers/transaction_controller.js")
const GroupController = require("../controllers/group_controller")

const express =  require("express")
const appRoutes = express.Router()

const userController = new UserController()
const groupController = new GroupController()
const transactionController = new TransactionController()

appRoutes.post("/user/", userController.create_user)

appRoutes.post("/group/",groupController.create_group)

appRoutes.post("/transaction/", transactionController.create_transaction)

appRoutes.get("/transactions/:userId", transactionController.list_all_transactions)

module.exports =  appRoutes
