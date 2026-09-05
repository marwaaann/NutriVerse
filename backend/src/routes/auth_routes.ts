import { Router } from "express";
import { authController } from "../container/container";
import { validate } from "../middlewares/validationMiddleware";
import { signupSchema } from "../validators/signupvalidation";
import { signinSchema } from "../validators/signinValidation";
import { authMiddleware } from "../middlewares/authMiddleware";


const router = Router();
router.post("/signup", validate(signupSchema),authController.signup)
router.post("/signin",validate(signinSchema),authController.signin)
router.post("/logout",authController.logout)
router.get("/me",authMiddleware,authController.getMe)
router.get("/users",authMiddleware,authController.getAllUsers)
router.put("/profile",authMiddleware,authController.updateProfile)



export default router;