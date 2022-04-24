
const app = require('./app.js')
const MongoClient = require('mongodb').MongoClient
const ProductDAO = require('./dao/productDAO.js')
const OrderDAO = require('./dao/orderDAO.js')
const UserDAO = require('./dao/userDAO.js')

MongoClient.connect(
  process.env.MONGO_URI,
  { useUnifiedTopology: true, wtimeout: 2500, retryWrites: true, w: 'majority' }
)
  .catch(err => {
    console.error(err.stack)
    process.exit(1)
  })
  .then(async client => {
    await ProductDAO.injectDB(client)
    await UserDAO.injectDB(client)
    await OrderDAO.injectDB(client)
    app.listen(process.env.PORT, () => {
      console.log(`listening on port ${process.env.PORT}`)
    })
  })
