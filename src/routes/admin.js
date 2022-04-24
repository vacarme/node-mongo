const express = require('express')
const router = express.Router()
const productsController = require('../controllers/controller.js')

// /admin/add-product => GET
router.get('/add-product', productsController.getAddProduct)
// /admin/add-product => POST
router.post('/add-product', productsController.postAddProduct)

// /admin/edit-product => GET
router.get('/edit-product/:productId', productsController.getEditProduct)
// /admin/edit-product => POST
router.post('/edit-product', productsController.postEditProduct)

// /admin/products => GET
router.get('/products', productsController.getProducts)

// /admin/delete-product => POST
router.post('/delete-product', productsController.postDeleteProduct)

module.exports = router
