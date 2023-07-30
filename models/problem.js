const mongoose = require('mongoose');

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
  submissions: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      code: {
        type: String,
        required: true
      },
      language: {
        type: String,
        // required: true
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