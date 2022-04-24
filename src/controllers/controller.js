const Product = require('../dao/productDAO.js')
const Order = require('../dao/orderDAO.js')

// '/' === 'index.ejs'
exports.getIndex = (req, res) => {
  res.render('index', { username: req.user.name })
}
// ADMIN

// admin/products => GET
exports.getProducts = async (req, res) => {
  res.render('admin/products', {
    products: await Product.fetchProductsOfUser(req.user._id),
    username: req.user.name
  })
}

exports.getAddProduct = (req, res) => {
  res.render('admin/add-product')
}
// admin/add-product => POST
exports.postAddProduct = (req, res) => { // ici le contenu n'aura lieu que si on arrive depuis une POST donc pas de redirection si on tape l'url dans la barre
  const o = Object.create(Product).init(req.body)
  o.add(req.user._id)
  res.redirect('/admin/products')
}

// admin/edit-product => GET
exports.getEditProduct = async (req, res) => {
  const id = req.params.productId
  res.render('admin/edit-product', {
    product: await Product.findById(id)
  })
}
// admin/edit-product => POST
exports.postEditProduct = async (req, res) => {
  if (req.body.userId !== req.user._id.toString()) return res.status(403).render('403', { ip: req.ip })
  try {
    const o = Object.create(Product).init(req.body)
    if (!await o.edit()) throw new Error('product edit failed')
    res.redirect('/admin/products')
  } catch (err) {
    console.log(err)
    res.send('<p>Le produit n\'a pas été modifié</p>')
  }
}
// admin/delete-product => POST
exports.postDeleteProduct = async (req, res) => {
  if (req.body.userId !== req.user._id.toString()) return res.status(403).render('403', { ip: req.ip })
  try {
    if (await Product.deleteById(req.body.productId, req.user._id) !== 1) throw new Error('product delete failed')
  } catch (err) {
    console.log(err)
  } finally {
    console.log('finally')
    res.redirect('/admin/products')
  }
}

//
// CLIENT
//

// product-list => GET
exports.getProductsList = async (req, res) => {
  res.render('product-list', {
    products: await Product.fetchAll(),
    username: req.user.name
  })
}

// product-detail => GET
exports.getProductDetail = async (req, res) => {
  const id = req.params.productId
  res.render('product-detail', {
    product: await Product.findById(id),
    username: req.user.name
  })
}

exports.getCart = async (req, res) => {
  const cart = await req.user.getCart()
  res.render('cart', {
    cart: cart,
    username: req.user.name
  })
}

exports.postCart = (req, res) => {
  req.user.addToCart(req.body._id)
  res.redirect('/cart')
}

exports.getOrders = async (req, res) => {
  res.render('orders', {
    orders: await Order.getOrders(req.user._id),
    username: req.user.name
  })
}

exports.postOrder = async (req, res) => { // checkout
  const items = await req.user.getLightCart()
  const cart = {
    paid: Number(req.body.price_total),
    items: items.cart,
    owner: req.user._id,
    date: new Date()
  }
  Order.register(cart)
  req.user.dropCart()
  res.redirect('/orders')
}

exports.postDropCart = (req, res) => {
  req.user.dropCart()
  res.redirect('/cart')
}

exports.postAdjustCart = (req, res) => {
  const id = req.body.productId
  const sens = req.query.sens
  if (sens === 'up') req.user.incrementCart(id)
  if (sens === 'down') req.user.decrementCart(id)
  res.redirect('/cart')
}

exports.postDeleteProductCart = (req, res) => {
  const id = req.body.productId
  req.user.removeFromCart(id)
  res.redirect('/cart')
}
