const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController.js')
const isAuth = require('../middleware/is-auth.js')

router.get('/login', authController.getLogin)
router.post('/login', authController.postLogin)

router.post('/logout', isAuth, authController.postLogout)
router.get('/signup', authController.getSignup)
router.post('/signup', authController.postSignup)

router.get('/reset', authController.getAskForPasswordReset)
router.post('/reset', authController.postAskForPasswordReset)
router.get('/reset/:token', authController.getNewPassword)
router.post('/new-pwd', authController.postNewPassword)
module.exports = router
