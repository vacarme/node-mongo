module.exports = (req, res, next) => {
  if (!res.locals.isLogged) return res.status(401).render('401')
  next()
}
