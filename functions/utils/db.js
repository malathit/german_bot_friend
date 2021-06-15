const faunadb = require('faunadb')
var client = new faunadb.Client({ secret: process.env.FAUNA_KEY })
const q = faunadb.query

async function user_exists(user_id) {
    try {
        return await client.query(q.Exists(q.Match(q.Index('users_by_id'), user_id)))
    } catch(error) {
        console.log('db error', error)
        return null
    }
}

async function save_user(user) {
    try {
        return await client.query(q.Create(q.Collection('users'), {'data': user}))
    } catch(error) {
        console.log('db error', error)
        return null
    }
}

module.exports = {user_exists, save_user}