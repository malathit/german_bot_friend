const faunadb = require('faunadb')
var client = new faunadb.Client({ secret: process.env.FAUNA_KEY })
const q = faunadb.query

async function user_exists(user_id) {
    console.log("checking user in db - faunadb")
    await client.query(q.Exists(q.Match(q.Index('users_by_id'), user_id)))
    .then((response) => {
        console.log('success', response)
        return response
      }).catch((error) => {
        console.log('error', error)
        return null
      })
}

async function save_user(user) {
    console.log("saving user in db - faunadb")
    await client.query(q.Create(q.Collection('users'), {'data': user}))
    .then((response) => {
        console.log('success', response)
        return true
      }).catch((error) => {
        console.log('error', error)
        return false
      })
}

module.exports = {user_exists, save_user}