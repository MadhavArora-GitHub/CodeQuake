const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: String,
    isVisible: Boolean,
    problemStatement: String,
    constraints: String,
    input: String,
    output: String,
    sampleTestcases: Number,
    sampleInput: [String],
    sampleOutput: [String],
    timeLimit: Number,
    memoryLimit: Number,
    difficulty: String,
    tags: [String],
    solution: String,
    tutorial: String,
    problemSetter: [String],
    testcases: [{in: String, out: String}]
});

const Problem = mongoose.model("Problem", problemSchema);

module.exports = Problem;