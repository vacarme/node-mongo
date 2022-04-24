let orders

const Order = {
  injectDB: async function (client) {
    if (orders) return
    try {
      orders = await client.db(process.env.SHOP_NS).collection('orders')
    } catch (e) {
      console.error(`Unable to establish collection handles in orderDAO: ${e}`)
    }
  },
  register: async function (cart) {
    try {
      const result = await orders.insertOne(cart)
      console.log(`${result.insertedCount} documents were inserted with the _id: ${result.insertedId}`)
    } catch (err) {
      console.log(err)
    }
  },
  getOrders: async function (userId) {
    try {
      return await orders.find({ owner: userId }).toArray()
    } catch (err) {
      console.log(err)
    }
  }
}
module.exports = Order
