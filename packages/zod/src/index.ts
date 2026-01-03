import {z} from "zod"


export const registerUserSchema = z.object({
    username : z.string("username must be unique"),
    email: z.email("Invalid email"),
    password:z.string().min(5,"password must be greater than 5"),
    role:z.enum(["Student","Teacher"],"Please select the role")
})

export const loginUserSchema = z.object({
    email:z.email("Invalid email"),
    password:z.string("Invalid Password")
})

export const classSchema = z.object({
    title:z.string("all fields required"),
    description:z.string("all fields required")
})

export const studentIdSchema = z.object({
    studentId:z.string()
})