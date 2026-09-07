import { useEffect } from 'react'
import './App.css'
import { Routes, Route, Navigate, } from "react-router-dom";
import SignupPage from './pages/Signup';
import StreamPage from './pages/StreamPage';
import { Toaster } from 'react-hot-toast';
import SigninPage from './pages/Signin';
import { useAppSelector } from './types/ThemeHookType';
import Layout from './layout/UserLayout';
import { ProtectedRoute } from './componets/ProtectedRoutes/ProtectedRoutes';

import { RecipesList } from './pages/RecipesList';
import { CreateRecipe } from './pages/CreateRecipe';
import { RecipeDetail } from './pages/RecipeDetail';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { Profile } from './pages/Profile';
import { ChatOverview } from './pages/ChatOverview';
import { Onboarding } from './pages/Onboarding';
import { Grocery } from './pages/Grocery';
import { EditRecipe } from './pages/EditRecipe';

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
      <Route path="/" element={<Navigate to="/dashboard"/>}/>
      <Route path='/home' element={<Navigate to="/dashboard"/>}/>
      <Route path='/onboarding' element={<ProtectedRoute><Onboarding /></ProtectedRoute>}/>
      <Route path='/dashboard' element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>}/>
      <Route path='/grocery' element={<ProtectedRoute><Layout><Grocery /></Layout></ProtectedRoute>}/>
      <Route path='/users' element={<ProtectedRoute><Layout><Users /></Layout></ProtectedRoute>}/>
      <Route path='/profile' element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>}/>
      <Route path='/settings' element={<Navigate to="/profile" replace />}/>
      <Route path='/chat' element={<ProtectedRoute><Layout><ChatOverview /></Layout></ProtectedRoute>}/>
      <Route path='/recipes' element={<ProtectedRoute><Layout><RecipesList /></Layout></ProtectedRoute>}/>
      <Route path='/recipes/create' element={<ProtectedRoute><Layout><CreateRecipe /></Layout></ProtectedRoute>}/>
      <Route path='/recipes/edit/:id' element={<ProtectedRoute><Layout><EditRecipe /></Layout></ProtectedRoute>}/>
      <Route path='/recipes/:id' element={<ProtectedRoute><Layout><RecipeDetail /></Layout></ProtectedRoute>}/>
      <Route path='/match/stream' element={<StreamPage children={"hery"}/>}/>
    </Routes>
    </>
  )
}

export default App
