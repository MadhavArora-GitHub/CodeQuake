const Contest = require("../models/contests");
const Problem = require("../models/problems");
const Submission = require("../models/submissions");
const Participation = require("../models/participations");
const Standing = require("../models/standings");
const fs = require("fs/promises");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");
const execPromisify = promisify(exec);



async function showContests(req, res){
    // let contest = new Contest({
    //     id: 1,
    //     name: "First one",
    //     start: Date.now(),
    //     end: Date.now() + 1000*60*60,
    //     problems: [{
    //         probId: "CQ1A",
    //         score: 500
    //     }, {
    //         probId: "CQ1B",
    //         score: 1000
    //     }],
    //     processed: false
    // });
    // await contest.save();

    // contest = new Contest({
    //     id: 2,
    //     name: "Second one",
    //     start: Date.now(),
    //     end: Date.now(),
    //     problems: ["CQ1A", "CQ1B"],problems: [{
    //         probId: "CQ1A",
    //         score: 500
    //     }, {
    //         probId: "CQ1B",
    //         score: 1000
    //     }],processed: true
    // });
    // await contest.save();

    Contest.find({}, (err, contests)=>{
        if (err){
            console.log(err);
        }
        else {
            // list.forEach(val=>{
            //     console.log(val.name);
            // });
            res.render("contests", {contests: contests});
        }
    });
}

async function showContestProblems(req, res){
    const contestId = req.params.contestId;
    
    Contest.findOne({id: contestId}, async (err, contest)=>{
        if (err){
            console.log(err);
        }
    
        let problems = [];
    
        for (let prob of contest.problems){
            let id = prob.probId;
            let problem = await Problem.find({id: id}).catch((err)=>{
                console.log(err);
            });
            problems.push(problem[0]);
        }
    
        res.render("contest", {contest: contest, problems: problems, standings: false});
    
    });
}

async function showContestStandings(req, res){
    const contestId = req.params.contestId;

    // let participation = new Participation({
    //     contestId: contestId,
    //     user: {
    //         username: "m",
    //         problems: [
    //             {
    //                 probId: "CQ1A",
    //                 submissions: [],
    //                 score: 0
    //             },
    //             {
    //                 probId: "CQ1B",
    //                 submissions: [],
    //                 score: 0
    //             }
    //         ],
    //         score: 0
    //     }
    // });
    // await participation.save();

    // participation = new Participation({
    //     contestId: contestId,
    //     user: {
    //         username: "ma",
    //         problems: [
    //             {
    //                 probId: "CQ1A",
    //                 submissions: [],
    //                 score: 0
    //             },
    //             {
    //                 probId: "CQ1B",
    //                 submissions: [],
    //                 score: 0
    //             }
    //         ],
    //         score: 0
    //     }
    // });
    // await participation.save();

    // let standing = new Standing({
    //     contestId: contestId,
    //     users: ["m", "ma"]
    // });
    // await standing.save();


    
    Standing.findOne({contestId: contestId}, async (err, standing)=>{
        if (err){
            console.log(err);
        }

        let contest = await Contest.findOne({id: contestId}).catch((err)=>{
            console.log(err);
        });
    
        let users = [];
        for (let username of standing.users){
            let user = await Participation.find({"user.username": username}).catch((err)=>{
                console.log(err);
            });
            users.push(user[0].user);
        }
        console.log(users);
    
        res.render("contest", {contest: contest, users: users, standings: true});
    
    });
}

async function showContestProblem(req, res){
    const contestId = req.params.contestId;
    const problemId = req.params.problemId;

    Contest.findOne({id: contestId}, (err, contest)=>{
        if (err){
            console.log(err);
        }

        if (contest.problems.some(problem => problem.probId === problemId)){
            Problem.findOne({id: problemId}, (err, problem)=>{
                if (err){
                    console.log(err);
                }

                res.render("problem", {problem: problem, contest: contest});
            });
        }
    });
}

