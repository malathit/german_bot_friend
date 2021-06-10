const axios = require('axios');

async function get_meaning (word, lang_code) {
    var translations = []
    const res = await axios.get('https://dictionary.yandex.net/api/v1/dicservice.json/lookup?key=' 
        + process.env.YANDEX_KEY + '&lang=' + lang_code + '&text=' + word)
    const definitions = res.data.def;
    for (const definition of definitions) {
        for (const translation of definition.tr) {
            translations.push({
                "pos": definition.pos,
                "text": translation.text
            })
        }
    }
    return translations
}

module.exports = { get_meaning }