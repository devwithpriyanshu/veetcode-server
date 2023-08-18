const express = require("express");
const app = express();
const port = process.env.PORT || 5001;
const connectDB = require('./db/connect');
require('dotenv').config();
var jwt = require("jsonwebtoken");
const { auth } = require("./middleware");
let USER_ID_COUNTER = 1;
const USERS = [];
const JWT_SECRET = "secret";
const bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
const cors = require("cors");
app.use(cors());
app.use(jsonParser);
const userModel = require('./models/user')
const problemModel = require('./models/problem')                    
const mongoose = require('mongoose');

// const userDocument = await problemModel.findById(someId).populate('user');

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
})

const start = async () => {
  try {
    const uri = process.env.MONGO_URI;
    await connectDB(uri);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();

app.get('/',(req,res) =>{
    res.json({
        msg:"hello world, this is veetcode api"
    })
})
const generateNewId = async () => {
  const highestIdProblem = await problemModel.findOne().sort({id:-1}) 
  if (highestIdProblem) {
    return highestIdProblem.id+1;
  } else {
    return 1; // If no problems exist yet, start with ID 1
  }
};
app.post("/addproblem",async (req,res) => {
  try 
  {

    const newId = await generateNewId();
    console.log(newId);
    const problemData = { id: newId, ...req.body };
    const document = await problemModel.create(problemData)
    res.status(201).json({ message: 'Document created', document });
  }
  catch(error) {
    res.status(500).json({ message:"error creating document", error: error.message});
  }
});
app.delete("/deleteproblem/:id",(req,res) =>{

  const problemId = req.params.id;
  
  problemModel.deleteOne({id:problemId})
  .then(() => {
    res.send(`Deleted problem with ID: ${problemId}`);
  })
  .catch(error => {
    res.status(500).send(`Error deleting problem: ${error.message}`);
  });
})
app.delete("/deleteallproblems", (req,res) =>{
  problemModel.deleteMany({})
  .then(() => {
    res.send(`Deleted all problems`);
  })
  .catch(error => {
    res.status(500).send('Error deleting all problems',error);
  });
})


app.get("/problems", (req, res) => {
  problemModel.find({})
  .then((problems) => {
      const filteredProblems = problems.map((x) => ({
          problemId: x.id,
          difficulty: x.difficulty,
          title: x.title,
        })
      )
      
        res.json({
          problems: filteredProblems,
        }); 
      }
  )
  .catch((err) =>{
    console.log(err)
    res.status(500).send(err);
  })
  
})


app.get('/problem/:id', async (req,res) =>{

 problemModel.find({ id: req.params.id })
    .then((problem) =>{
      res.json({
        problem,
      });
    })
   .catch (err =>{
    console.error(err);
   })
});

app.get('/me', auth,(req,res) =>{
    const id = req.params.id;
    const user = USERS.find((x) => x.id === id);
    res.json({ email: user.email, id: user.id });
})

app.post("/signup", async (req, res) => {
    
  try{
    const existingUser = await userModel.findOne({email:req.body.email});
    if (existingUser) {
      throw new Error("Email already exists");
    }

    const userData = await userModel.create(req.body).then(result => {
      console.log(result);
    })

    res.json({
      msg: "User Added", userData
    });
    }catch(error){
      res.json({ status: 'error', error})
    }
  });

app.post("/login", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const user = await userModel.findOne({username:username});
  
    if (!user) {
      return res.status(403).json({ msg: "User not found" });
    }
  
    if (user.password !== password) {
      return res.status(403).json({ msg: "Incorrect password" });
    }
    
    const token = jwt.sign(
      {
        id: user.id,
      },
      JWT_SECRET
    );
  //fix this bug it returns token even after failed login
    return res.json({ token: token });
    
  });

  app.get("/submissions/:problemId",  async (req, res) => {
    const problemId = req.params.problemId;
    const submissions = await problemModel.findOne({id:problemId},'submissions').exec();
    res.json({
      submissions,
    });
  });
  
  app.post("/submission", auth, async (req, res) => {
    const isCorrect = Math.random() < 0.5;
    const problemId = req.body.problemId;
    const submission = req.body.submission;
    const language = req.body.language;

    try{
    const temp = await problemModel.findOne({id:problemId}).populate('submissions.username').exec();
    const allSubmissions = temp.submissions;
    const username = req.body.username; 
  
    if (isCorrect) {
      allSubmissions.push({
        code:submission,
        language: language,    //update required
        username: username,
        result: "Accepted",
      });
      
    } else {
      allSubmissions.push({
        code:submission,
        language: language,    // update required
        username: username,
        result: "Wrong Answer",
      });
      await temp.save();
      return res.json({
        status: isCorrect ? "AC" : "WA",
      });
    }
    
  }catch(error){
    console.error(error);
    return res.status(500).json({
      status: "error",
      msg: "An error occurred while processing the submission.",
    });
  }
  });

  if(process.env.NODE_ENV === 'production'){
    app.use(express.static("client/build"));
  }