async function submitContestProblem(req, res){
    const contestId = req.params.contestId;
    const problemId = req.params.problemId;
    const volumePath = path.join(".", "judge", "volumes");

    Contest.findOne({id: contestId}, (err, contest)=>{
        if (err){
            console.log(err);
        }

        if (contest.start<=Date.now() && contest.end>Date.now() && contest.problems.some(problem => problem.probId === problemId)){
            Problem.findOne({id: problemId}, (err, problem)=>{
                if (err){
                    console.log(err);
                }
                else {
                    Submission.countDocuments({}, async (err, count)=>{
                        if (err){
                            console.log(err);
                        }
                        let subId = count + 1;
                        let testcases = problem.testcases;
                        let n = testcases.length;
        
                        let submission = new Submission({
                            status: false,
                            probId: problem.id, 
                            username: res.locals.user.username,
                            subId: subId,
                            code: req.body.code,
                            language: req.body.lang,
                            verdict: "",
                            cases: [],
                            time: problem.timeLimit,
                            memory: problem.memoryLimit,
                            timestamp: Date.now()
                        });
                        await submission.save();
        
                        res.redirect(`/submission?subId=${subId}`);
        
                        await fs.writeFile(path.join(volumePath, `main.${req.body.lang}`), req.body.code);
        
                        for (let i=1; i<=n; i++){
                            await fs.writeFile(path.join(volumePath, "testcases", `in${i}.in`), testcases[i-1].in);
                            await fs.writeFile(path.join(volumePath, "testcases", `eout${i}.out`), testcases[i-1].out);
                            await fs.writeFile(path.join(volumePath, "testcases", `out${i}.out`), "");
                        }
        
                        try{
                            const { stdout, stderr } = await execPromisify(process.env.RUN_CONTAINER_CPP + ` ${n} ${problem.timeLimit} ${problem.memoryLimit}`);
        
                            let output = await fs.readFile(path.join(volumePath, "verdict.txt"));
                            output = output.toString();
                            if (output === "ac"){
                                submission.verdict = "Accepted";
                                output = n;
                            }
                            else if (output === "ce"){
                                submission.verdict = "Compilation error";
                                output = 0;
                            }
                            else if (output === "re"){
                                submission.verdict = "Runtime error";
                                output = 0;
                            }
                            else {
                                submission.verdict = "Wrong answer on testcase " + output;
                            }
        
                            for (let i=1; i<=output; i++){
                                let out = await fs.readFile(path.join(volumePath, "testcases", `out${i}.out`));
                                submission.cases.push(out)
                            }
        
                            submission.status = true;
                            let willScore = submission.verdict;
                            await submission.save();
                            
                            let participation = await Participation.findOne({contestId: contestId, "user.username": res.locals.user.username});
                            if (participation !== undefined){
                                let index = participation.user.problems.findIndex(problem => problem.probId === problemId);
                                
                                participation.user.problems[index].submissions.push(subId);

                                if (willScore==="Accepted" && participation.user.problems[index].score===0){
                                    participation.user.problems[index].score += contest.problems.find(problem => problem.probId === problemId).score;
                                    participation.user.score += participation.user.problems[index].score;
                                }
                            }
                            await participation.save();
                        } catch(err){
                            console.log(err);
                        }
                    }); 
                    
                }
            });
        }
    });

    // Problem.findOne({id: problemId}, (err, problem)=>{
    //     if (err){
    //         console.log(err);
    //     }
    //     else {
    //         Submission.countDocuments({}, async (err, count)=>{
    //             if (err){
    //                 console.log(err);
    //             }
    //             let subId = count + 1;
    //             let testcases = problem.testcases;
    //             let n = testcases.length;

    //             let submission = new Submission({
    //                 status: false,
    //                 probId: problem.id, 
    //                 username: res.locals.user.username,
    //                 subId: subId,
    //                 code: req.body.code,
    //                 language: req.body.lang,
    //                 verdict: "",
    //                 cases: [],
    //                 time: problem.timeLimit,
    //                 memory: problem.memoryLimit,
    //                 timestamp: Date.now()
    //             });
    //             await submission.save();

    //             res.redirect(`/submission?subId=${subId}`);

    //             await fs.writeFile(path.join(volumePath, `main.${req.body.lang}`), req.body.code);

    //             for (let i=1; i<=n; i++){
    //                 await fs.writeFile(path.join(volumePath, "testcases", `in${i}.in`), testcases[i-1].in);
    //                 await fs.writeFile(path.join(volumePath, "testcases", `eout${i}.out`), testcases[i-1].out);
    //                 await fs.writeFile(path.join(volumePath, "testcases", `out${i}.out`), "");
    //             }

    //             try{
    //                 const { stdout, stderr } = await execPromisify(process.env.RUN_CONTAINER_CPP + ` ${n} ${problem.timeLimit} ${problem.memoryLimit}`);

    //                 let output = await fs.readFile(path.join(volumePath, "verdict.txt"));
    //                 output = output.toString();
    //                 if (output === "ac"){
    //                     submission.verdict = "Accepted";
    //                     output = n;
    //                 }
    //                 else if (output === "ce"){
    //                     submission.verdict = "Compilation error";
    //                     output = 0;
    //                 }
    //                 else if (output === "re"){
    //                     submission.verdict = "Runtime error";
    //                     output = 0;
    //                 }
    //                 else {
    //                     submission.verdict = "Wrong answer on testcase " + output;
    //                 }

    //                 for (let i=1; i<=output; i++){
    //                     let out = await fs.readFile(path.join(volumePath, "testcases", `out${i}.out`));
    //                     submission.cases.push(out)
    //                 }

    //                 submission.status = true;
    //                 await submission.save();
    //             }catch(err){
    //                 console.log(err);
    //             }
    //         }); 
            
    //     }
    // });

}

module.exports = {
    showContests,
    showContestProblems,
    showContestStandings,
    showContestProblem,
    submitContestProblem
};