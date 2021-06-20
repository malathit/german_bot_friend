const { Telegraf } = require('telegraf')
const dict = require('./utils/yandex_dict')
const db = require('./utils/db')

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.telegram.setWebhook('https://germanbot.malathi.dev/.netlify/functions/de_bot')

bot.start((ctx) => ctx.reply(
    'Welcome!! Type an English word and I can help you with the german equivalent or type /english and type the German word to know its meaning in English'))

bot.command('english', async (ctx) => {
    try {
        const text = ctx.message.text.split(" ")[1]
        await addUserIfNotPresent({'id': ctx.message.from.id, 'first_name': ctx.message.from.first_name, 'is_bot': ctx.message.from.is_bot})
        var definitions = await dict.get_meaning(text, 'de-en')
        ctx.replyWithHTML(get_reply_text(ctx.message.from.first_name, text, definitions, 'German', 'English'))
        if (definitions.length > 0) {
            await db.add_searched_word(ctx.message.from.id, text, "de")
        }
    } catch(err) {
        log_error(ctx)
    } 
})

bot.on('text', async (ctx) => {
    try {
        const text = ctx.message.text.split(" ")[0]
        await addUserIfNotPresent({'id': ctx.message.from.id, 'first_name': ctx.message.from.first_name, 'is_bot': ctx.message.from.is_bot})
        var definitions = await dict.get_meaning(text, 'en-de')
        ctx.replyWithHTML(get_reply_text(ctx.message.from.first_name, ctx.message.text, definitions, 'English', 'German'))
        if (definitions.length > 0) {
            await db.add_searched_word(ctx.message.from.id, text, "en")
        }
    } catch(err) {
        log_error(ctx)
    } 
})

async function addUserIfNotPresent(user) {
    let user_exists = await db.user_exists(user.id)
    console.log("checked if user exists:", user_exists)
    if (!user_exists) {
        console.log("User not exists. Saving to db")
        let user_save_res = await db.save_user(user)
        console.log(user_save_res)
    }
}

function get_reply_text(sender, text, definitions, textLang, definitionLang) {
    if (definitions.length == 0) {
        return 'Hello ' + sender + ', the ' + textLang + ' word <b>' + text + '</b> has no ' + definitionLang + ' meaning. Please check the word again'
    }
    var response = 'Hello ' + sender +
        ', these are the ' + definitionLang + ' word(s) for the ' + textLang + ' word <b>' + text + '</b>\n\n'
    response += format_definitions(definitions) + '\n <b>Powered by Yandex.com</b>'
    return response
}

function format_definitions(definitions) {
    var formatted_str = ''
    definitions.forEach((definition, index) => {
        formatted_str += (index + 1) + '. ' + definition.text + '(' + definition.pos + ')\n'
    })
    return formatted_str
}

function log_error(ctx) {
    return (e) => {
        console.log(e)
        ctx.reply('Some error. Please try later')
    }
}

exports.handler = async function (event, context) {
    console.log(event.body)
    await bot.handleUpdate(JSON.parse(event.body));
    return { statusCode: 200, body: '' };
}