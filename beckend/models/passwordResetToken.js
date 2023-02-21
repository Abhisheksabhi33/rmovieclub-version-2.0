// verificationToken: {
//     owner: __id,
//     token: otp ( needs to be in hashed format)
//     expiryDate: 1hr

// }

const bcrypt = require('bcrypt');

const mongoose = require('mongoose');
 const passwordResetTokenSchema = mongoose.Schema({
     owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
     },

     token:{
         type: String,
         required: true
     },

     createAt:{
        type: Date,
        expires: 3600,
        default: Date.now(),

     }
 })


 passwordResetTokenSchema.pre('save', async function(next){
    if(this.isModified('token')){
      this.token =  await bcrypt.hash(this.token, 10);
    }
    next();
})

passwordResetTokenSchema.methods.compareToken = async function(token){
    return await bcrypt.compare(token, this.token);
}

module.exports = mongoose.model("passwordResetToken" ,
passwordResetTokenSchema );
