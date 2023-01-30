const mongoose = require("mongoose");

const participationSchema = new mongoose.Schema({
    contestId: {
        type: String,
        required: true
    },
    user: {
        username: String,
        problems: [{
            probId: String,
            submissions: [String],
            score: Number
        }],
        score: Number
    }
});

const Participation = mongoose.model("Participation", participationSchema);

module.exports = Participation;