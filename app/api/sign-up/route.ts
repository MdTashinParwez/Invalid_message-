import dbConnect from "@/app/lib/dbConnect";
import UserModel from "@/app/model/user";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/app/helpers/sendVerificationEmail";

// Backend registration logic + sending OTP


export async function POST(request: Request) {
  await dbConnect(); // connet to the database 

  try {
    const { username, email, password } = await request.json(); //Gets values that user entered on the frontend signup form.
    
    // Checks if username already taken (and verified):
    const existingVerifiedUserByUsername = await UserModel.findOne({
      username, 
      isVerified: true,
    });
       
    //If someone has already used this username and their account is verified, block the signup.

    if (existingVerifiedUserByUsername) {
      return Response.json(
        {
          success: false,
          message: 'Username is already taken',
        },
        { status: 400 }
      );
    }


   //Checks if email is already used:
   //If yes, but not verified, we update their OTP and password.
    const existingUserByEmail = await UserModel.findOne({ email });
    let verifyCode = Math.floor(100000 + Math.random() * 900000).toString();  //If yes, but not verified, we update their OTP and password.

    if (existingUserByEmail) {    //If yes, and user is already verified → ❌ block signup.
      if (existingUserByEmail.isVerified) {
        return Response.json(
          {
            success: false,
            message: 'User already exists with this email',
          },
          { status: 400 }
        );
      } else {
        /* Purpose:
          - User pehle register kar chuka hai** but abhi tak OTP se verify nahi kiya.
          - Woh dobara register kar raha hai** (maybe OTP expire ho gaya ya bhool gaya).
          - To:
            1. Uska password dobara hash karke update kar diya jata hai.
            2. Naya OTP generate karke save kar diya jata hai.
            3. Nayi expiry time set kar di jati hai (1 hour from now).
            4. User ka record update kar diya jata hai (re-save). */
        const hashedPassword = await bcrypt.hash(password, 10);
        existingUserByEmail.password = hashedPassword;
        existingUserByEmail.verifyCode = verifyCode;
        existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000);
        await existingUserByEmail.save();
      }
    } else {  //Dusra case: (first time register kar raha)
      const hashedPassword = await bcrypt.hash(password, 10);
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1);

      const newUser = new UserModel({
        username,
        email,
        password: hashedPassword,
        verifyCode,
        verifyCodeExpiry: expiryDate,
        isVerified: false,
        isAcceptingMessages: true,
        messages: [],
      });

      await newUser.save();
    }

    // Send verification email
    //This is where your formatted email component is rendered and sent using resend.
    const emailResponse = await sendVerificationEmail(
      email,
      username,
      verifyCode
    );
    if (!emailResponse.success) {
      return Response.json(
        {
          success: false,
          message: emailResponse.message,
        },
        { status: 500 }
      );
    }

    return Response.json( // Returns final success:
      {
        success: true,
        message: 'User registered successfully. Please verify your account.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error registering user:', error);
    return Response.json(
      {
        success: false,
        message: 'Error registering user',
      },
      { status: 500 }
    );
  }
}

