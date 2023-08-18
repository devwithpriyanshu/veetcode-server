const mongoose = require('mongoose');
const User = require('./user');

const date = new Date();
const options = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false, // Use 24-hour format
};
const formattedDate = new Intl.DateTimeFormat('fr-FR', options).format(date);

const problemSchema = new mongoose.Schema({
  
  id: {
        type: Number,
        unique: true,
        required: true
  },
  title: {
    type: String,
    required:true
  },
  description: {
    type: String,
    required:true
  },
  difficulty: {
    type: String,
    required:true
  },
  examples:[
    {
      input:{
        type:String,
        required:true
      },
      output:{
        type:String,
        required:true
      },
      explanation:{
        type : String
      }
    },
  ],
  constraints:{
    type:String,
    
  }
  ,
  submissions: [
    {
      username: {
        type: mongoose.Schema.Types.String,
        ref: 'User', //how do i use User schema attribute 'username' in problem schema 
        
      },
      code: {
        type: String,
        required: true
      },
      language: {
        type: String,
        required: true
      },
      submissionDate:{
        type: String,
        default: formattedDate

      },
      result: {
        type: String,
        enum: ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error'],
        default: 'Accepted'
      }
    }
  ]
});


module.exports = mongoose.model('problems', problemSchema);
