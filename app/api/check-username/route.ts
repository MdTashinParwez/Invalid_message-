import dbConnect from "@/app/lib/dbConnect";
import UserModel from "@/app/model/user";
import {z} from "zod";
import { usernameValidation } from "@/app/schema/signUpSchema";


const usernameQuerySchem = z.object({
    username: usernameValidation

})

export async function Get(request:Request) {
  
    if(request.method !=='GET'){
        return Response.json({
            success: false,
            message: 'Method not allowed',
        },{status:405})
    } 

    await dbConnect()
    
    try{
        const {searchParams} = new URL(request.url)
        const querryParam = {
            username: searchParams.get('username')
        }
        const result = usernameQuerySchem.safeParse(querryParam)
        if (!result.success) {
            const usernameError= result.error.format().
            username?._errors|| []
            
            return Response.json(
                {
                    success: false,
                    message: "Error checking username"
                },
                { status: 500 }
            )
        }

            const {username} = result.data

            const existingVerifiedUser = await  UserModel.findOne({username, isVerified: true})

            if(existingVerifiedUser){
                return Response.json({
                       success: false,
                       message: " username is already taken"
                },{ status: 500 })
            }

             return Response.json({
                       success: true,
                       message: " username is avilable"
                },{ status: 500 })
    }   
    catch(error){
        console.error("Error checking username",error)
         return Response.json(
            {
                success:false,
                message: "Error checking username"
            },
            {status :500}
         )
    }
}