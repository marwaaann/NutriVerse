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
  console.log("Form Data:", data);
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
  console.log(response.message)
  setIsLoading(false)
  
};



  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <H2Heading title="Account Sign Up ⚽"/>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
         <InputField {...register("fullname")} type="text" placeholder="Enter your fullname"  className={`w-full border px-4 py-2 rounded-lg outline-none ${
    errors.fullname ? "border-red-500" : ""
  }`}/>
          <p className="text-red-500 text-sm">{errors.fullname?.message?.toString()}</p>
          <InputField {...register("email")}  type="text" placeholder="Enter your email" className={`w-full border px-4 py-2 rounded-lg outline-none ${
    errors.email ? "border-red-500" : ""
  }`} />
          <p className="text-red-500 text-sm">{errors.email?.message?.toString()}</p>
          <InputField {...register("phone")}  type="text"  placeholder="Enter your phone number"  className={`w-full border px-4 py-2 rounded-lg outline-none ${
    errors.phone ? "border-red-500" : ""
  }`}/>
          <p className="text-red-500 text-sm">{errors.phone?.message?.toString()}</p>
          

          

          {/* Password Field */}
          <div className="relative">
            <InputField {...register("password")}  type={showPassword?"text":"password"}  placeholder="Enter your password"
             className={`w-full border px-4 py-2 rounded-lg outline-none ${
    errors.password ? "border-red-500" : ""
  }`} />
            <span
              className="absolute right-3 top-2.5 cursor-pointer text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>
          <p className="text-red-500 text-sm">{errors.password?.message?.toString()}</p>

          {/* Confirm Password Field */}
          <div className="relative">
            <InputField {...register("confirmPassword")}  type={showConfirmPassword ? "text" : "password"}  placeholder="Enter your confirm password"  className={`w-full border px-4 py-2 rounded-lg outline-none ${
    errors.confirmPassword ? "border-red-500" : ""
  }`}/>
            <span
              className="absolute right-3 top-2.5 cursor-pointer text-gray-500"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>
          <p className="text-red-500 text-sm">{errors.confirmPassword?.message?.toString()}</p>

         <Button isLoading={isLoading} loadingTitle="Creating account..." title="Sign Up" type="submit"/>

        </form>


        <AuthRedirectText linkText="Sign in here" text="Already have an account ? " to="/auth/signin" />
      </div>
    </div>
  );
}
