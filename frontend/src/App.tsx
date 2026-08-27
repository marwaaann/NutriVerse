import { useEffect, useState } from 'react'
import './App.css'
import { Routes, Route, Navigate, } from "react-router-dom";
import SignupPage from './pages/Signup';
import StreamPage from './pages/StreamPage';
import { Toaster } from 'react-hot-toast';
import SigninPage from './pages/Signin';
import { useAppSelector } from './types/ThemeHookType';
import { useAuth } from './hooks/useAuth';
import Layout from './layout/UserLayout';
import { ProtectedRoute } from './componets/ProtectedRoutes/ProtectedRoutes';

function App() {

  const mode = useAppSelector((state)=>state.theme.mode)
  
  // const {data:user,isLoading,isError}=useAuth()
  // console.log("isLoading : ",isLoading)


  
  useEffect(() => {
  document.documentElement.classList.toggle("dark", mode === "dark");
  }, [mode]);

  //  if (isLoading) return ;

  // if (isError) {
  //   return <Navigate to="/auth/signin" />;
  // }

  //  console.log("user : ",user)
   

  return(
    <>
    <Toaster position="top-right"toastOptions={{duration: 3000,style: {background: "#333",color: "#fff",},}}/>
    <Routes>
      <Route path="/auth">
        <Route path="signup" element={<SignupPage />} />
        <Route path="signin" element={<SigninPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/home"/>}/>
      <Route path='/home'element={<ProtectedRoute><Layout><h1>hey</h1></Layout></ProtectedRoute>}/>
      <Route path='/match/stream' element={<StreamPage children={"hery"}/>}/>
    </Routes>
    </>
  )
}

export default App
