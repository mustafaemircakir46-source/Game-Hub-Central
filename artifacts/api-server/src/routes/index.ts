import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import gamesRouter from "./games.js";
import postsRouter from "./posts.js";
import usersRouter from "./users.js";
import adminRouter from "./admin.js";
import aiRouter from "./ai.js";
import miscRouter from "./misc.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/games", gamesRouter);
router.use("/posts", postsRouter);
router.use("/users", usersRouter);
router.use("/admin", adminRouter);
router.use("/ai", aiRouter);
router.use(miscRouter);

export default router;
