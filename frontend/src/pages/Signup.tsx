import  { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import InputField from "../componets/Inputs/InputField";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema } from "../validation/userSignupSchema";
import { z } from "zod";
import Button from "../componets/Buttons/Button";
import { signup } from "../services/signupUser";
import { showToast } from "../utils/toast";
import { useNavigate } from "react-router-dom";
import AuthRedirectText from "../componets/Texts/AuthRedirectText";
import H2Heading from "../componets/Headings/H2Heading";


type SignupFormType = z.infer<typeof signupSchema>;


export default function SignupPage() {

const {register,setError,handleSubmit,formState:{errors}} =useForm<SignupFormType>({resolver:zodResolver(signupSchema)})

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isLoading,setIsLoading]=useState<boolean>(false)
  const navigate=useNavigate()

const onSubmit = async(data: SignupFormType) => {
  setIsLoading(true)
  const response=await signup(data);
  if(response.success){
    showToast.success(response.message);
    navigate("/auth/signin")
  }else if(!response.success){
    if(response.message==="User already exists"){
        setError("email", {
            type: "server",
            message: "Email already registered",
        });
    }
    if(response.message.toLowerCase().includes("phone")){
        setError("phone", {
            type: "server",
            message: "Enter valid phone number",
        });
    }
    if(response.message.toLowerCase().includes("password")){
        setError("password", {
            type: "server",
            message: "Enter valid password",
      });
    }
  }
  setIsLoading(false)
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-zinc-950 px-4 transition-colors">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-lg w-full max-w-md border border-zinc-200 dark:border-zinc-800 transition-colors">
        <H2Heading title="Account Sign Up ⚽"/>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
         <div>
           <InputField 
             {...register("fullname")} 
             type="text" 
             placeholder="Enter your fullname"  
             className={`w-full bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 border border-zinc-200 dark:border-zinc-700 px-4 py-2 rounded-lg outline-none transition focus:border-amber-500 ${
               errors.fullname ? "border-red-500" : ""
             }`}
           />
           {errors.fullname && <p className="text-red-500 text-xs mt-1">{errors.fullname?.message?.toString()}</p>}
         </div>

         <div>
           <InputField 
             {...register("email")}  
             type="text" 
             placeholder="Enter your email" 
             className={`w-full bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 border border-zinc-200 dark:border-zinc-700 px-4 py-2 rounded-lg outline-none transition focus:border-amber-500 ${
               errors.email ? "border-red-500" : ""
             }`} 
           />
           {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email?.message?.toString()}</p>}
         </div>

         <div>
           <InputField 
             {...register("phone")}  
             type="text"  
             placeholder="Enter your phone number"  
             className={`w-full bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 border border-zinc-200 dark:border-zinc-700 px-4 py-2 rounded-lg outline-none transition focus:border-amber-500 ${
               errors.phone ? "border-red-500" : ""
             }`}
           />
           {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone?.message?.toString()}</p>}
         </div>

          {/* Password Field */}
          <div>
            <div className="relative">
              <InputField 
                {...register("password")}  
                type={showPassword?"text":"password"}  
                placeholder="Enter your password"
                className={`w-full bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 border border-zinc-200 dark:border-zinc-700 px-4 py-2 rounded-lg outline-none transition focus:border-amber-500 ${
                  errors.password ? "border-red-500" : ""
                }`} 
              />
              <span
                className="absolute right-3 top-2.5 cursor-pointer text-zinc-400 hover:text-amber-500 dark:hover:text-amber-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password?.message?.toString()}</p>}
          </div>

          {/* Confirm Password Field */}
          <div>
            <div className="relative">
              <InputField 
                {...register("confirmPassword")}  
                type={showConfirmPassword ? "text" : "password"}  
                placeholder="Enter your confirm password"  
                className={`w-full bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 border border-zinc-200 dark:border-zinc-700 px-4 py-2 rounded-lg outline-none transition focus:border-amber-500 ${
                  errors.confirmPassword ? "border-red-500" : ""
                }`}
              />
              <span
                className="absolute right-3 top-2.5 cursor-pointer text-zinc-400 hover:text-amber-500 dark:hover:text-amber-400"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword?.message?.toString()}</p>}
          </div>

         <Button isLoading={isLoading} loadingTitle="Creating account..." title="Sign Up" type="submit"/>

        </form>

        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <AuthRedirectText linkText="Sign in here" text="Already have an account ? " to="/auth/signin" />
        </div>
      </div>
    </div>
  );
}
