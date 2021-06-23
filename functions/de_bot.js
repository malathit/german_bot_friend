const { Telegraf } = require('telegraf')
const dict = require('./utils/yandex_dict')
const db = require('./utils/db')

const bot = new Telegraf(process.env.BOT_TOKEN)
const spam_count = 50

bot.telegram.setWebhook('https://germanbot.malathi.dev/.netlify/functions/de_bot')

bot.start((ctx) => ctx.reply(
    'Welcome!! Type an English/German word and I can help you with the German/English meaning'))

bot.on('text', async (ctx) => {
    if (ctx.message.from.is_bot) {
        ctx.reply("No bots please!!")
        return
    }
    const text = ctx.message.text.split(" ")[0]
    
    const [previous_en_usage_count, previous_de_usage_count] = await Promise.allSettled([
        db.word_count(ctx.message.from.id, text, 'en'),
        db.word_count(ctx.message.from.id, text, 'de')
    ]) 

    if (previous_en_usage_count.value >= spam_count || previous_de_usage_count.value >= spam_count) {
        ctx.reply("Ooh no!! You already searched for the word " + text + " quite a few times. Try with some other words")
        return
    }

    try {
        const check_user_promise = db.add_user_if_not_exists({'id': ctx.message.from.id, 'first_name': ctx.message.from.first_name, 'is_bot': ctx.message.from.is_bot})
        const [de_trans_res, en_trans_res] = await Promise.allSettled([dict.get_meaning(text, 'en-de'), dict.get_meaning(text, 'de-en')])
        if (de_trans_res.status == "fulfilled" && en_trans_res.status == "fulfilled") {
            var de_definitions = de_trans_res.value
            var en_definitions = en_trans_res.value
            if (de_definitions.length > 0) {
                ctx.replyWithHTML(get_reply_text(ctx.message.from.first_name, ctx.message.text, de_definitions, 'English', 'German'))
                await Promise.allSettled([check_user_promise])
                await db.add_searched_word(ctx.message.from.id, text, "en")
            } else if (en_definitions.length > 0) {
                ctx.replyWithHTML(get_reply_text(ctx.message.from.first_name, ctx.message.text, en_definitions, 'German', 'English'))
                await Promise.allSettled([check_user_promise])
                await db.add_searched_word(ctx.message.from.id, text, "de")
            } else {
                ctx.replyWithHTML(get_reply_text(ctx.message.from.first_name, ctx.message.text,
                    de_definitions, 'English/German', 'English/German'))
            }
        }
    } catch(err) {
        console.log(err)
        log_error(ctx)
    } 
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