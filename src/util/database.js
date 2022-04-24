const MongoClient = require('mongodb').MongoClient
const uri = 'mongodb+srv://seashell:jemangedesmangues@banane.w8dof.mongodb.net/shopDB?retryWrites=true&w=majority'
const client = new MongoClient(uri, { useUnifiedTopology: true })

async function run (callback) {
  try {
    await client.connect()
    await client.db('admin').command({ ping: 1 })
    console.log('Connected successfully to server')
    callback()
  } catch (err) {
    console.log(err.stack)
  }
}
exports.client = client
exports.run = run
