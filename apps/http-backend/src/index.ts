const express = require("express")
import { Request, Response } from "express";
import { registerUserSchema, loginUserSchema } from "@repo/zod/zod"
import { prismaClient } from "@repo/db/client"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

const app = express();



app.post("/register", async (req: Request, res: Response) => {
    try {
        const parsedData = registerUserSchema.safeParse(req.body);
        if (!parsedData.success) {
            res.status(400).json({
                message: "Input validation Failed",
                error: parsedData.error
            })
        }
        const username = parsedData.data?.username;
        const email = parsedData.data?.email;
        const role = parsedData.data?.role;
        const password = parsedData.data?.password;

        if (!password || !username || !email || !role) {
            return res.status(400).json({ message: "All fields required" });
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const registerData = await prismaClient.user.create({
            data: {
                username: username,
                email: username,
                password: hashedPassword,
                role: role
            }
        })
        return res.status(200).json({
            message: "User created Successfully"
        })
    } catch (error) {
        console.log(error);
        res.status(400).json({
            message: "Something happened wrong during signup"
        })
    }
})


app.post("/login", async (req: Request, res: Response) => {
    try {
        const parsedData = loginUserSchema.safeParse(req.body);
        if (!parsedData.success) {
            res.status(400).json({
                message: "Input validation Failed",
                error: parsedData.error
            })
        }

        const email = parsedData.data?.email;
        const password = parsedData.data?.password;

        if (!password || !email) {
            return res.status(400).json({ message: "All fields required" });
        }
        const user = await prismaClient.user.findUnique({
            where: {
                email: email
            }
        })
        if (!user) {
            return res.status(403).json({
                message: "Email already exist"
            })
        }

        const comparePassword = await bcrypt.compare(password, user.password)
        if (!comparePassword) {
            return res.status(403).json({
                message: "Invalid password"
            })
        }
        const JWT_SECRET = String(process.env.JWT_SECRET)

        const token = jwt.sign({
            userId: user.id
        }, JWT_SECRET)

        return res.status(200).json({
            message: "User Logged in Successfully",
            token: token
        })
    } catch (error) {
        console.log(error);
        res.status(400).json({
            message: "Something happened wrong during signin"
        })
    }
})





app.listen(3005, () => {
    console.log("server listen on 3000");

})