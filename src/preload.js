const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const fse = require('fs-extra');
const Vibrant = require('node-vibrant')
const Epub = require("epub2").EPub;
const path = require('path');

const allowedExtensions = ['epub']

// Get store path, default is ...\AppData\Roaming\epub-reader\localStorage
const getStorePath = async () => await ipcRenderer.invoke('storePath')


// Add and save epub book locally and extract metadata 
// If everythings gone fine it returns the updated books in json
const addEpubBook = async function (epubPath) {
    var response = await Epub.createAsync(epubPath, null, null)
        .then(async function (epub) {

			// Getting jsonData to update it 
            const jsonData = await getBooks();

            let storePath = await getStorePath()
			
			const title = epub.metadata.title ?? 'undefined'; 
            const author = epub.metadata.creator ?? null;

			// Folder name is title + author in snake case
            const bookFolderAuthorName = author?.replaceAll(" ", "-").replaceAll(".", "").toLowerCase() ?? 'undefined';
            const bookFolderName = epub.metadata.title.replace(/[^a-z0-9\s]/gi, '').replaceAll(" ", "-").replaceAll(".", "").toLowerCase() + "-" + bookFolderAuthorName;

            const bookFolderPath = storePath + '/epubs/' + bookFolderName;
			console.log(epub.manifest)
			console.log(epub.metadata)
            const coverPath = epub.manifest['cover']?.href ?? null;
			
            // Check if book already exists
            if (!fs.existsSync(bookFolderPath)) {
                var newBook = {
                    "title": title,
                    "author": author,
                    "bookYear": epub.metadata.date?.split('-')[0] ?? null,
                    "lang": epub.metadata.language?.split('-')[0].toUpperCase() ?? null,
                    "bookFolderName": bookFolderName,
                    "coverPath": coverPath,
                    "lastTimeOpened": new Date(),
                    "lastPageOpened": null,
                    "savedPages": []
                }
				// update the virtual book json data
                jsonData.push(newBook)
				// update the local book json
                fse.writeJsonSync(storePath + '/assets/json/books.json', jsonData, { spaces: 4 })

                // Create folder and move there the epub file
                fs.mkdirSync(bookFolderPath, { recursive: true })
                fs.copyFileSync(epubPath, bookFolderPath + "/epub.epub");


                // Saving locally the cover image
                if (epub.metadata.cover) await epub.getImageAsync('cover').then(async function ([data, _]) {
                    await fse.outputFile(path.join(bookFolderPath,epub.manifest['cover'].href), data, 'binary')
				}).catch((e) => { console.log("Error while trying to retrieve cover from book!", e) });
                return jsonData;
            } else {
                displayAlert("Book already in library!", "default");
            }
            return false;
        })
    return response;
}

const deleteEpubBook = async function (bookFolderName) {
    let json = await getBooks()
    let storePath = await getStorePath()
    // Remove element from json data by bookFolderName key comparison
    let filtered_json = json.filter((book) => { return book.bookFolderName !== bookFolderName })
    // Rewrite/update json
    await fse.writeJsonSync(storePath + '/assets/json/books.json', filtered_json, { spaces: 4 })
    // Remove recursively book's to remove folder
    await fs.rmSync(storePath + '/epubs/' + bookFolderName, { recursive: true, force: true });
    // If list is empty then disable edit button
    if (filtered_json.length == 0) document.getElementById('edit-books-button').classList.toggle('currently-editing')

    return filtered_json;
}

const getBooks = async function () {
    let storePath = await getStorePath()
    var bookJsonPath = storePath + '/assets/json/books.json'
    // check if books.json exists
    if (!fs.existsSync(bookJsonPath)) {
        displayAlert("Initializing application...", "default");

        // create json/books.json
        await fse.outputFile(bookJsonPath, '[]');
        // reset epubs folder and create if doesn't exists
        await fse.emptyDirSync(storePath + '/epubs');

        displayAlert("Initialization completed!", "success");
    }
    return JSON.parse(fs.readFileSync(bookJsonPath, 'utf8'))
}

