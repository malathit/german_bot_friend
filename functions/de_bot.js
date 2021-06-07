const { Telegraf } = require('telegraf')
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN)

//bot.telegram.setWebhook('https://germanbot.malathi.dev/.netlify/functions/de_bot')

bot.start((ctx) => ctx.reply('Welcome!! Type an English word and I can help you with the german equivalent'))
bot.on('text', async (ctx) => {
    console.log("got request")
    await getMeaning(ctx.message.text)
        .then((meanings) => {
            var response = 'Hello ' + ctx.message.from.first_name +
                ', these are the German words for the english word <b>' + ctx.message.text + '</b>\n\n';
            var formatted_str =''
            meanings.forEach((meaning, index) => {
                formatted_str += (index + 1) + '. ' + meaning.text + '(' + meaning.pos + ')\n'
            })
            response += formatted_str + '\n <b>*Powered by Yandex</b>'
        
            ctx.replyWithHTML(response)
        })
        .catch((e) => {
            console.log(e)
            ctx.reply('Some error. Please try later')
        })
})

exports.handler = async function (event, context) {
    console.log("starting")
    console.log(event.body)
    await bot.handleUpdate(JSON.parse(event.body));
    return { statusCode: 200, body: '' };
}

const getMeaning = async (message) => {
    var german_equivalents = []
    const res = await axios.get('https://dictionary.yandex.net/api/v1/dicservice.json/lookup?key=' + process.env.YANDEX_KEY + '&lang=en-de&text=' + message)
    const meanings = res.data.def;
    console.log(meanings)
    for (const meaning of meanings) {
        for (const translation of meaning.tr) {
            console.log('pos=' + meaning.pos)
            console.log('text=' + translation.text)
            german_equivalents.push({
                "pos": meaning.pos,
                "text": translation.text
            })
        }
    }

    return german_equivalents
}