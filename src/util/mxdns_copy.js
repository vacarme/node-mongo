
const dnsPremise = require('dns').promises

module.exports = async function mxExists (email) {
  const hostname = email.split('@')[1]
  try {
    const mx = await dnsPremise.resolveMx(hostname)
    return !!mx[0].exchange
  } catch (err) {
    return false
  }
}
/*
const truco = require('./src/util/mxdns_copy.js')
const velib = truco('alex@spacedukesss.com').then(a => console.log(a))
*/
