const mongoose = require('mongoose')

const connectDB = async (url) => {
    mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
}

module.exports = connectDB