const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: String,
    isAdmin: Boolean
});

userSchema.plugin(passportLocalMongoose, {usernameField: "email"});
const User = mongoose.model("User", userSchema);

module.exports = User;