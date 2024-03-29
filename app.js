const config = require('./utils/config')
const express = require('express')
const app = express()
const cors = require('cors')
const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')
const middleware = require('./utils/middleware')
const logger = require('./utils/logger')
const mongoose = require('mongoose')
const path = require('path')

logger.info('connecting to', config.MONGODB_URI)

mongoose
   .connect(config.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true})
   .then(() => {
     logger.info('connected to MongoDB')
   })
   .catch((error) => {
     logger.error('error connection to MongoDB: ', error.message)
   })

app.use(express.static(path.join(__dirname, 'build')))
app.use(cors())
//app.use(express.static('build'))
app.use(express.urlencoded())
app.use(express.json())
app.use(middleware.requestLogger)
app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)
app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'))
})

module.exports = app
