const faunadb = require('faunadb')
var client = new faunadb.Client({ secret: process.env.FAUNA_KEY })
const q = faunadb.query

function user_exists(user_id) {
    return client.query(q.Exists(q.Match(q.Index('users_by_id'), user_id)))
}

function save_user(user) {
    return client.query(q.Create(q.Ref(q.Collection('users'), user.id.toString()), {'data': user}))
}

function add_searched_word(user_id, searched_word, lang_code) {
    return client.query(q.Create(q.Collection('word_search'), {
        'data': {
            'user': q.Ref(q.Collection('users'), user_id),
            "word": searched_word,
            "lang_code": lang_code
        }
    }))
}

function word_count(user_id, text) {
    return client.query(q.Count(q.Match(q.Index('words_count'), q.Ref(q.Collection('users'), user_id), text)))
}

module.exports = {user_exists, save_user, add_searched_word, word_count}