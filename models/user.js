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
       type: Date
     },

     week: {
       type: Number
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
  ],
 
  lastcreated: { type: Number },
     
  currentstreak: { type: Number },
     
  longeststreak: { type: Number }

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
