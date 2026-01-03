const express = require("express")
import { Request, Response } from "express";
import { registerUserSchema, loginUserSchema ,classSchema, studentIdSchema} from "@repo/zod/zod"
import { prismaClient } from "@repo/db/client"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import { middleware, teacherMiddleware } from "./middleware";





dotenv.config()

const app = express();

app.use(express.json())

const PORT = process.env.PORT

app.post("/register", async (req: Request, res: Response) => {
    try {
        const parsedData = registerUserSchema.safeParse(req.body);
        if (!parsedData.success) {
            return res.status(400).json({
                message: "Input validation Failed",
                error: parsedData.error
            })
        }
       const { username, email, password, role } = parsedData.data;


        const hashedPassword = await bcrypt.hash(password, 10)
        const registerData = await prismaClient.user.create({
            data: {
                username: username,
                email: email,
                password: hashedPassword,
                role: role
            }
        })
        return res.status(200).json({
            message: "User created Successfully",
            userId : registerData.id
        })
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            message: "Something happened wrong during signup"
        })
    }
})

app.post("/login", async (req: Request, res: Response) => {
    try {
        const parsedData = loginUserSchema.safeParse(req.body);
        if (!parsedData.success) {
           return res.status(400).json({
                message: "Input validation Failed",
                error: parsedData.error
            })
        }

        const {email,password} = parsedData.data;

        const user = await prismaClient.user.findUnique({
            where: {
                email: email
            }
        })
        if (!user) {
            return res.status(403).json({
                message: "Invalid credentials"
            })
        }

        const comparePassword = await bcrypt.compare(password, user.password)
        if (!comparePassword) {
            return res.status(403).json({
                message: "Invalid credentials"
            })
        }
        const JWT_SECRET = process.env.JWT_SECRET
        if(!JWT_SECRET){
            return res.status(400).json({
                message:"empty JWT_SECRET"
            })
        }

        const token = jwt.sign({
            userId: user.id,
            role:user.role
        }, JWT_SECRET)

        return res.status(200).json({
            message: "User Logged in Successfully",
            token: token
        })
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            message: "Something happened wrong during signin"
        })
    }
})


// student dashboard
app.get("/auth/me", middleware,async (req:Request,res:Response)=>{
    const userDb = await prismaClient.user.findUnique({
        where :{
            id : req.userId
        }
    })

    if(!userDb){
        return res.status(400).json({
            message:"User not found"
        })
    }
   return res.status(200).json({
     userId:userDb.id,
     userName:userDb.username,
     email:userDb.email,
     role:userDb.role
})

})


// for creating class-room
app.post("/class", middleware,teacherMiddleware, async (req:Request,res:Response)=>{

    const parsedData = classSchema.safeParse(req.body);
     if(!parsedData.success){
        return res.status(400).json({
            message:"Class input validation failed"
        })
     }
     const {title , description } = parsedData.data;

    const teacherId= String(req.userId)
     const classDb= await prismaClient.class.create({
        data : {
             Title: title,
             Description:description,
             teacherId: teacherId
        }
      })

    return res.status(200).json({
        message:"Class created successfully",
        id:classDb.id,
        className:classDb.Title,
        teacherId:classDb.teacherId,
        studentIds:[]
    })
    })
    



// for adding student via id in specific class by their id
app.post("/class/:id/add-student",middleware,teacherMiddleware,async (req:Request,res:Response)=>{
       const {id}= req.params
       if(!id){
        return null
 
       }
       
       const parsedData = studentIdSchema.safeParse(req.body)
       if(!parsedData.success){
        return res.status(401).json({
            message:"Input validation failed"
        })
       }

    
       const attendanceDb = await prismaClient.attendance.create({
        data :{
            studentId :parsedData.data.studentId,
            classId : id
        }
      })
      return res.status(200).json({
        message:"Student added successfully in classroom ",
        studentId:attendanceDb.studentId
      })
})


app.get("/class/:id",middleware,teacherMiddleware,async(req:Request,res:Response)=>{
         const {id} = req.params;
         if(!id){
            return null
         }
         const studentData = await prismaClient.class.findUnique({
            where : {
                id:id
            }
         })
         return res.status(200).json({
            "success":"True",
            "classId":studentData?.id,
            "className":studentData?.Title,
            "teacherId":studentData?.teacherId
         })
})
app.listen(PORT, () => {
    console.log(`server listen on ${PORT}`);

})