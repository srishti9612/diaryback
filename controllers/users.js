const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')
const jwt = require('jsonwebtoken')

console.log = function () {}

/*A method to extract token from the request*/
const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7)
  }

  return null
}


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
     entries: [],
     lastcreated: -1,
     currentstreak: 0,
     longeststreak: 0
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
          createdOn: createdOn,
          week: body.week
  }

  user.entries.push(entry)

  // Make time same on both dates so that 24 hr difference is maintained to check consecutive dates
  // Arbitrarily choosing 2pm as the time on both dates

  console.log(body.date)
  console.log(typeof(body.date))
  let modifiedDateArray = [...createdOnDetails]
  modifiedDateArray[4] = '14:00:00'
  let modifiedDate = modifiedDateArray.join(' ')
  console.log(modifiedDate)
  //console.log(createdOnDetails)
  console.log(Date.parse(body.date)) 
  console.log(Date.parse(body.date) - user.lastcreated)
  console.log(Date.parse(modifiedDate) - user.lastcreated)

  if (user.lastcreated < 0) {

       user.lastcreated = Date.parse(modifiedDate)
       user.currentstreak = 1
       user.longeststreak = 1

  } else {

    if (Date.parse(modifiedDate) - user.lastcreated === 86400000) {
        
        console.log(Date.parse(modifiedDate) - user.lastcreated)
        let currentstreak = user.currentstreak + 1 
        console.log(currentstreak)
        user.currentstreak = currentstreak

        if (user.currentstreak > user.longeststreak) {
           user.longeststreak = user.currentstreak
        }

    } else {
       user.currentstreak = 1
    }

    user.lastcreated = Date.parse(modifiedDate)
  }

  const savedEntry = user.save()

  console.log(user)

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
    
    response.status(200).json(user.entries)
   } else {
     response.json("token null")
   }
  
}) 


usersRouter.get('/insights', async (request, response) => {

    const param = JSON.parse(request.query.insightParams)
    console.log(param) 

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

    const userId = decodedToken.id

    let responseObj = {
      thisWeek: '',
      thisMonth: '',
      thisYear: '',
      currentStreak: '',
      longestStreak: ''
    }

   
    const user = await User.findById(decodedToken.id)

    const entries = user.entries
    
    console.log(entries)

    const monthentries = entries.filter(entry => 
           (entry.createdOn.month === param.month && entry.createdOn.year === Number(param.year)))

    console.log(monthentries.length)
    responseObj.thisMonth = monthentries.length

    const yearentries = entries.filter(entry => (entry.createdOn.year === Number(param.year)))

    console.log(yearentries.length)
    responseObj.thisYear = yearentries.length

    const weekentries = entries.filter(entry => entry.week === param.week)

    console.log(weekentries.length)
    responseObj.thisWeek = weekentries.length

    console.log(user.currentstreak)
    responseObj.currentStreak = user.currentstreak

    console.log(user.longeststreak)
    responseObj.longestStreak = user.longeststreak

    console.log(responseObj)
    
    return response.status(200).json(responseObj)

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
   return response.status(200).json({success: "Deletion Successful"})
  //first retrieve the object with the give uid
  //delete the entry with eid in the entries array in the object

})


module.exports = usersRouter
