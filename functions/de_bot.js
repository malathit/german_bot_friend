const { Telegraf } = require('telegraf')
const dict = require('./utils/yandex_dict')
const db = require('./utils/db')

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.telegram.setWebhook('https://germanbot.malathi.dev/.netlify/functions/de_bot')

bot.start((ctx) => ctx.reply(
    'Welcome!! Type an English/German word and I can help you with the German/English meaning'))

bot.command('en', async (ctx) => {
    try {
        const text = ctx.message.text.split(" ")[1]
        var definitions = await dict.get_meaning(text, 'de-en')
        ctx.replyWithHTML(get_reply_text(ctx.message.from.first_name, text, definitions, 'German', 'English'))
        await addUserIfNotPresent({'id': ctx.message.from.id, 'first_name': ctx.message.from.first_name, 'is_bot': ctx.message.from.is_bot})
        if (definitions.length > 0) {
            await db.add_searched_word(ctx.message.from.id, text, "de")
        }
    } catch(err) {
        log_error(ctx)
    } 
})

bot.on('text', async (ctx) => {
    if (ctx.message.from.is_bot) {
        ctx.reply("No bots please!!")
        return
    }
    const text = ctx.message.text.split(" ")[0]
    const previous_usage_count = await db.word_count(ctx.message.from.id, text)
    if (previous_usage_count > 50) {
        ctx.reply("Ooh no!! You already searched for the word quite a few times. Try with some other words")
        return
    }

    try {
        const check_user_promise = addUserIfNotPresent({'id': ctx.message.from.id, 'first_name': ctx.message.from.first_name, 'is_bot': ctx.message.from.is_bot})
        const [de_trans_res, en_trans_res] = await Promise.allSettled([dict.get_meaning(text, 'en-de'), dict.get_meaning(text, 'de-en')])
        if (de_trans_res.status == "fulfilled") {
            var de_definitions = de_trans_res.value
            if (de_definitions.length > 0) {
                ctx.replyWithHTML(get_reply_text(ctx.message.from.first_name, ctx.message.text, de_definitions, 'English', 'German'))
                await Promise.allSettled([check_user_promise])
                await db.add_searched_word(ctx.message.from.id, text, "en")
            }
        }
        if (en_trans_res.status == "fulfilled") {
            var en_definitions = en_trans_res.value
            if (en_definitions.length > 0) {
                ctx.replyWithHTML(get_reply_text(ctx.message.from.first_name, ctx.message.text, en_definitions, 'German', 'English'))
                await Promise.allSettled([check_user_promise])
                await db.add_searched_word(ctx.message.from.id, text, "de")
            }
        }
        
        if (de_definitions.length == 0 && en_definitions.length == 0) {
            ctx.replyWithHTML(get_reply_text(ctx.message.from.first_name, ctx.message.text, de_definitions, 'English/German', 'English/German'))
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