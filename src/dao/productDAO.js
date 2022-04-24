const ObjectId = require('bson').ObjectId

let products

const Product = {
  injectDB: async function (client) {
    if (products) return
    try {
      products = await client.db(process.env.SHOP_NS).collection('products')
    } catch (e) {
      console.error(`Unable to establish collection handles in productDAO: ${e}`)
    }
  },
  init: function ({ name, image, description, price, _id }) {
    this.name = name
    this.image = image
    this.description = description
    this.price = parseInt(price, 10)
    this._id = new ObjectId(_id)
    return this
  },
  isOwnedby: function (id) {
    this.userId = id
  },
  add: async function (id) {
    if (id) this.userId = id
    try {
      const result = await products.insertOne(this)
      console.log(
        `${result.insertedCount} documents were inserted with the _id: ${result.insertedId}`
      )
    } catch (err) {
      console.log(err.stack)
    }
  }, // a degager
  edit2: async function () {
    setTimeout(async () => {
      console.log('FIREEEE')
      return await products.updateOne({ _id: this._id }, { $set: this }).modifiedCount
    }, 5500)
  },
  edit: async function () {
    try {
      const filter = { _id: this._id }
      const result = await products.updateOne(filter, { $set: this })
      if (process.env.NODE_ENV === 'development') console.log(`${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`)
      return result.modifiedCount
    } catch (err) {
      console.log(err)
    }
  },
  deleteById: async function (id, userId) {
    try {
      const query = { _id: new ObjectId(id), userId: userId }
      const result = await products.deleteOne(query)
      if (process.env.NODE_ENV === 'development') {
        if (result.deletedCount === 1) console.log('successfully deleted one document')
        else console.log('No documents matched the query. Deleted 0 documents.')
      }
      return result.deletedCount
    } catch (err) {
      console.log(err)
    }
  },
  fetchAll: async function () {
    try {
      return await products.find().toArray()
    } catch (err) {
      console.log(err)
    }
  },
  fetchProductsOfUser: async function (userID) {
    try {
      return await products.find({ userId: ObjectId(userID) }).toArray()
    } catch (err) {
      console.log(err)
    }
  },
  findById: async function (id) {
    try {
      const query = { _id: new ObjectId(id) }
      return await products.findOne(query)
    } catch (err) {
      console.log(err)
    }
  }
}

module.exports = Product
