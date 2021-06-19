const faunadb = require('faunadb')
var client = new faunadb.Client({ secret: process.env.FAUNA_KEY })
const q = faunadb.query

async function user_exists(user_id) {
    try {
        console.log('checking user exists')
        return await client.query(q.Exists(q.Match(q.Index('users_by_id'), user_id)))
    } catch(error) {
        console.log('db error', error)
        return null
    }
}

async function save_user(user) {
    try {
        console.log('saving user')
        return await client.query(q.Create(q.Ref(q.Collection('users'), user.id.toString()), {'data': user}))
    } catch(error) {
        console.log('db error', error)
        return null
    }
}

async function add_searched_word(user_id, searched_word) {
    try {
        console.log('saving word_search')
        return await client.query(q.Create(q.Collection('word_search'), {
            'data': {
                'user': q.Ref(q.Collection('users'), user_id.toString()),
                "word": searched_word
            }
        }))
    } catch(error) {
        console.log('db error', error)
        return null
    }
}

module.exports = {user_exists, save_user, add_searched_word}