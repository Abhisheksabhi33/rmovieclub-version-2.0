const express = require('express');
require('./db');
const userRouter = require('./routes/user');
const actorRouter = require('./routes/actor');
const movieRouter = require('./routes/movie');
const reviewRouter = require('./routes/review');
const adminRouter = require('./routes/admin');

require('dotenv').config();
const app = express();

const cors = require('cors');
const corsOptions ={
    origin:'http://localhost:3000', 
    credentials:true,            
    optionSuccessStatus:200
}
app.use(cors(corsOptions));

// const cors = require('cors');
require('express-async-errors');


// app.use(cors());
const {errorHandler} = require('./middlewares/error');
const { handleNotFound } = require('./utils/helper');


app.use(express.json());
app.use("/api/user" , userRouter);
app.use("/api/actor" , actorRouter);
app.use("/api/movie" , movieRouter);
app.use("/api/review" , reviewRouter);
app.use("/api/admin" , adminRouter);

app.use('/*', handleNotFound);

app.use(errorHandler);




// app.post('/sign-in' , 
// (req, res, next) => {
//     const {email, password} = req.body;

//     if(!email || !password) return res.json({error: "email or password is missing !" });
// },
//  (req, res) =>{
//      res.send('<h1>Hello i am from your backend about</h1>');
// });

const PORT = process.env.PORT || 8000;

app.listen(PORT, ()=>{
    
    console.log(`Server is running on port ${PORT}`);
});