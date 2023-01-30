const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
    status: Boolean,
    probId: String, 
    username: String,
    subId: Number,
    code: String,
    language: String,
    verdict: String,
    cases: [String],
    time: Number,
    memory: Number,
    timestamp: {
        type: Date,
        default: Date.now()
    }
});

const Submission = mongoose.model("Submission", submissionSchema);

module.exports = Submission;