const { Get, Update } = require('faunadb')
const faunadb = require('faunadb')
var client = new faunadb.Client({ secret: process.env.FAUNA_KEY })
const q = faunadb.query

function add_user_if_not_exists(user) {
    return client.query(
        q.Let({
            'match': q.Match(q.Index('users_by_id'), user.id)
        }, 
        q.If(
            q.Exists(q.Var('match')),
            {},
            q.Create(q.Ref(q.Collection('users'), user.id), {'data': user})
        ))
    )
}

function add_searched_word(user_id, text, lang_code) {
    var request = {
        'user': q.Ref(q.Collection('users'), user_id),
        "word": text,
        "lang_code": lang_code,
        "count": 1,
        "last_accessed": ""
    }
    return client.query(
        q.Let({
            'match': q.Match(q.Index('get_user_word'), q.Ref(q.Collection('users'), user_id), text, lang_code)
        },
        q.If(
            q.Exists(q.Var('match')),
            q.Let({
                'doc': q.Get(q.Var('match')),
                'ref': q.Select(['ref'], q.Var('doc')),
                'current_count': q.Select(['data', 'count'], q.Var('doc'))
            },
            q.Update(q.Var('ref'), {'data': { 'count': q.Add(1, q.Var('current_count')) }})),
            q.Create(q.Collection('word_search'), {'data': request})
        ))
    )
}

function word_count(user_id, text, lang_code) {
    return client.query(
        q.Let({
            'match': q.Match(q.Index('get_user_word'), q.Ref(q.Collection('users'), user_id), text, lang_code)
        }, 
        q.If(
            q.Exists(q.Var('match')),
            q.Select(['data', 'count'], q.Get(q.Var('match'))),
            0
        )
        )
    )
}

module.exports = {add_user_if_not_exists, add_searched_word, word_count}