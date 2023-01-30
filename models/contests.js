const mongoose = require("mongoose");

const contestSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: String,
    start: Date,
    end: Date,
    problems: [{
        probId: String,
        score: Number
    }],
    processed: Boolean
});

const Contest = mongoose.model("Contest", contestSchema);

module.exports = Contest;