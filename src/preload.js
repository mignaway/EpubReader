const { app, contextBridge, ipcMain, ipcRenderer, shell, dialog } = require('electron');
const fs = require('fs');
const fse = require('fs-extra');
const Vibrant = require('node-vibrant')
const Epub = require("epub2").EPub;
const path = require('path');


const addEpubBook = async function (epubPath) {
    var response = await Epub.createAsync(epubPath, null, null)
        .then(async function (epub) {
            const jsonData = await getBooks();

            const author = epub.metadata.creator ?? null;
            const author_folderBookCode = author?.replaceAll(" ", "-").replaceAll(".", "").toLowerCase() ?? 'undefined';
            const folderBookCode = epub.metadata.title.replace(/[^a-z0-9\s]/gi, '').replaceAll(" ", "-").replaceAll(".", "").toLowerCase() + "-" + author_folderBookCode;
            const bookFolderPath = __dirname + '/epubs/' + folderBookCode;
            const coverPath = epub.metadata.cover ? epub.manifest[epub.metadata.cover].href : '../../assets/images/undefined-cover.jpg';

            // Check if book already exists
            if (!fs.existsSync(bookFolderPath)) {
                var newBook = {
                    "title": epub.metadata.title,
                    "author": author,
                    "bookYear": epub.metadata.date?.split('-')[0] ?? null,
                    "lang": epub.metadata.languages?.split('-')[0].toUpperCase() ?? null,
                    "folderBookCode": folderBookCode,
                    "coverPath": coverPath,
                    "lastTimeOpened": new Date(),
                    "lastPageOpened": null,
                    "savedPages": []
                }
                jsonData.push(newBook)
                fse.writeJsonSync(__dirname + '/assets/json/books.json', jsonData, { spaces: 4 })

                // Add book's files folder and epub
                fs.mkdirSync(bookFolderPath, { recursive: true })
                fs.copyFileSync(epubPath, bookFolderPath + "/epub.epub");
                // Adding only cover image
                if (epub.metadata.cover) await epub.getImageAsync(epub.metadata.cover).then(async function ([data, _]) {
                    await fse.outputFile(bookFolderPath + "/" + epub.manifest[epub.metadata.cover].href, data, 'binary')
                });
                return jsonData;
            } else {
                displayAlert("Book already in library!", "default");
            }
            return false;
        })
    return response;
}

const deleteEpubBook = async function (folderBookCode) {
    var json = await getBooks()
    // Remove element from json data by folderBookCode key comparison
    let filtered_json = json.filter((book) => { return book.folderBookCode !== folderBookCode })
    // Rewrite/update json
    await fse.writeJsonSync(__dirname + '/assets/json/books.json', filtered_json, { spaces: 4 })
    // Remove recursively book's to remove folder
    await fs.rmSync(__dirname + '/epubs/' + folderBookCode, { recursive: true, force: true });
    // If list is empty then disable edit button
    if (filtered_json.length == 0) document.getElementById('edit-books-button').classList.toggle('currently-editing')

    return filtered_json;
}

const getBooks = async function () {
    var bookJsonPath = __dirname + '/assets/json/books.json'
    // check if books.json exists
    if (!fs.existsSync(bookJsonPath)) {
        displayAlert("Initializing application...", "default");

        // create json/books.json
        await fse.outputFile(bookJsonPath, '[]');
        // reset epubs folder and create if doesn't exists
        await fse.emptyDirSync(__dirname + '/epubs');

        displayAlert("Initialization completed!", "success");
    }
    return JSON.parse(fs.readFileSync(bookJsonPath, 'utf8'))
}

const getUserSettings = async function () {
    var jsonPath = __dirname + '/assets/json/user_settings.json';
    // check if books.json exists
    if (!fs.existsSync(jsonPath)) {
        // create books.json
        await fse.outputJsonSync(jsonPath, {"book": {"background_color_style": "default","font_size_percent": 100, "typeface": ""}}, {spaces: 4});
    }
    return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
}

const saveUserSettings = async function (json) {
    if(json) await fse.writeJsonSync(__dirname + '/assets/json/user_settings.json', json, {spaces: 4})
}

const searchBook = async function (json, folderBookCode) {
    var array = null;
    for (let i = 0; i < json.length; i++) {
        if(json[i].folderBookCode == folderBookCode){
            array = json[i]
            break;
        }
    }
    return array;
}

const changeBookValue = async function (json, folderBookCode, key, newValue) {
    for (let i = 0; i < json.length; i++) {
        if (json[i].folderBookCode == folderBookCode) {
            json[i][key] = newValue
            break;
        }
    }
    await fse.writeJsonSync(__dirname + '/assets/json/books.json', json, { spaces: 4 })
}

const getVibrantColorFromImage = async function (folderBookCode, coverPath) {
    const imgPath = await ensureBookCoverExistsAndReturn(folderBookCode, coverPath)
    if (fs.existsSync(path.join(__dirname, imgPath))) {
        var value = await Vibrant.from(path.join(__dirname, imgPath)).getPalette()
        return value.Vibrant.getRgb()
    } else {
        console.log("Image path not found, the vibrant color may not be retrieved.")
    }
}

const ensureBookCoverExistsAndReturn = async function (folderBookCode, coverPath) {
    const imgPath = `epubs/${folderBookCode}/${coverPath}`
    const coverPathExists = fs.existsSync(path.join(__dirname, imgPath))
    return coverPathExists ? imgPath : 'assets/images/undefined-cover.jpg'
}

const displayAlert = function (message,type) {
    let elem = document.querySelector('#alert-text');
    elem.innerHTML = message
    elem.classList.add(`alert-${type}`)
    elem.addEventListener("webkitAnimationEnd", function () {
        elem.classList.remove(`alert-${type}`)
    });
    elem.classList.add('active')
}



contextBridge.exposeInMainWorld('bookConfig', {
    addEpubBook: async (epubPath) => await addEpubBook(epubPath),
    deleteEpubBook: async (folderBookCode) => await deleteEpubBook(folderBookCode),
    getBooks: async () => getBooks(),
    getUserSettings: async () => await getUserSettings(),
    saveUserSettings: async (json) => await saveUserSettings(json),
    searchBook: async (json, folderBookCode) => await searchBook(json, folderBookCode),
    changeBookValue: async (json, folderBookCode, key, newValue) => await changeBookValue(json, folderBookCode, key, newValue),
    getVibrantColorFromImage: async (folderBookCode,imagePath) => await getVibrantColorFromImage(folderBookCode,imagePath),
    ensureBookCoverExistsAndReturn: async (folderBookCode, coverPath) => await ensureBookCoverExistsAndReturn(folderBookCode, coverPath)
});
contextBridge.exposeInMainWorld('appConfig', {
    appVersion: () => ipcRenderer.invoke('appVersion'),
    storePath: () => ipcRenderer.invoke('storePath'),
    dirname: () => __dirname,
    on(eventName, callback) {
        ipcRenderer.on(eventName, callback)
    },
    send: (channel,data) => ipcRenderer.send(channel, data),
    async invoke(eventName, ...params) {
        return await ipcRenderer.invoke(eventName, ...params)
    },
});