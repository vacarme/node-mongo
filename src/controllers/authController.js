const User = require('../dao/userDAO.js')
const argon2 = require('argon2')
const nodemailer = require('nodemailer')
const crypto = require('crypto')

const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'frederique42@ethereal.email', // generated ethereal user
    pass: 'Qgnvmbs8NtRnkg9cCG' // generated ethereal password
  }
})

exports.getLogin = (req, res) => {
  res.render('auth/login', { flashError: req.flash('error') })
}

exports.postLogin = async (req, res) => {
  const { email, password } = req.body
  try {
    const user = await User.findByEmail(email)
    if (!user) {
      req.flash('error', 'Wrong email')
      throw new Error('No user with this email found in DB')
    }
    if (await argon2.verify(user.pwd, password)) {
      req.session.user = {
        _id: user._id,
        name: user.name
      }
      return req.session.save(async (err) => {
        console.log(err)
        res.redirect('/')
      })
    } else throw new Error('invalid password')
  } catch (err) {
    console.log(err)
    res.redirect('/login')
  }
}
exports.postLogout = (req, res) => {
  req.session.destroy(err => {
    res.clearCookie('connect.sid')
    console.log('destroyed')
    console.log(err)
    res.redirect('/')
  })
}
exports.getSignup = (req, res) => {
  res.render('signup')
}
exports.postSignup = (req, res) => {
  const email = req.body.email
  const password = req.body.password
  User.findByEmail(email)
    .then(user => {
      if (user) {
        throw new Error('dup account')
      } else {
        return argon2.hash(password)
      }
    })
    .then(hash => {
      const newUser = Object.create(User)
      newUser.init({
        name: email.split('@')[0],
        email: email,
        pwd: hash
      })
      return newUser.add()
    })
    // .then(result => console.log(result))
    .then((result) => {
      res.redirect('/login')
      return transporter.sendMail({
        from: '"Alex 👻" <foo@example.com>', // sender address
        to: `"user", ${email}`, // list of receivers
        subject: 'Hello ✔', // Subject line
        text: 'Hello world?', // plain text body
        html: '<b>Hello world?</b>' // html body
      })
    })
    .then(info => {
      console.log('Message sent: %s', info.messageId)
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info))
    })
    .catch(e => console.log(e + 'titi'))
    // .finally(r => res.redirect('/login'))
}

/* exports.postSignup = async (req, res) => {
  try {
    const user = await User.findByEmail(req.body.email)
    if (user) {
      return null
    } else {
      const newUser = Object.create(User)
      newUser.init({
        name: 'Alex',
        email: req.body.email,
        pwd: req.body.password
      })
      await newUser.add()
      return res.redirect('/login')
    }
  } catch {
    console.log('!!!!')
  }
} */
exports.getAskForPasswordReset = (req, res, next) => {
  res.render('auth/pwd-reset')
}

exports.postAskForPasswordReset = async (req, res, next) => {
  const email = req.body.email
  try {
    const user = Object.create(User)
    const _user = await User.findByEmail(email)
    if (!_user) throw new Error('wrong mail address')
    user.init(_user)
    crypto.randomBytes(32, async (err, buffer) => {
      if (err) console.log(err)
      const token = {
        value: buffer.toString('hex'),
        expirationDate: Date.now() + 20 * 60 * 1000
      }
      const isTokenDropped = await user.askForReset(token)
      console.log(`${isTokenDropped.matchedCount} document(s) matched the filter, updated ${isTokenDropped.modifiedCount} document(s)`)
      if (!isTokenDropped) throw new Error('token not dropped')
      res.redirect('/login')
      const info = await transporter.sendMail({
        from: '"Reset Pwd 👻" <foo@example.com>', // sender address
        to: `"user", ${email}`, // list of receivers
        subject: 'Pwd reset ✔', // Subject line
        html: `
        <b>Password request</b>
        <p> Click : <a href="http://localhost:3000/reset/${token.value}"/>here</a></p>
        <p>will expire in 20min</p>
            ` // html body
      })
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`)
    })
  } catch (err) {
    console.log(err)
  }
}

exports.getNewPassword = async (req, res, next) => {
  const tokenValue = req.params.token
  const passView = await User.findByToken(tokenValue, Date.now())
  passView.token = tokenValue
  res.render('auth/new-password', passView)
}

exports.postNewPassword = async (req, res, next) => {
  const { userID, token, password } = req.body
  try {
    const hash = await argon2.hash(password)
    if (await User.updatePassword(userID, token, hash, Date.now()) !== 1) throw new Error('error in updatePassword')
    res.redirect('/login')
  } catch (err) {
    console.log(err)
  }
}
