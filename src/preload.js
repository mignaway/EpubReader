const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const fse = require('fs-extra');
const Vibrant = require('node-vibrant');
const Epub = require("epub2").EPub;
const path = require('path');

// Define allowed extensions for books
const allowedExtensions = ['epub'];

/**
 * Get the store path.
 * Default store path is ...\AppData\Roaming\epub-reader\localStorage.
 * @returns {Promise<string>} The store path.
 */
const getStorePath = async () => await ipcRenderer.invoke('storePath');

/**
 * Add and save an EPUB book locally and extract metadata.
 * If everything goes fine, it returns the updated books in JSON.
 * @param {string} epubPath - The path to the EPUB file.
 * @returns {Promise<Array>} The updated books in JSON.
 */
const addEpubBook = async function (epubPath) {
    var response = await Epub.createAsync(epubPath, null, null)
        .then(async function (epub) {

            // Get the current book data for updating it later
            const jsonData = await getBooks();

            let storePath = await getStorePath();

            const title = epub.metadata.title ?? 'undefined';
            const author = epub.metadata.creator ?? null;

            // Generate folder name using title and author
            const bookFolderAuthorName = author?.replaceAll(" ", "-").replaceAll(".", "").toLowerCase() ?? 'undefined';
            const bookFolderName = epub.metadata.title.replace(/[^a-z0-9\s]/gi, '').replaceAll(" ", "-").replaceAll(".", "").toLowerCase() + "-" + bookFolderAuthorName;
            const bookFolderPath = path.join(storePath, 'epubs', bookFolderName);

            const coverPath = epub.manifest['cover']?.href ?? null;

            // Check if the book already exists
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
                };
                // Update the virtual book JSON data
                jsonData.push(newBook);
                // Update the local book JSON
                fse.writeJsonSync(path.join(storePath, 'assets', 'json', 'books.json'), jsonData, { spaces: 4 });

                // Create the folder and move the EPUB file there
                fs.mkdirSync(bookFolderPath, { recursive: true });
                fs.copyFileSync(epubPath, path.join(bookFolderPath, "epub.epub"));

                // Save the cover image locally
                if (epub.metadata.cover) {
                    await epub.getImageAsync('cover').then(async function ([data, _]) {
                        await fse.outputFile(path.join(bookFolderPath, epub.manifest['cover'].href), data, 'binary');
                    }).catch((e) => { console.log("Error while trying to retrieve cover from book!", e); });
                }
                return jsonData;
            } else {
                displayAlert("Book already in library!", "default");
            }
            return false;
        });
    return response;
};

/**
 * Delete an EPUB book.
 * @param {string} bookFolderName - The folder name of the book to be deleted.
 * @returns {Promise<Array>} The updated books in JSON.
 */
const deleteEpubBook = async function (bookFolderName) {
	var response = await getBooks().then(async function (booksData) {
		var bookToRemove = await searchBook(booksData, bookFolderName);
		if (bookToRemove) {
			var bookIndex = booksData.indexOf(bookToRemove);
			// Remove it from list and update the data
			booksData.splice(bookIndex, 1);
			await fse.writeJson(path.join(await getStorePath(), 'assets', 'json', 'books.json'), booksData, { spaces: 4 });
			await fse.remove(path.join(await getStorePath(), 'epubs', bookFolderName));
			return booksData;
		}
	});
	return response;
};

/**
 * Get the books from the JSON data.
 * @returns {Promise<Array>} The books in JSON.
 */
const getBooks = async function () {
    const bookJsonPath = path.join(await getStorePath(), 'assets', 'json', 'books.json');
    if (!fs.existsSync(bookJsonPath)) {
		// If JSON doesn't exists create it
        await fse.outputJson(bookJsonPath, [], { spaces: 4 });
    }
    return JSON.parse(fs.readFileSync(bookJsonPath, 'utf-8'));
};

/**
 * Get user settings from the JSON file.
 * @returns {Promise<Object>} The user settings.
 */
