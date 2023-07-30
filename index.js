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

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
})

const start = async () => {
  try {
   console.log(process.env.MONGO_URI)
    await connectDB(process.env.MONGO_URI);
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
        msg:"hello world"
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

app.post("/signup", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    if (USERS.find((x) => x.email === email)) {
      return res.status(403).json({ msg: "Email already exists" });
    }
  
    USERS.push({
      email,
      password,
      id: USER_ID_COUNTER++,
    });
  
    return res.json({
      msg: "Success",
    });
  });

app.post("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const user = USERS.find((x) => x.email === email);
  
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
  
    return res.json({ token });
    
  });

  app.get("/submissions/:problemId", auth, (req, res) => {
    const problemId = req.params.problemId;
    const submissions = SUBMISSIONS.filter(
      (x) => x.problemId === problemId && x.userId === req.userId
    );
    res.json({
      submissions,
    });
  });
  
  app.post("/submission", auth, (req, res) => {
    const isCorrect = Math.random() < 0.5;
    const problemId = req.body.problemId;
    const submission = req.body.submission;
  
    if (isCorrect) {
      SUBMISSIONS.push({
        submission,
        problemId,
        userId: req.userId,
        status: "AC",
      });
      return res.json({
        status: "AC",
      });
    } else {
      SUBMISSIONS.push({
        submission,
        problemId,
        userId: req.userId,
        status: "WA",
      });
      return res.json({
        status: "WA",
      });
    }
  });

  if(process.env.NODE_ENV === 'production'){
    app.use(express.static("client/build"));
  }
  

