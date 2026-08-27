import {createSlice} from "@reduxjs/toolkit"
import type { ThemeType } from "../types/ThemeType"

const storedMode = localStorage.getItem("theme_mode");

const savedMode:ThemeType=storedMode==="dark" || storedMode==="light" ? storedMode :"light";

export const toggleModeSlice=createSlice({
    name:"toggle",
    initialState:{
        mode:savedMode
    },
    reducers:{
        toggleMode:(state)=>{
            state.mode=state.mode==="light"?"dark":"light"
            localStorage.setItem("theme_mode",state.mode)
        }
    }
})

export const {toggleMode}=toggleModeSlice.actions
export default toggleModeSlice.reducer