const getUserSettings = async function () {
    let storePath = await getStorePath();
    var userSettingsJsonPath = path.join(storePath, 'assets', 'json', 'user_settings.json');
    if (!fs.existsSync(userSettingsJsonPath)) {
        // Create the user settings JSON file with default settings
        const userDefaultSettings = {
            book: {
                background_color_style: 'default',
                font_size_percent: 100,
                typeface: ''
            }
        };
        await fse.outputJson(userSettingsJsonPath, userDefaultSettings, { spaces: 4 });
    }
    return JSON.parse(fs.readFileSync(userSettingsJsonPath, 'utf-8'));
};

/**
 * Save user settings to the JSON file.
 * @param {Object} userSettings - The user settings to be saved.
 */
const saveUserSettings = async function (userSettings) {
    let storePath = await getStorePath();
    const jsonPath = path.join(storePath, 'assets', 'json', 'user_settings.json');
    await fse.writeJson(jsonPath, userSettings, { spaces: 4 });
};

/**
 * Search for a book in the JSON data by bookFolderName.
 * @param {Array} bookData - The books in JSON data.
 * @param {string} targetFolderName - The folder name of the book to search for.
 * @returns {Object|null} The book object if found, otherwise null.
 */
const searchBook = async function (bookData, targetFolderName) {
    return bookData.find(book => book.bookFolderName === targetFolderName) || null;
};

/**
 * Change the value of a book in the JSON data.
 * @param {Array} bookData - The books in JSON data.
 * @param {string} targetFolderName - The folder name of the book.
 * @param {string} propertyKey - The key of the value to be changed.
 * @param {any} newPropertyValue - The new value.
 */
const changeBookValue = async function (bookData, targetFolderName, propertyKey, newPropertyValue) {
    const book = bookData.find(book => book.bookFolderName === targetFolderName);
    if (book) {
        book[propertyKey] = newPropertyValue;
    }
    let storePath = await getStorePath();
    const jsonPath = path.join(storePath, 'assets', 'json', 'books.json');
    await fse.writeJson(jsonPath, bookData, { spaces: 4 });
};

/**
 * Get the vibrant color from the book cover image.
 * @param {string} bookFolderName - The folder name of the book.
 * @param {string} coverPath - The path to the book cover image.
 * @returns {Array|null} The vibrant color as an RGB array if found, otherwise null.
 */
const getVibrantColorFromImage = async function (bookFolderName, bookCoverPath) {
    const imgPath = await ensureBookCoverExistsAndReturn(bookFolderName, bookCoverPath);
    if (fs.existsSync(imgPath)) {
        const palette = await Vibrant.from(imgPath).getPalette();
        const vibrantColorRGB = palette.Vibrant.getRgb();
        return vibrantColorRGB;
    } else {
        console.log("Image path not found, the vibrant color may not be retrieved.");
        return null;
    }
};

/**
 * Ensure the book cover image exists and return its path.
 * @param {string} bookFolderName - The folder name of the book.
 * @param {string} coverPath - The path to the book cover image.
 * @returns {string} The path to the book cover image.
 */
const ensureBookCoverExistsAndReturn = async function (bookFolderName, bookCoverPath) {
    const defaultCoverPath = '../assets/images/undefined-cover.jpg';
    if (!bookCoverPath) {
        return defaultCoverPath;
    }
    let storePath = await getStorePath();
    const coverImagePath = path.posix.join(storePath, 'epubs', bookFolderName, bookCoverPath);
    return fs.existsSync(coverImagePath) ? coverImagePath : defaultCoverPath;
};

/**
 * Display an alert message.
 * @param {string} message - The message to display.
 * @param {string} type - The type of the alert (e.g., "default", "success", "error").
 */
const displayAlert = function (message, type) {
    let elem = document.querySelector('#alert-text');
    elem.innerHTML = message;
    elem.classList.add(`alert-${type}`);
    elem.addEventListener("animationend", function () {
        elem.classList.remove("active");
        elem.classList.remove(`alert-${type}`);
    });
    elem.classList.add('active');
};

/**
 * Check if the extension is allowed.
 * @param {string} ext - The extension to check.
 * @returns {boolean} True if the extension is allowed, otherwise false.
 */
const isAllowedExtension = function (ext) {
    return allowedExtensions.includes(ext);
};

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
