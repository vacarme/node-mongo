
const express = require('express')
const path = require('path')
const session = require('express-session')
const MongoStore = require('connect-mongodb-session')(session)
const csrf = require('csurf')
const csrfProtection = csrf()
const flash = require('connect-flash')
const User = require('./dao/userDAO.js')

// Util
const isAuth = require('./middleware/is-auth.js')
const adminRoutes = require('./routes/admin.js')
const shopRoutes = require('./routes/shop.js')
const authRoutes = require('./routes/auth.js')

const app = express()
// config
app.set('views', './src/views') // de base il cherche dans process.cwd()/views
app.set('view engine', 'ejs')
// middleware
app.use(express.urlencoded({ extended: false })) // parser
app.use(express.static(path.join(process.cwd(), 'src/public')))
app.use(session({
  secret: 'pomme banane',
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  store: new MongoStore({
    uri: process.env.MONGO_URI,
    collection: 'sessions'
  })
}))
app.use(csrfProtection) // déclenche le dépôt du cookie connect.sid
app.use(flash())
app.use((req, res, next) => {
  if (req.session.user) {
    req.user = Object.create(User)
    req.user.wakeUpFromSess(req.session.user)
    res.locals.isLogged = true
  } else {
    req.user = { id: 0, name: 'Anonymous' }
    res.locals.isLogged = false
  }
  next()
})

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken()
  next()
})
app.use('/admin', isAuth, adminRoutes)
app.use(shopRoutes)
app.use(authRoutes)
app.use((req, res) => {
  res.status(404).render('404', { pageTitle: '404' })
})

module.exports = app
