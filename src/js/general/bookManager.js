const { ipcRenderer } = require('electron');
const fs = require('fs');
const fse = require('fs-extra');
const Epub = require("epub2").EPub;
const path = require('path');

// Get store path, default is ...\AppData\Roaming\epub-reader\localStorage
const getStorePath = async () => await ipcRenderer.invoke('storePath')

const allowedExtensions = ['epub']

// Add and save epub book locally and extract metadata 
// If everythings gone fine it returns the updated books in json
const addEpubBook = async function (epubPath) {
	console.log(epubPath)
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



const isAllowedExtension = function(ext){
	return allowedExtensions.includes(ext) 
}

module.exports = {
	addEpubBook: addEpubBook,
	getBooks: getBooks,
}
