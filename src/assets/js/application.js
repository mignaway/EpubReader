var Vibrant = require('node-vibrant')
const EPub = require("epub2").EPub;

/**
 * Disclaimer:
 * Sometimes epubs doesn't have all the book's information.
 * 
 * Book's code formatting [folderBookCode]: title-separated-by-dash-author-name
 * Book's directory folder path is epubs/ + folderBookCode
 * 
 * @param {String} epubPath 
 * 
 */

var addEpubBook = async function(epubPath) { 
    var response = await EPub.createAsync(epubPath,null,null)
    .then(async function(epub) {
        const jsonData = await getBooksFromJson();

        const data = epub.metadata;
        const author = data.creator ? data.creator : null;
        const author_folderBookCode = author ? author.replaceAll(" ", "-").toLowerCase() : 'undefined';
        const folderBookCode = data.title.replace(/[^a-z0-9\s]/gi, '').replaceAll(" ", "-").toLowerCase() + "-" + author_folderBookCode;
        const bookFolderPath = __dirname + '/epubs/' + folderBookCode;
        const coverPath = epub.metadata.cover ? epub.manifest[epub.metadata.cover].href : '../../assets/images/undefined-cover.jpg';

        // Check if book already exists
        if (!fs.existsSync(bookFolderPath)){ 
            newBook = {
                "title": data.title,
                "author": author,
                "bookYear": data.date ? data.date.split('-')[0] : null,
                "lang": data.languages ? data.language.split('-')[0].toUpperCase() : null,
                "folderBookCode": folderBookCode,
                "coverPath": coverPath,
                "lastTimeOpened": new Date()
            }
            jsonData.push(newBook)
            await fs.writeFileSync(__dirname + '/assets/json/books.json', JSON.stringify(jsonData))

            // Add book's images
            await fs.mkdirSync(bookFolderPath)
            await fs.copyFileSync(epubPath, bookFolderPath + "/epub.epub");
            let imageList = epub.listImage()
            await asyncForEach(imageList, async (image) => {
                await epub.getImageAsync(image.id).then(function ([data, mimeType]) {
                    fse.outputFile(bookFolderPath + "/" + image.href, data, 'binary')
                });
            });
            return jsonData;
        } else {
            displayAlert("Book already in library!","default");  
        }
        return false;
    })
    return response;
}

var deleteEpubBook = async function(folderBookCode) {
    var json = await getBooksFromJson()
    // Remove element from json data by folderBookCode key comparison
    $(json).each((index) => {
        if (json[index].folderBookCode == folderBookCode) {
            json.splice(index, 1);
            return false;
        }
    })
    // Rewrite/update json
    await fs.writeFileSync(__dirname + '/assets/json/books.json', JSON.stringify(json))
    // Remove recursively book's to remove folder
    await fs.rmSync(__dirname + '/epubs/' + folderBookCode, { recursive: true });
    // If list is empty then disable edit button
    if (json.length == 0) $('#edit-books-button').toggleClass('currently-editing')
    return json;
}

// Read books.json file
var getBooksFromJson = async function () {
    var path = __dirname + '/assets/json/books.json';
    // check if books.json exists
    if (!fs.existsSync(path)) {
        displayAlert("Initializing application...", "default");
        // create json/books.json
        await fse.outputFile(path, '[]');
        // reset epubs folder
        if (fs.existsSync(__dirname + '/epubs')) await fse.emptyDirSync(__dirname + '/epubs');
        await fs.mkdirSync(__dirname + '/epubs');
    }
    // check if epubs folder exists
    if (!fs.existsSync(__dirname + '/epubs')) {
        await fs.mkdirSync(__dirname + '/epubs');
    }

    return JSON.parse(fs.readFileSync(path))
}

// Order a json object by modality
var orderBookModality = async function(books_json, sortby) {
    // console.log(books_json, sortby);
    var orderedBooks = null;
    if (sortby == 'last_read') {
        orderedBooks = books_json.sort((x, y) => {
            return new Date(x.lastTimeOpened) < new Date(y.lastTimeOpened) ? 1 : -1
        })
    } else {
        return books_json;
    }
    return orderedBooks.slice(0, 6);
}