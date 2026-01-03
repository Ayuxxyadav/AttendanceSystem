import {Request,Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken"

interface MyToken extends JwtPayload{
  userId:string,
  role:"Student"|"Teacher"
}

export  function middleware (req:Request,res:Response,next:NextFunction){

const token = req.headers.authorization;
if(!token){
    return res.status(401).json({
        message:"Unauthorized"
    })
}

try {
    const JWT_SECRET= String(process.env.JWT_SECRET)
    
    const decodeToken = jwt.verify(token,JWT_SECRET) as JwtPayload

     req.userId = decodeToken.userId
     req.role = decodeToken.role
     next()

} catch (error) {
        return res.status(403).json({
      message: "Invalid token"
    });
}

}
export function teacherMiddleware (req:Request,res:Response,next:NextFunction){
        if(req.role === "Student"){
           res.status(403).json({
            success:"false",
            error:"Forbidden, Teacher access required"
          })
          return
        }
        next()
}