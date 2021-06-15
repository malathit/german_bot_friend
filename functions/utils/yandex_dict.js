const axios = require('axios');

async function get_meaning (word, lang_code, success_callback, error_callback) {
    var translations = []
    try {
        const response = await axios.get('https://dictionary.yandex.net/api/v1/dicservice.json/lookup?key=' 
            + process.env.YANDEX_KEY + '&lang=' + lang_code + '&text=' + word)
        const definitions = response.data.def;
        for (const definition of definitions) {
            for (const translation of definition.tr) {
                translations.push({
                    "pos": definition.pos,
                    "text": translation.text
                })
            }
        }
        success_callback(translations)
    } catch(err) {
        console.log(err)
        error_callback(err)
    }
}

module.exports = { get_meaning }