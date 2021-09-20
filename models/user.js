const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const userSchema = new mongoose.Schema({
  
  username: {
    type: String,
    unique: true
  },

  passwordHash: {
    type: String
  },

  entries: [
   {
     date: {
       type: String
     },

     createdOn: {
        weekday: { type: String },
        month: { type: String },
        day: { type: Number },
        year: { type: Number },
        time: { type: String }
     },

     content: {
       type: String
     }
   }
  ]
 
  // maximum streak
	// current consecutive value

})


userSchema.plugin(uniqueValidator)

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash
  }
})

module.exports = mongoose.model('User', userSchema)
