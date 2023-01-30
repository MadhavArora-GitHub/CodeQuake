const express = require("express");
const router = express.Router();
const contests = require("../middlewares/contests");
const problems = require("../middlewares/problems");
const editorials = require("../middlewares/editorials");
const authenticate = require("../middlewares/authenticate");

router.get("/", (req, res)=>{
    res.render("home");
});

router.get("/contests", authenticate, contests.showContests);

router.get("/contest/:contestId/problems", authenticate, contests.showContestProblems);

router.get("/contest/:contestId/standings", authenticate, contests.showContestStandings);

router.get("/contest/:contestId/:problemId", authenticate, contests.showContestProblem);

router.post("/contest/:contestId/submit/:problemId", authenticate, contests.submitContestProblem)

router.get("/practice", authenticate, problems.showProblems);

router.get("/practice/:problemId", authenticate, problems.showProblem);

router.post("/submit/:problemId", authenticate, problems.submitProblem);

router.get("/blogs", authenticate, problems.showBlogs);

router.get("/editorials", authenticate, editorials.showContestEditorials);

router.get("/editorials/:contestId", authenticate, editorials.showProblemEditorials);

router.get("/editorials/tutorial/:problemId", authenticate, editorials.showProblemTutorial);

router.get("/editorials/solution/:problemId", authenticate, editorials.showProblemSolution);


module.exports = router;