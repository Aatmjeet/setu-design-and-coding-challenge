const express = require('express');
const cors = require("cors")
const bodyParser = require("body-parser")
const appRoutes = require("./routes/app_routes");
const ErrorHandler = require('./custom_error_handler/error_handler')


const app = express();

app.use(cors())

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use("/", appRoutes)

// Custom error handler at the end!
app.use(ErrorHandler)


// Start the server
app.listen(8080, () => {
	console.log('Server started on port 8080');
});
