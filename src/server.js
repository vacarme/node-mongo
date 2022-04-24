require('dotenv').config()
const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
// const mongoco = require('./util/database.js').run
const MongoClient = require('mongodb').MongoClient
// Util
const paths = require('./util/paths.js')
const admin = require('./routes/admin.js')
const shopRoutes = require('./routes/shop.js')
const authRoutes = require('./routes/auth.js')
const User = require('./dao/userDAO.js')

const app = express()
app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false })) // parser
app.use(express.static(paths.public))
/* app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    uri: 'mongodb+srv://seashell:jemangedesmangues@banane.w8dof.mongodb.net/shopDB',
    collection: 'sessions'
  })
})) */
app.use(async (req, res, next) => {
  try {
    const user = await User.findById('5fae9b6218f98112d412be79')
    const user2 = Object.create(User)
    user2.init(user)
    req.user = user2
  } catch (err) {
    console.log(err)
  } finally {
    next()
  }
})

app.use('/admin', admin.router) // comme ca qu'on importe les routes externalisées, le /admin permet d'ajouter un prepath a tout ce qui y'a dans adminRoutes
app.use(shopRoutes)
app.use(authRoutes)
app.use((req, res) => {
  // res.status(404).sendFile(paths.path404)
  res.status(404).render('404', { pageTitle: '404' }) // avec ejs
})

MongoClient.connect(
  process.env.MONGO_URI,
  { useUnifiedTopology: true, wtimeout: 2500, retryWrites: true, w: 'majority' }
)
  .catch(err => {
    console.error(err.stack)
    process.exit(1)
  })
  .then(async client => {
    app.listen(process.env.PORT, () => {
      console.log(`listening on port ${process.env.PORT}`)
    })
  })

/*
mongoco(() => {
  app.listen(3000)
}).catch(console.dir)
*/
