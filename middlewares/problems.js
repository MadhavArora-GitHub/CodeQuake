const Problem = require("../models/problems");
const Submission = require("../models/submissions");
const fs = require("fs/promises");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");
const execPromisify = promisify(exec);


async function showProblems(req, res){
    // let problem = new Problem({
    //     id: "CQ1A",
    //     name: "First one",
    //     isVisible: true,
    //     problemStatement: "Finally first problem of codeQuake",
    //     constraints: "1 <= |s| <= 100000",
    //     input: "there will be only one string",
    //     output: "output the desired string on a single line",
    //     sampleTestcases: 3,
    //     sampleInput: ["MadhavArora", "Madhav", "Arora"],
    //     sampleOutput: ["madhavarora", "madhav", "arora"],
    //     timeLimit: 5,
    //     memoryLimit: 5000,
    //     difficulty: "Beginner",
    //     tags: ["Strings"],
    //     solution: "#include <bits/stdc++.h>\n" +
    //               "using namespace std;\n" +
    //               "int main(){\n" +
    //                   "string s;\n" +
    //                   "cin>>s;\n" +
    //                   "for (int i=0; i<s.length(); i++){\n" +
    //                       "if (s[i]>='A' && s[i]<='Z'){\n" +
    //                         "cout<<char(s[i]-'A'+'a');\n" +
    //                       "}\n" +
    //                       "else {\n" +
    //                         "cout<<s[i];\n" +
    //                       "}\n" +
    //                   "}\n" +
    //                   "return 0;\n" +
    //               "}\n",
    //     tutorial: "You don't need that",
    //     problemSetter: ["Madhav"],
    //     testcases: [
    //         {in: "MADHAVarorA", out: "madhavarora"},
    //         {in: "codeQuake", out: "codequake"},
    //         {in: "MiniProject", out: "miniproject"}
    //     ]
    // });
    // await problem.save();

    // problem = new Problem({
    //     id: "CQ1B",
    //     name: "Second one",
    //     isVisible: true,
    //     problemStatement: "Finally second problem of codeQuake",
    //     constraints: "continous string without spaces",
    //     input: "there will be only one string",
    //     output: "output the desired string on a single line",
    //     sampleTestcases: 3,
    //     sampleInput: ["MadhavArora", "Madhav", "Arora"],
    //     sampleOutput: ["madhavarora", "madhav", "arora"],
    //     timeLimit: 5,
    //     memoryLimit: 5000,
    //     difficulty: "Beginner",
    //     tags: ["Strings"],
    //     solution: "#include <bits/stdc++.h>\n" +
    //               "using namespace std;\n" +
    //               "int main(){\n" +
    //                   "string s;\n" +
    //                   "cin>>s;\n" +
    //                   "for (int i=0; i<s.length(); i++){\n" +
    //                       "if (s[i]>='A' && s[i]<='Z'){\n" +
    //                         "cout<<char(s[i]-'A'+'a');\n" +
    //                       "}\n" +
    //                       "else {\n" +
    //                         "cout<<s[i];\n" +
    //                       "}\n" +
    //                   "}\n" +
    //                   "return 0;\n" +
    //               "}\n",
    //     tutorial: "You don't need that",
    //     problemSetter: ["Madhav"],
    //     testcases: [
    //         {in: "MADHAVarorA", out: "madhavarora"},
    //         {in: "codeQuake", out: "codequake"},
    //         {in: "MiniProject", out: "miniproject"}
    //     ]
    // });
    // await problem.save();

    Problem.find({isVisible: true}, (err, list)=>{
        if (err){
            console.log(err);
        }
        else {
            // list.forEach(val=>{
            //     console.log(val.id);
            // });
            res.render("practice", {problems: list});
        }
    });
}

async function showProblem(req, res){
    const problemId = req.params.problemId;

    Problem.countDocuments({id: problemId, isVisible: true}, (err, count)=>{
        if (count > 0){
            Problem.findOne({id: problemId, isVisible: true}, (err, problem)=>{
                if (err){
                    console.log(err);
                }
                else {
                    res.render("problem", {problem: problem, contest: undefined});
                }
            });
        }
        else {
            res.send("!perfetto");
        }
    });
}

async function submitProblem(req, res){
    const problemId = req.params.problemId;
    const volumePath = path.join(".", "judge", "volumes");

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
                    await submission.save();
                }catch(err){
                    console.log(err);
                }
            }); 
            
        }
    });
}

async function showBlogs(req, res){

    res.render("blogs");
}

module.exports = {
    showProblems,
    showProblem,
    submitProblem,
    showBlogs
};