const express = require("express");
const healthCheck = require("../controllers/healthCheck.js");

const router = express.Router();

router.route("/").get(healthCheck);

module.exports = router;
