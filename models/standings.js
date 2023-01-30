const mongoose = require("mongoose");

const standingSchema = new mongoose.Schema({
    contestId: {
        type: String,
        required: true,
        unique: true
    },
    users: [String]
});

const Standing = mongoose.model("Standing", standingSchema);

module.exports = Standing;