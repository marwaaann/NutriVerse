import React, { useState } from 'react'
import InputField from '../componets/Inputs/InputField'
import Button from '../componets/Buttons/Button'
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signinSchema } from '../validation/userSigninSchema';
import type z from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import AuthRedirectText from '../componets/Texts/AuthRedirectText';
import { signin } from '../services/signinUser';
import { showToast } from '../utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import H2Heading from '../componets/Headings/H2Heading';
import { useNavigate } from 'react-router-dom';


type SigninFormType = z.infer<typeof signinSchema>;

export function SigninPage() {

    const {register,setError,handleSubmit,formState:{errors}} =useForm<SigninFormType>({resolver:zodResolver(signinSchema)})
    
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [isLoading,setIsLoading]=useState<boolean>(false)
    const queryClient=useQueryClient()
    const navigate = useNavigate();

    const onSubmit=async (data:SigninFormType)=>{
        console.log("form data : ",data)
        setIsLoading(true)
        const response=await signin(data)
        console.log("reponse for sign in service : ",response)
        if(response.success){
            showToast.success(response.message)
            await queryClient.invalidateQueries({ queryKey: ["me"] });
            navigate("/dashboard");
        }else if(!response.success){
            if(response.message.includes("password")){
                setError("password",{
                    type:"server",
                    message:response.message
                })
            }
            if(response.message.includes("Dont have an account")){
                setError("email",{
                    type:"server",
                    message:response.message,
                })
            }
        }
        setIsLoading(false)

    }

  return (
     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-indigo-50/50 px-4">
          <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md border border-amber-100/50">
             
             {/* Logo & Headline */}
             <div className="text-center mb-8">
               <div className="inline-flex items-center gap-2 mb-2">
                 <span className="text-3xl">🍊</span>
                 <span className="text-2xl font-black tracking-tight text-zinc-950">NutriVerse</span>
               </div>
               <h2 className="text-xl font-extrabold text-zinc-800">Welcome Back</h2>
               <p className="text-xs text-zinc-450 mt-1">Sign in to plan and track your family nutrition</p>
             </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                 
                 {/* Email Input */}
                 <div>
                   <label className="block text-xs font-bold text-zinc-650 mb-1.5 uppercase tracking-wider">Email Address</label>
                   <InputField  
                     {...register("email")} 
                     type='text' 
                     placeholder='Enter your registered email' 
                     className={`w-full border px-4 py-2.5 rounded-xl outline-none transition focus:border-amber-500 ${
                       errors.email ? "border-red-500" : "border-zinc-200"
                     }`} 
                   />
                   {errors.email && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.email?.message?.toString()}</p>}
                 </div>

                 {/* Password Input */}
                 <div>
                   <label className="block text-xs font-bold text-zinc-650 mb-1.5 uppercase tracking-wider">Password</label>
                   <div className="relative">
                       <InputField 
                         {...register("password")}  
                         type={showPassword?"text":"password"}  
                         placeholder="Enter your password"
                         className={`w-full border px-4 py-2.5 rounded-xl outline-none transition focus:border-amber-500 ${
                           errors.password ? "border-red-500" : "border-zinc-200"
                         }`} 
                       />
                       <span className="absolute right-3.5 top-3 cursor-pointer text-gray-450 hover:text-amber-500 transition" onClick={() => setShowPassword(!showPassword)}>
                           {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                       </span>
                   </div>
                   {errors.password && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.password?.message?.toString()}</p>}
                 </div>

                 <div className="pt-2">
                   <Button isLoading={isLoading} title="Sign In" type="submit"/>
                 </div>

              </form>

              <div className="mt-6 pt-6 border-t border-zinc-100 text-center">
                 <AuthRedirectText linkText="Sign up here" text="Don't have an account ? " to="/auth/signup" />
              </div>
          </div>
     </div>
  )
}

export default SigninPage