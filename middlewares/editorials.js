const Contest = require("../models/contests");
const Problem = require("../models/problems");


async function showContestEditorials(req, res){
    Contest.find({}, (err, list)=>{
        if (err){
            console.log(err);
        }
        else {
            res.render("editorials_c", {contests: list});
        }
    });
}

async function showProblemEditorials(req, res){
    const contestId = req.params.contestId;

    Contest.countDocuments({id: contestId}, (err, count)=>{
        if (count > 0){
            Contest.findOne({id: contestId}, async (err, contest)=>{
                if (err){
                    console.log(err);
                }
                else {
                    let problems = [];

                    for (let id of contest.problems){
                        let problem = await Problem.find({id: id}).catch((err)=>{
                            console.log(err);
                        });
                        problems.push(problem[0]);
                    }

                    res.render("editorials_p", {contest: contest, problems: problems});
                }
            });
        }
        else {
            res.send("!perfetto");
        }
    });
}

async function showProblemTutorial(req, res){
    const problemId = req.params.problemId;

    Problem.countDocuments({id: problemId}, (err, count)=>{
        if (count > 0){
            Problem.findOne({id: problemId}, (err, problem)=>{
                if (err){
                    console.log(err);
                }
                else {
                    res.send(problem.tutorial);
                }
            });
        }
        else {
            res.send("!perfetto");
        }
    });
}

async function showProblemSolution(req, res){
    const problemId = req.params.problemId;

    Problem.countDocuments({id: problemId}, (err, count)=>{
        if (count > 0){
            Problem.findOne({id: problemId}, (err, problem)=>{
                if (err){
                    console.log(err);
                }
                else {
                    res.send(problem.solution);
                }
            });
        }
        else {
            res.send("!perfetto");
        }
    });
}

module.exports = {
    showContestEditorials,
    showProblemEditorials,
    showProblemTutorial,
    showProblemSolution
};