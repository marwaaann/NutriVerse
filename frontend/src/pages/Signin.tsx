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


type SigninFormType = z.infer<typeof signinSchema>;

export function SigninPage() {

    const {register,setError,handleSubmit,formState:{errors}} =useForm<SigninFormType>({resolver:zodResolver(signinSchema)})
    
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [isLoading,setIsLoading]=useState<boolean>(false)
    const queryClient=useQueryClient()

    const onSubmit=async (data:SigninFormType)=>{
        console.log("form data : ",data)
        setIsLoading(true)
        const response=await signin(data)
        console.log("reponse for sign in service : ",response)
        if(response.success){
            showToast.success(response.message)
            await queryClient.invalidateQueries({ queryKey: ["me"] });
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
     <div className="min-h-screen flex items-center justify-center bg-gray-100">
         <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
            <H2Heading title='Account Sign In ⚽'/>
             <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <p className="text-red-500 text-sm">{errors.email?.message?.toString()}</p>
                <InputField  {...register("email")} type='text' placeholder='Enter your registered email' className={`w-full border px-4 py-2 rounded-lg outline-none ${
                    errors.email ? "border-red-500" : ""
                }`} />

                <p className="text-red-500 text-sm">{errors.password?.message?.toString()}</p>

            <div className="relative">
                
                <InputField {...register("password")}  type={showPassword?"text":"password"}  placeholder="Enter your password"className={`w-full border px-4 py-2 rounded-lg outline-none ${
                    errors.password ? "border-red-500" : ""
                }`} />

                <span className="absolute right-3 top-2.5 cursor-pointer text-gray-500" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>

            </div>
             <Button isLoading={isLoading} title="Sign Up" type="submit"/>

             </form>
              <AuthRedirectText linkText="Sign up here" text="Don't have an account ? " to="/auth/signup" />
         </div>
     </div>
  )
}

export default SigninPage