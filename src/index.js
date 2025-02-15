const app = require("./app.js");
const db_connect = require("./db/index.js");

// dotenv
require("dotenv").config();

const PORT = process.env.PORT || 3000;

db_connect()
    .then(
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        })
    )
    .catch((err) => {
        console.error("MongoDB connection error", err);
        process.exit(1);
    });
