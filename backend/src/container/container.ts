import { AuthService } from "../services/auth_service";
import { AuthController } from "../controllers/auth_controller";
import UserRepository from "../repository/user_repository";
import { RedisHelper } from "../helpers/redisHelper";

const redisHelper=new RedisHelper()
const userRepository=new UserRepository();
const authService=new AuthService(userRepository,redisHelper)
const authController=new AuthController(authService)

export {authController }