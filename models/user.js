const mongoose = require('mongoose');

// Define the user schema
const userSchema = new mongoose.Schema({
  
  username:{
    type:String,
    required:true,
    unique:true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
});


// Export the models
module.exports = mongoose.model('User', userSchema);
