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
        
        const author = epub.metadata.creator ?? null;
        const author_folderBookCode = author?.replaceAll(" ", "-").replaceAll(".", "").toLowerCase() ?? 'undefined';
        const folderBookCode = epub.metadata.title.replace(/[^a-z0-9\s]/gi, '').replaceAll(" ", "-").replaceAll(".", "").toLowerCase() + "-" + author_folderBookCode;
        const bookFolderPath = __dirname + '/epubs/' + folderBookCode;
        const coverPath = epub.metadata.cover ? epub.manifest[epub.metadata.cover].href : '../../assets/images/undefined-cover.jpg';

        // Check if book already exists
        if (!fs.existsSync(bookFolderPath)){ 
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
            await fse.writeJsonSync(__dirname + '/assets/json/books.json', jsonData,{spaces: 4})

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
    await fse.writeJsonSync(__dirname + '/assets/json/books.json', json,{spaces: 4})
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
        // reset epubs folder and create if doesn't exists
        await fse.emptyDirSync(__dirname + '/epubs');

        displayAlert("Initialization completed!", "success");
    }

    return JSON.parse(fs.readFileSync(path))
}

var getUserSettingsFromJson = async function () {
    var path = __dirname + '/assets/json/user_settings.json';
    // check if books.json exists
    if (!fs.existsSync(path)) {
        // create books.json
        await fse.outputJsonSync(path, {"book": {"background_color_style": "default","font_size_percent": 100, "typeface": ""}}, {spaces: 4});
    }
    return JSON.parse(fs.readFileSync(path))
}

var localSaveUserSettings = async function (old_json) {
    await fse.writeJsonSync(__dirname + '/assets/json/user_settings.json', old_json, {spaces: 4})
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
    $(json).each((index) => {
        if (json[index].folderBookCode == folderBookCode) {
            json[index][key] = newValue;
        }
    })
    await fse.writeJsonSync(__dirname + '/assets/json/books.json', json, {spaces: 4})
}

var separateBooksByLetter = async function (books_json) {
    temp_ordered = {}
    for (const book of books_json) {
        var firstLetter = book.title.charAt(0).toUpperCase();
        if (!temp_ordered[firstLetter]) {
            temp_ordered[firstLetter] = [book]
        } else {
            temp_ordered[firstLetter].push(book);
        }
    }
    return temp_ordered
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
    
    $('#alert-text').on("webkitAnimationEnd", function () {
        $('#alert-text').removeClass("active");
    });
    $('#alert-text').addClass("active");
}

// Get dominant (vibrant) color from image

var getVibrantColorFromImage = async function (imgPath) {

    if (fs.existsSync(imgPath)) {
        var value = await Vibrant.from(imgPath).getPalette()
        return value.Vibrant.getRgb()
    } else {
        console.log("File doesn't exists")
    }
}