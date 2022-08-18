var Vibrant = require('node-vibrant')
const EPub = require("epub2").EPub;

/**
 * Disclaimer:
 * Sometimes epubs doesn't have all the book's information.
 * 
 * Book's code formatting [folderBookCode]: title-separated-by-dash-plus-author-name
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
        
        const author = data.creator ?? null;
        const author_folderBookCode = author?.replaceAll(" ", "-").replaceAll(".", "").toLowerCase() ?? 'undefined';
        const folderBookCode = data.title.replace(/[^a-z0-9\s]/gi, '').replaceAll(" ", "-").replaceAll(".", "").toLowerCase() + "-" + author_folderBookCode;
        const bookFolderPath = __dirname + '/epubs/' + folderBookCode;
        const coverPath = epub.metadata.cover ? epub.manifest[epub.metadata.cover].href : '../../assets/images/undefined-cover.jpg';

        // Check if book already exists
        if (!fs.existsSync(bookFolderPath)){ 
            var newBook = {
                "title": data.title,
                "author": author,
                "bookYear": data.date?.split('-')[0] ?? null,
                "lang": data.languages?.split('-')[0].toUpperCase() ?? null,
                "folderBookCode": folderBookCode,
                "coverPath": coverPath,
                "lastTimeOpened": new Date(),
                "lastPageOpened": null,
                "savedPages": []
            }
            jsonData.push(newBook)
            await fs.writeFileSync(__dirname + '/assets/json/books.json', JSON.stringify(jsonData, null, 4))

            // Add book's files folder and epub
            await fs.mkdirSync(bookFolderPath)
            await fs.copyFileSync(epubPath, bookFolderPath + "/epub.epub");
            // Adding only cover image
            if (epub.metadata.cover) await epub.getImageAsync(epub.metadata.cover).then(async function ([data, mimeType]) {
                await fse.outputFile(bookFolderPath + "/" + epub.manifest[epub.metadata.cover].href, data, 'binary')
            });
            return jsonData;
        } else {
            displayAlert("Book already in library!","default");  
        }
        return false;
    })
    return response;
}


// Delete epub book by book code and update local file

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
    await fs.writeFileSync(__dirname + '/assets/json/books.json', JSON.stringify(json,null,4))
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

var getUserSettingsFromJson = async function () {
    var path = __dirname + '/assets/json/user_settings.json';
    // // check if books.json exists
    if (!fs.existsSync(path)) {
    //     // create json/books.json
        await fse.outputFile(path, '{"book": {"background_color_style": "default","font_size_percent": 100}} ');
    }

    return JSON.parse(fs.readFileSync(path))
}

var localSaveUserSettings = async function (old_json) {
    await fs.writeFileSync(__dirname + '/assets/json/user_settings.json', JSON.stringify(old_json, null, 4))
}

// Order a json object by modality
var orderBookModality = async function(books_json, option) {
    var sortby = option['sortby'];
    // console.log(books_json, sortby);
    var orderedBooks = null;
    switch(sortby) {
        case 'last_read':
            orderedBooks = books_json.sort((x, y) => {
                return new Date(x.lastTimeOpened) < new Date(y.lastTimeOpened) ? 1 : -1
            });
            break;
        case 'alphabetically':
            orderedBooks = books_json.sort((x, y) => {
                if (x.title === y.title) return 0; // theoretically impossible
                return x.title > y.title ? 1 : -1
            });
            break;
        default:
            return books_json;
    }
    return orderedBooks.slice(0, 6);
}

var searchBookInJson = async function(json, folderBookCode) {
    var array = null;
    $(json).each((index) => {
        if (json[index].folderBookCode == folderBookCode) {
            array = json[index];
        }
    })
    return array;
}
var changeValueInJsonBook = async function (json, folderBookCode, key, newValue) {
    var array = null;
    $(json).each((index) => {
        if (json[index].folderBookCode == folderBookCode) {
            json[index][key] = newValue;
        }
    })
    await fs.writeFileSync(__dirname + '/assets/json/books.json', JSON.stringify(json, null, 4))
}

// Because javascript has some problem iterating arrays this function will help us to do so

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

/**
 * Displays alert with a message on dashboard page
 * 
 * @param {String} Messaage
 * @param {String} Box_Color 
 */
var displayAlert = function (message, type) {
    $('#alert-text').text(message);
    $('#alert-text').addClass('alert-' + type);
    var container = $('#alert-container');
    $('#alert-text').on("webkitAnimationEnd", function () {
        $('#alert-text').removeClass("active");
    });
    $('#alert-text').addClass("active");
}

// Get dominant (vibrant) color from image

var getVibrantColorFromImage = function (imgPath) {
    var finalVibrantColor;
    if (fs.existsSync(imgPath)) {
        return Vibrant.from(imgPath).getPalette()
            .then(value => {
                return value.Vibrant.getRgb()
            })
    } else {
        console.log("File doesn't exists")
    }
}