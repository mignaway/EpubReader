// Get the language from localStorage; "en" is the default language
const language = localStorage.getItem("language") || "en";
const languageMenu = document.querySelector("#language-menu-open > h1")
const languagesObject = {
  "en": "EN",
  "ptBR": "PT-BR"
};

const applyTranslations = () => {
  // Elements with visible text
  document.querySelectorAll(" [data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.innerText = window.i18n.t(key);
  });

  // Elements with placeholder text
  document.querySelectorAll(" [data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    el.placeholder = window.i18n.t(key);
  });

  // Elements with text in value
  document.querySelectorAll(" [data-i18n-value]").forEach((el) => {
    const key = el.getAttribute("data-i18n-value");
    el.value = window.i18n.t(key);
  });
};

function defineCurrentLanguage(languageValue) {
  localStorage.setItem("language", languageValue);
  // selectLanguage.value = languageValue;
  languageMenu.textContent = languagesObject[languageValue];
  window.i18n.changeLanguage(languageValue, () => applyTranslations());
}

defineCurrentLanguage(language);
