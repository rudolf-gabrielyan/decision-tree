import { Router } from "express";
import {
    execute,
    validate,
    getExamples,
} from "./controllers/DecisionTreeController";
import { validateBody } from "../../middlewares/validateRequest";
import { executeDecisionTreeSchema, validateDecisionTreeSchema } from "./schemas";

const router = Router();

router.post(
    "/execute",
    validateBody(executeDecisionTreeSchema),
    execute
);

router.post(
    "/validate",
    validateBody(validateDecisionTreeSchema),
    validate
);

router.get(
    "/examples",
    getExamples
);

export default router;

