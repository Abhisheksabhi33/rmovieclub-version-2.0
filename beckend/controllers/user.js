const User = require('../models/user');
const jwt = require('jsonwebtoken');
const emailverificationtoken = require('../models/emailVerificationToken');
const passwordResetToken = require('../models/passwordResetToken');
const { isValidObjectId } = require('mongoose');
const { generateOTP, generateMailTransporter } = require('../utils/mail');
const { sendError, generateRandomByte } = require('../utils/helper');



exports.create = async (req, res)=>{
     const {name, email, password} = req.body;

     const oldUser = await User.findOne({email});
      
     if(oldUser) return sendError(res, 'This email id is already existed!' );

     const newUser = new User({name, email, password});
    await newUser.save();

    // generates 6 digit otp
    let OTP = generateOTP();
    // store otp to our db
    
    const newEmailVerificationToken = new emailverificationtoken({owner : newUser._id, token: OTP});
    await newEmailVerificationToken.save();

    //  and send that otp to our user

    var transport = generateMailTransporter();

      transport.sendMail ({
          from: 'verification@reviewApp.com',
          to: newUser.email,
          subject: "email verification",
          html : `
             <p> Your verification OTP </p>
             <h1> ${OTP} </h1>
          `
      })


    res.status(201).json({
          user:{
              id: newUser._id,
              name: newUser.name,
              email: newUser.email,
          }
    });
};

exports.verifyEmail = async (req, res)=>{
      const {userId, OTP} = req.body;

      if(!isValidObjectId(userId)){
          return res.status(400).json({error: 'Invalid user'});
      }
   
     const user =  await User.findById(userId)
      if(!user) return sendError(res, 'user not found' , 404);

      if(user.isVerified) return sendError(res, 'user is already verified');

     const token = await emailverificationtoken.findOne({owner: userId});  
      if(!token) return sendError(res, 'token not found');

      const isMatch = await token.compareToken(OTP);
      if(!isMatch) return sendError(res, 'invalid OTP');

      user.isVerified = true;
      await user.save();

     await emailverificationtoken.findByIdAndDelete(token._id);

     var transport = generateMailTransporter();

    transport.sendMail ({
        from: 'verification@reviewApp.com',
        to:  user.email,
        subject: "Welcome email",
        html : `
           <h1> Welcome to our app and thanks for choosing us. </h1>
        `
    });

    const jwtToken =  jwt.sign({userId: user._id}, process.env.JWT_SECRET); 

      
      res.status(200).json({ 
        user: {id: user._id,
         name: user.name, 
         email:user.email, 
         token: jwtToken, 
         isVerified: user.isVerified,
          role: user.role
        },
         message: 'email is verified successfully'});



}

exports.resendEmailVerificationToken = async (req, res)=>{
        
    const {userId} = req.body;

    // if(!isValidObjectId(userId)){
    //     return res.status(400).json({error: 'Invalid user'});
    // }
 
   const user =  await User.findById(userId)
    if(!user) return sendError(res, 'user not found');

    if(user.isVerified) return sendError(res, 'user is already verified');

    const alreadyHasToken = await emailverificationtoken.findOne({owner: userId});
    if(alreadyHasToken) return sendError(res, 'only after one hour you can resend the token');
    // if(token) await emailverificationtoken.findByIdAndDelete(token._id);

    //  and send that otp to our user

    // generates 6 digit otp
    let OTP = generateOTP();
    // store otp to our db
    const newEmailVerificationToken = new emailverificationtoken({owner : user._id, token: OTP});
    await newEmailVerificationToken.save();

    //  and send that otp to our user

    var transport = generateMailTransporter();

      transport.sendMail ({
          from: 'verification@reviewApp.com',
          to: user.email,
          subject: "email verification",
          html : `
             <p> Your verification OTP </p>
             <h1> ${OTP} </h1>
          `
      })

      res.status(200).json({message: 'New OTP has been send to your email account!'});
     

}

exports.forgetPassword = async (req, res)=>{
      const{email} = req.body;
     
      if(!email) return sendError(res, 'email is required');

     const user =  await User.findOne({email});
      if(!user) return sendError(res, 'user not found' , 404);

    const alreadyHasToken =  await passwordResetToken.findOne( {owner: user._id});
    if(alreadyHasToken) return sendError(res, 'only after one hour you can resend the token');


   const token = await generateRandomByte();
   const newPasswordResetToken = new passwordResetToken({owner: user._id, token});

    await newPasswordResetToken.save();

    const resetPasswordUrl = `http://localhost:3000/auth/reset-password?token=${token}&id=${user._id}`;
    
    const transport = generateMailTransporter();

    transport.sendMail ({
      from: 'Security@reviewApp.com',
      to: user.email,
      subject: "ResetPassword Link",
      html : `
         <p> Click here to reset password </p>
         <a href = '${resetPasswordUrl}'> Change Password </a>
      `
  })


    res.status(200).json({message: 'Reset password link has been send to your email account!'});


}

exports.sendResetPasswordTokenStatus = (req, res) => {
     res.json({valid: true});
}


exports.resetPassword = async (req, res) => {
       const {newPassword, userId} = req.body;

       const user = await User.findById(userId);
       
       const matched = await user.comparePassword(newPassword);
        if(matched) return sendError(res, 'new password should not be same as old password');
        
        user.password = newPassword;
        await user.save();

         await passwordResetToken.findByIdAndDelete(req.resetToken._id);

        const transport = generateMailTransporter();

        transport.sendMail ({
          from: 'Security@reviewApp.com',
          to: user.email,
          subject: "Password Reset successfully",
          html : `
             <h1> Password Reset Successfully </h1>
             <p> Now You can Use your new password  </p>
          `
      });

        res.status(200).json({message: 'Password reset successfully, Now You can Use your new password '});
       

};


exports.signIn = async (req, res) => {

   const {email, password} = req.body;

   const user =  await User.findOne({email});
    if(!user) return sendError(res, 'email or password is mismatch!');

    const matched = await user.comparePassword(password);
    if(!matched) return sendError(res, 'email or password is mismatch!');

    
     const { _id, name, role, isVerified } = user; 

    const jwtToken =  jwt.sign({userId: _id}, process.env.JWT_SECRET); 
    
    res.json({user: {ide: _id, name, email, token: jwtToken, isVerified, role}});

}