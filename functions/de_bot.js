const { Telegraf } = require('telegraf')
const dict = require('./utils/yandex_dict')
const db = require('./utils/db')

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.telegram.setWebhook('https://germanbot.malathi.dev/.netlify/functions/de_bot')

bot.start((ctx) => ctx.reply(
    'Welcome!! Type an English word and I can help you with the german equivalent or type /english and type the German word to know its meaning in English'))

bot.command('english', async (ctx) => {
    const text = ctx.message.text.split(" ")[1]
    await db.user_exists(ctx.message.from.id)
        .then(async (user_exists) => {
            if (!user_exists) {
            console.log("User not exists. Saving to db")
            const user = { 'id': ctx.message.from.id, 'first_name': ctx.message.from.first_name, 'is_bot': ctx.message.from.is_bot }
            await db.save_user(user).then((response) => console.log("save user response: " + response));
        }
    })
    
    await dict.get_meaning(text, 'de-en')
        .then((definitions) => ctx.replyWithHTML(get_reply_text(ctx.message.from.first_name, text, definitions, 'German', 'English')))
        .catch(log_error(ctx))
})

bot.on('text', async (ctx) => {
    const text = ctx.message.text
    await dict.get_meaning(ctx.message.text, 'en-de')
        .then((definitions) => ctx.replyWithHTML(get_reply_text(ctx.message.from.first_name, text, definitions, 'English', 'German')))
        .catch(log_error(ctx))
})

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