const getUserSettings = async function () {
    let storePath = await getStorePath()
    var jsonPath = storePath + '/assets/json/user_settings.json';
    // check if books.json exists
    if (!fs.existsSync(jsonPath)) {
        // create books.json
        await fse.outputJsonSync(jsonPath, {"book": {"background_color_style": "default","font_size_percent": 100, "typeface": ""}}, {spaces: 4});
    }
    return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
}

const saveUserSettings = async function (json) {
    let storePath = await getStorePath()
    if(json) await fse.writeJsonSync(storePath + '/assets/json/user_settings.json', json, {spaces: 4})
}

const searchBook = async function (json, bookFolderName) {
    var array = null;
    for (let i = 0; i < json.length; i++) {
        if(json[i].bookFolderName == bookFolderName){
            array = json[i]
            break;
        }
    }
    return array;
}

const changeBookValue = async function (json, bookFolderName, key, newValue) {
    for (let i = 0; i < json.length; i++) {
        if (json[i].bookFolderName == bookFolderName) {
            json[i][key] = newValue
            break;
        }
    }
    let storePath = await getStorePath()
    await fse.writeJsonSync(storePath + '/assets/json/books.json', json, { spaces: 4 })
}

const getVibrantColorFromImage = async function (bookFolderName, coverPath) {
    const imgPath = await ensureBookCoverExistsAndReturn(bookFolderName, coverPath)
    if (fs.existsSync(imgPath)) {
        var value = await Vibrant.from(imgPath).getPalette()
        return value.Vibrant.getRgb()
    } else {
        console.log("Image path not found, the vibrant color may not be retrieved.")
		return null
    }
}

const ensureBookCoverExistsAndReturn = async function (bookFolderName, coverPath) {
	let defaultCoverPath = '../assets/images/undefined-cover.jpg'
	if (coverPath === null) {
		return defaultCoverPath ;
	}
    let storePath = await getStorePath()
    const imgPath = path.posix.join(storePath, `/epubs/${bookFolderName}/${coverPath}`) 
    const coverPathExists = fs.existsSync(imgPath)
    return coverPathExists ? imgPath : defaultCoverPath 
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

const isAllowedExtension = function(ext){
	return allowedExtensions.includes(ext) 
}



contextBridge.exposeInMainWorld('bookConfig', {
    addEpubBook: async (epubPath) => await addEpubBook(epubPath),
    deleteEpubBook: async (bookFolderName) => await deleteEpubBook(bookFolderName),
    getBooks: async () => getBooks(),
    getUserSettings: async () => await getUserSettings(),
    saveUserSettings: async (json) => await saveUserSettings(json),
    searchBook: async (json, bookFolderName) => await searchBook(json, bookFolderName),
    changeBookValue: async (json, bookFolderName, key, newValue) => await changeBookValue(json, bookFolderName, key, newValue),
    getVibrantColorFromImage: async (bookFolderName,imagePath) => await getVibrantColorFromImage(bookFolderName,imagePath),
    ensureBookCoverExistsAndReturn: async (bookFolderName, coverPath) => await ensureBookCoverExistsAndReturn(bookFolderName, coverPath),
	isAllowedExtension: (ext) => isAllowedExtension(ext)
});
contextBridge.exposeInMainWorld('appConfig', {
    appVersion: () => ipcRenderer.invoke('appVersion'),
    dirname: async () => await getStorePath(),
	displayAlert: (content,type) => displayAlert(content,type),
    on(eventName, callback) {
        ipcRenderer.on(eventName, callback)
    },
    send: (channel,data) => ipcRenderer.send(channel, data),
    async invoke(eventName, ...params) {
        return await ipcRenderer.invoke(eventName, ...params)
    },
});
