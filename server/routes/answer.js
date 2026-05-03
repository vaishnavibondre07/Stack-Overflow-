import express from "express";
import { Askanswer, deleteanswer, voteAnswer } from "../controller/answer.js";

import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/postanswer/:id",auth, Askanswer);
router.delete("/delete/:id",auth,deleteanswer);
router.patch("/vote/:id/:answerId", auth, voteAnswer);

export default router;
