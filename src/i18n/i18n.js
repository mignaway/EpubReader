const i18next = require("i18next");
const enTranslations = require("./locales/en.json");
const ptBRTranslations = require("./locales/pt-BR.json");

i18next.init({
  lng: "en", // Default language
  debug: true,
  resources: {
    en: { translation: enTranslations },
    ptBR: { translation: ptBRTranslations },
  },
});

module.exports = i18next;