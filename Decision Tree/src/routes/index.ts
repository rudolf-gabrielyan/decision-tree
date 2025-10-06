import { Router } from "express";
import { decisionTreeRoutes } from "../modules/decisionTree";

const router = Router();

router.use("/decision-tree/v1", decisionTreeRoutes);

export default router;

