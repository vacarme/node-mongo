const express = require('express')
const router = express.Router()

const productsController = require('../controllers/controller.js')
const isAuth = require('../middleware/is-auth.js')

// / => GET
router.get('/', productsController.getIndex)
// /product-list => GET
router.get('/product-list', productsController.getProductsList)

// /cart => GET
router.get('/cart', isAuth, productsController.getCart)
// /cart => GET
router.post('/cart', isAuth, productsController.postCart)

// /product-list/product-detail => GET
router.get('/product-list/:productId', productsController.getProductDetail)

router.get('/orders', isAuth, productsController.getOrders)
router.post('/checkout', isAuth, productsController.postOrder)
router.post('/delete-product-cart', isAuth, productsController.postDeleteProductCart)

router.post('/drop-cart', isAuth, productsController.postDropCart)
router.post('/adjust-cart', isAuth, productsController.postAdjustCart)
module.exports = router
