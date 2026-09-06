import axios from "axios";

const axiosInstance=axios.create({
    baseURL:import.meta.env.VITE_BACKEND_URL,
    timeout:30000,
    withCredentials: true,
    headers:{
        "Content-Type":"application/json"
    },
})


axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

const inValidMessages:string[]=[
    "INVALID_TOKEN",
    "UNAUTHORIZED",
    "INVALID_USER",
    "USER_NOT_FOUND",

]

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized session
    }
    if(inValidMessages.includes(error?.response?.data?.message)){
        // window.location.href = "/auth/signin"
        return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);


export default axiosInstance;