require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const mongoose = require("mongoose");
const passport = require("passport");
const http = require("http");
const socketio = require("socket.io");
const homeRoute = require("./routes/home");
const userRoute = require("./routes/user");
const Submission = require("./models/submissions");
const Contest = require("./models/contests");
const Standing = require("./models/standings");
const Participation = require("./models/participations");

const app = express();
const server = http.createServer(app);
const io = socketio(server);


app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
mongoose.set("strictQuery", true);

const User = require("./models/users");

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function (err, user) {
      done(err, user);
    });
});

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

const url = process.env.DB_URL;

mongoose.connect(url, (err)=>{
    if (err){
        console.log(err);
        console.log("kia dikkat he bhai?");
    }

    // setInterval(()=>{
        const curTime = new Date();

        Contest.find({processed: false, start: {$lte: curTime}}, (err, contests)=>{
            if (err){
                console.log(err);
            }

            contests.forEach(async (contest)=>{
                console.log(`Contest ${contest.id} started...`);
                startContest(contest);

                // await Contest.updateOne({_id: contest._id}, {$set: {processed: true}});  
            });

        });
    // }, 10000);
});


// GET route setup
app.get("*", (req, res, next)=>{
    if (req.isAuthenticated()){
        res.locals.user = req.user;
    }
    next();
});

// POST route setup
app.post("*", (req, res, next)=>{
    if (req.isAuthenticated()){
        res.locals.user = req.user;
    }
    next();
});


app.use("/", homeRoute);

let problemConnectionHandler = false;
app.get("/submission", async (req, res)=>{

    let submissions = [];
    try {
        submissions = await Submission.find({username: res.locals.user.username});
        submissions.reverse();

    } catch (e){
        console.log(e);
    }

    res.render("submission", {
        user: res.locals.user,
        submissions: submissions
    });

    if (!problemConnectionHandler){
        io.of("/submission").on("connection", async (socket)=>{
            console.log("Connected...");
        
            const subId = socket.handshake.query.subId;
        
            try {
                let intervalId = setInterval(()=>{
                    
                    Submission.findOne({subId: subId}, (err, submission)=>{
                        if (err){
                            console.log(err);
                        }
                        else {
                            if (submission.status === false){
                                socket.emit("message", "Running...");
                            }
                            else {
                                socket.emit("message", submission.verdict);
                                clearInterval(intervalId);
                            }
                        }
                    });
        
                }, 500);
        
            } catch (err) {
                console.log(err);
            }
        
        
            socket.on("disconnect", ()=>{
                console.log("Disconnected...");
            });
        });
        problemConnectionHandler = true;
    }
});

app.use("/user", userRoute);


io.of("/contest").on("connection", (socket)=>{
    console.log("aaja");

    let contestId;
    socket.on("join", (clientContestId)=>{
        socket.join(`contest/${clientContestId}`);
        contestId = clientContestId;
        console.log(`connected to ${contestId} ;)`);
        io.of("/contest").to(`contest/${contestId}`).emit("message", `connected to ${contestId} ${socket.id}`);
    });


    socket.on("disconnect", ()=>{
        console.log("bhaagja");
        socket.leave(`contest/${contestId}`);
    });
});

async function startContest(contest){
    let timeLeft = contest.end - Date.now() + 10000;

    // user: {
    //     username: String,
    //     problems: [{
    //         probId: String,
    //         submissions: [String],
    //         score: Number
    //     }],
    //     score: Number
    // }

    // status: Boolean,
    // probId: String, 
    // username: String,
    // subId: Number,
    // code: String,
    // language: String,
    // verdict: String,
    // cases: [String],
    // time: Number,
    // memory: Number,
    // timestamp: {
    //     type: Date,
    //     default: Date.now()
    // }
    let calculateAverageProblemSolvingTime = function (problems){
        let submissionTimes = [];
        submissionTimes.push(contest.start);
        
        problems.forEach(async (problem)=>{
            for (let i=0; i<problem.submissions.length; i++){
                let subId = problem.submissions[i];
                let submission = await Submission.findOne({subId: subId}).catch((err)=>{
                    console.log(err);
                });

                if (submission.verdict === "Accepted"){
                    submissionTimes.push(submission.timestamp);
                    break;
                }
            }
        });

        let avgTime = 0;
        for (let i=1; i<submissionTimes.length; i++){
            avgTime += (submissionTimes[i] - submissionTimes[i-1]);
        }
        avgTime /= (submissionTimes.length - 1);

        return avgTime;
        
    }

    Standing.findOne({contestId: contest.id}, async (err, standing)=>{
        if (err){
            console.log(err);
        }
        
        let userList = [];
        let n = standing.users.length;
        for (let i=0; i<n; i++){
            let username = standing.users[i];
            let participation = await Participation.findOne({contestId: contest.id, "user.username": username}).catch((err)=>{
                console.log(err);
            });

            let avgTime = calculateAverageProblemSolvingTime(participation.user.problems);

            let newUser = {
                username: participation.user.username,
                score: participation.user.score,
                avgTime: avgTime
            };
            userList.push(newUser);

            // console.log(participation);
        }
        
        let cmp = function (a, b){
            let ans = b.score - a.score;
            if (ans == 0){
                ans = a.avg - b.avg;
            }
            return ans;
        }
        userList.sort(cmp);
        // console.log(userList);

        for (let i=0; i<n; i++){
            standing.users[i] = userList[i].username;
        }
        await standing.save();
    });
}




server.listen(3000, ()=>{
    console.log("Server started on port 3000...");
});