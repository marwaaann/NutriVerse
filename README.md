# Recipie Realm
Recipe platform.
User can view, create recipies and also can do  chats with users.

## Features
- User authentication
- 
- 


## Tech Stack
Frontend
- React
- TypeScript
- Tailwind

Backend
- Node.js
- Typescript
- Express
- MongoDB

others(Packages)
Frontend:
    - axios
    - react-hook-form zod @hookform/resolvers
    - react-router-dom
    - lucide-react
    - react-hot-toast
    - @tanstack/react-query
    - react-redux
    - @reduxjs/toolkit
Backend:
    - cookie-parser
    - winston & winston-daily-rotate-file
    - mongoose
    - cors
    - zod
    - bcrypt
    - ioredis
    - jsonwebtoken


#Project summary
Sign up :
     for signup get signup details from user
        -email
        -phone
        -password
        -confirm password
        -fullname

        Frontend validation:
            zod,@hookform/resolvers,react-hook-form
            created schema for signup validation
            Done validation
        Service:
            using axios instance created a singup service 
        
    payload reaches the backend validate using zod,hitted on the authController, then authService:
    
    in AuthService check already a user by using userRepository before creating user, after if not already a user hash the password,  
    then call userrepository to create user with the neccesary user data and return new user to authservice.

    authService return the neccesary data , dont sent sensitive data(password etc..) to authController.

    auth controller return trough apiResponse reusable function to frontend.

    frontend show the data in ui(Success sign up or Already user).

Sign in :    
    for signin get signin details from user
        -email
        -password

        Frontend validation:
            zod,@hookform/resolvers,react-hook-form
            created schema for signup validation
            Done validation
        Service:
            using axios instance created a signin service 

    payload reaches the backend validate using zod,hitted on the authController, then authService:

    in AuthService check a user by using userRepository is user and also compare password, after if not throw app error, 

    and in the then create access token and refresh token usign DI tokenservice, and return accesstoken refreshtoken using jwt,user(email,fullname,phone,isVerified,isBlocked,createdAt,userId) and store accesstoken and refreshtoken in the cookies. return api response with user.



    