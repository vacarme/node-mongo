const ObjectId = require('bson').ObjectId

let users

const User = {
  injectDB: async function (client) {
    if (users) return
    try {
      users = await client.db(process.env.SHOP_NS).collection('users')
    } catch (e) {
      console.error(`Unable to establish collection handles in userDAO: ${e}`)
    }
  },
  init: function ({ name, email, pwd, _id }) {
    this.email = email
    this.name = name
    this.pwd = pwd
    this._id = new ObjectId(_id) // si _id = undefined genere une id commme dans la db.
  },
  wakeUpFromSess: function ({ name, _id }) {
    this.name = name
    this._id = _id
  },
  add: async function () {
    try {
      const result = await users.insertOne(this)
      console.log(`${result.insertedCount} documents were inserted with the _id: ${result.insertedId}`)
    } catch (err) {
      console.log(err)
    }
  },
  findById: async function (userIdString) {
    try {
      const query = { _id: new ObjectId(userIdString) }
      return await users.findOne(query)
    } catch (err) {
      console.log(err)
    }
  },
  findByEmail: async function (userEmail) {
    try {
      const query = { email: userEmail }
      return await users.findOne(query)
    } catch (err) {
      console.log(err)
    }
  },
  addToCart: async function (productId) {
    try {
      const result = await users.updateOne(
        { _id: this._id },
        { $push: { cart: new ObjectId(productId) } }
      )
      console.log(`${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`)
    } catch (err) {
      console.log(err)
    }
  },
  getCart: async function () {
    try {
      const pipeline = [
        {
          '$match': {
            '_id': this._id
          }
        },
        {
          '$unwind': {
            'path': '$cart'
          }
        }, {
          '$group': {
            '_id': '$cart', 
            'quantity': {
              '$sum': 1
            }
          }
        }, {
          '$lookup': {
            'from': 'products', 
            'let': {
              'id': '$_id', 
              'quantity': '$quantity'
            }, 
            'pipeline': [
              {
                '$match': {
                  '$expr': {
                    '$eq': [
                      '$_id', '$$id'
                    ]
                  }
                }
              }, {
                '$addFields': {
                  'quantity': '$$quantity'
                }
              }
            ], 
            'as': 'items'
          }
        }, {
          '$project': {
            '_id': 0, 
            'item': {
              '$arrayElemAt': [
                '$items', 0
              ]
            }
          }
        }, {
          '$addFields': {
            'item.price_batch': {
              '$multiply': [
                '$item.quantity', '$item.price'
              ]
            }, 
            'item.description': {
              '$substr': [
                '$item.description', 0, 34
              ]
            }
          }
        }, {
          '$group': {
            '_id': null, 
            'items': {
              '$push': '$item'
            }, 
            'price_total': {
              '$sum': {
                '$multiply': [
                  '$item.quantity', '$item.price'
                ]
              }
            }
          }
        }, {
          '$project': {
            '_id': 0
          }
        }
      ]
      return await users.aggregate(pipeline).next()
    } catch (err) {
      console.log(err)
    }
  },
  getLightCart: async function () {
    try {
      return await users.aggregate([
        { $match: { _id: this._id } },
        { $project: { cart: 1, _id: 0 } }
      ])
        .next()
    } catch (err) {
      console.log(err)
    }
  },
  removeFromCart: async function (productId) {
    try {
      const result = await users.updateOne(
        { _id: this._id },
        { $pull: { cart: new ObjectId(productId) } }
      )
      console.log(`${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`)
    } catch (err) {
      console.log(err)
    }
  },
  incrementCart: async function (productId) {
    const productMongoId = new ObjectId(productId)
    try {
      const result = users.updateOne(
        { _id: this._id, cart: productMongoId },
        { $push: { cart: productMongoId } }
      )
      console.log(`${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`)
    } catch (err) {
      console.log(err)
    }
  },
  decrementCart: async function (productId) {
    const stage1 = {
      updateOne: {
        filter: { _id: this._id, cart: new ObjectId(productId) },
        update: { $unset: { 'cart.$': '' } }
      }
    }
    const stage2 = {
      updateOne: {
        filter: { _id: this._id },
        update: { $pull: { cart: null } }
      }
    }
    try {
      const result = await users.bulkWrite([stage1, stage2])
      console.log(`${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`)
    } catch (err) {
      console.log(err)
    }
  },
  incrementCartOld: async function (productId, sens) {
    const productMongoId = new ObjectId(productId)
    try {
      if (sens === 'up') {
        pipeline = { $push: { cart: productMongoId } }
      } else if (sens === 'down') {
        pipeline = [{ $unset: { 'cart.$': '' } }, { $pull: { cart: null } }]
      } else throw new Error('sens not defined')
      const result = await users.updateOne(
        { _id: this._id, cart: productMongoId },
        pipeline
      )
      console.log(`${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`)
    } catch (err) {
      console.log(err)
    }
    /* const index = this.cart.items.findIndex(item => item._id.toString() === id.toString())
    if (sens === 'up') this.cart.items[index].quantity++
    if (sens === 'down') {
      if (this.cart.items[index].quantity === 1) return this.removeFromCart(id)
      else this.cart.items[index].quantity--
    }
    try {
      const filter = { _id: new ObjectId(this._id) }
      const result = await users.updateOne(filter, { $set: { cart: this.cart } })
      console.log(`${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`)
    } catch (err) {
      console.log(err)
    } */
  },
  dropCart: async function () {
    try {
      const filter = { _id: this._id }
      const result = await users.updateOne(filter, { $set: { cart: [] } })
      console.log(`${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`)
    } catch (err) {
      console.log(err)
    }
  },
  askForReset: async function (token) {
    try {
      return await users.updateOne(
        { _id: this._id },
        { $set: { resetToken: token } }
      )
      // console.log(`${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`)
    } catch (err) {
      console.log(err)
    }
  },
  findByToken: async function (tokenValue, date) {
    try {
      return await users.findOne({
        'resetToken.value': tokenValue,
        'resetToken.expirationDate': { $gt: date }
      },
      { projection: { _id: 1 } })
    } catch (err) {
      console.log(err)
    }
  },
  updatePassword: async function (id, tokenValue, hash, date) {
    try {
      const result = await users.updateOne({
        _id: new ObjectId(id),
        'resetToken.value': tokenValue,
        'resetToken.expirationDate': { $gt: date }
      },
      { $set: { pwd: hash }, $unset: { resetToken: '' }, $inc: { 'log.pwdResetCount': 1 } }
      )
      if (process.env.NODE_ENV === 'development') console.log(`${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`)
      return result.modifiedCount
    } catch (err) {
      console.log(err)
    }
  }
}
module.exports = User
