const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')
const jwt = require('jsonwebtoken')


/*A method to extract token from the request*/
const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7)
  }

  return null
}


//console.log('inside a controller')
usersRouter.get('/', (request, response) => {
    response.write('hello')
    response.end()
})


usersRouter.post('/', async (request, response) => {
  const body = request.body
  
  const userexists = await User.findOne({ username: body.username }).exec()

  if(userexists) {
    return response.json(null)
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(body.password, saltRounds)

  const user = new User({
     username: body.username,
     passwordHash,
     entries: []
  })

  const savedUser = await user.save()

  response.json(savedUser)
  
})




usersRouter.post('/entry', async (request, response) => {
  const body = request.body
  const token = getTokenFrom(request)
  const decodedToken = jwt.verify(token, process.env.SECRET)

  if (!token || !decodedToken.id){
    return response.status(401).json({ error: 'token missing or invalid' })
  }
  
  const user = await User.findById(decodedToken.id)

  const createdOnDetails = body.date.split(' ')

  const createdOn = {
    weekday: createdOnDetails[0],
    month: createdOnDetails[1],
    day: Number(createdOnDetails[2]),
    year: Number(createdOnDetails[3]),
    time: createdOnDetails[4]
  }

  const entry = {
    content: body.content,
    date: body.date,
    createdOn: createdOn
  }

  user.entries.push(entry)
  const savedEntry = user.save()

  let len = user.entries.length
  
  response.json(user.entries[len-1])
 
})


usersRouter.get('/entries', async (request, response) => {
   const body = request.body
   const token = getTokenFrom(request)
   
   if(token!=null){
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!token || !decodedToken.id) {
      return response.status(401).json({ error: 'token missing or invalid' })
    }
    const user = await User.findById(decodedToken.id)
    
    response.json(user.entries)
   } else {
     response.json("token null")
   }
  
}) 


usersRouter.delete('/entry/:id', async (request, response) => {
   
   let mongoose = require('mongoose')
   const eid = mongoose.Types.ObjectId(request.params.id)

   const token = getTokenFrom(request)
   console.log('token')
   console.log(token)
   const decodedToken = jwt.verify(token, process.env.SECRET)
   console.log('decodedToken')
   console.log(decodedToken)

   if(token!=null){
     if(!decodedToken || !decodedToken.id){
       return response.status(401).json({ error: 'token missing or invalid'})
     }
   }

   const user = await User.findById(decodedToken.id)
  
   console.log(user)

   User.updateOne(
      { _id: user._id },
      { $pull: { entries: { _id: eid } } },
      { safe: true, multi: true},
      function(err, obj) {
        console.log('inside function')
      }
    )
   
   console.log(user)

  //first retrieve the object with the give uid
  //delete the entry with eid in the entries array in the object

})


module.exports = usersRouter
