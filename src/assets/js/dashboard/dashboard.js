var Vibrant = require('node-vibrant')
const EPub = require("epub2").EPub;

$(window).on('load', async function(){
    // Load books form jsonfile
    let books_json = await getBooksFromJson();
    await loadAll(books_json)
});

/**
 * Load/reload hero section and books list section
 * 
 * @param {JSON Object} books_json 
 * 
 */

async function loadAll(books_json){
    $('#hero-section-loading-animation').removeClass('loaded');
    await loadHeroSection(books_json,"last_read")
    await loadBooksSection(books_json,"last_read")
}

async function loadHeroSection(books_json, sortby) {
    if (books_json.length > 0) {
        books_json = orderBookModality(books_json,sortby);
        const [title, author, bookYear, language, folderBookCode, coverPath] = [books_json[0].title, 
                                                                                books_json[0].author ? books_json[0].author : 'Undefined Author', 
                                                                                books_json[0].bookYear ? books_json[0].bookYear : 'Undefined', 
                                                                                books_json[0].lang ? books_json[0].lang : 'Undefined Language', 
                                                                                books_json[0].folderBookCode, 
                                                                                books_json[0].coverPath]

        const dominantRGBValue = await getVibrantColorFromImage(__dirname + '/epubs/' + folderBookCode + '/' + coverPath)
        await $('#hero-section-content')
            .html(`
            <div id="hero-section-image-cover"><img src="${'epubs/' + folderBookCode + '/' + coverPath}"></div>
            <div id="hero-section-book-infos" class="flex-column">
              <h1 class="main-text text-color-white text-b">${title}</h1>
              <h2 class="main-text text-color-white">${author}</h2>
              <h3 class="main-text text-color-white op-5">${bookYear} Edition - ${language}</h3>
              <button id="keep-reading-button" onmouseover="this.style.backgroundColor='rgba(${dominantRGBValue},0.5)'" onmouseout="this.style.backgroundColor='rgb(${dominantRGBValue})'" class="primary-button" style="background-color: rgb(${dominantRGBValue})">Keep reading</button>
            </div>
        `)
        $('#hero-section-image-background').css('background-image', 'linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.8) 100%), url(epubs/' + folderBookCode + '/' + coverPath);
    } else {
        $('#hero-section-content').html('<h2 class="main-text text-color-white text-align-center">No preview available.<br>Add books by clicking the "+" button</h2>')
        $('#hero-section-image-background').css({ 'background-image': 'none', 'background-color': 'rgb(20, 20, 20)' });
    }
    $('#hero-section-loading-animation').addClass('loaded')
}

function loadBooksSection(books_json, sortby) {
    // Reset book preview section
    $('#section-book-preview').html('') 
    // var orderedBooks = books_json.slice(0, 6)

    var orderedBooks = orderBookModality(books_json, sortby);

    for(var i = 0; i <= 5;i++) {
        if (i < orderedBooks.length) {
            let editingClass = $('#edit-books-button').hasClass('currently-editing') ? 'currently-editing' : ''
            const author = orderedBooks[i].author ? orderedBooks[i].author : 'Undefined Author';
            const language = orderedBooks[i].lang ? orderedBooks[i].lang : 'Undefined Language';
            $('#section-book-preview').append(`
            <div class="book-box ${editingClass} not-empty" data-folderbookcode="${orderedBooks[i].folderBookCode}">
                <div class="book-box-informations overflow-hidden w-100 h-100 flex-column">
                    <h1 class="main-text text-color-white text-b">${orderedBooks[i].title}</h1>
                    <h2 class="main-text text-color-white">${author}</h2>
                    <h3 class="main-text text-color-white op-5">${language}</h3>
                </div>
                <div class="book-box-image overflow-hidden w-100 h-100">
                    <img src="epubs/${orderedBooks[i].folderBookCode}/${orderedBooks[i].coverPath}">
                </div>
                <div class="book-delete-icon cursor-pointer" onclick="deleteEpubBook($(this).parent().data('folderbookcode'))">
                    <svg class="cursor-pointer" width="10" height="10" viewBox="0 0 15 1" xmlns="http://www.w3.org/2000/svg">
                    <line x1="14.5" y1="0.5" x2="0.5" y2="0.499999" stroke-width="3" stroke-linecap="round" />
                    </svg>
                </div>
            </div>
            `)
        } else {
            $('#section-book-preview').append('<div class="book-box"></div>')
        }
    }
    $('#section-book-preview').append('<div class="book-box"><a id="see-all-books" href="" class="main-text text-b text-decoration-none">All Books -></a></div>')
}

// Event called after chose book in dialog

ipcRenderer.on('bookChosenSuccess', async function (event, epubPath) {
    await addEpubBook(epubPath)
})

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

async function addEpubBook(epubPath) { 
    await EPub.createAsync(epubPath,null,null)
    .then(async function(epub) {
        const jsonData = await getBooksFromJson();

        const data = epub.metadata;
        const author = data.creator ? data.creator : null;
        const folderBookCode = data.title.replace(/[^a-z0-9\s]/gi, '').replaceAll(" ", "-").toLowerCase() + "-" + author.replaceAll(" ", "-").toLowerCase();
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

            // Reload sections
            await loadAll(jsonData)
        } else {
            // TODO:
            // Build better custom alert
            alert("Book already in library!")
        }
    })
}

async function deleteEpubBook(folderBookCode){
    var data = getBooksFromJson()
    data.then(async function(arr) {
        var json = arr
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
        // Reload sections
        loadAll(json)
    })
}

// Read books.json file
async function getBooksFromJson(){
    var path = __dirname + '/assets/json/books.json';
    // check if books.json exists
    if (!fs.existsSync(path)) {
        // create json/books.json
        await fse.outputFile(path, '[]');
        // reset epubs folder
        if (fs.existsSync(__dirname + '/epubs')) await fse.emptyDirSync(__dirname + '/epubs');
        await fs.mkdirSync(__dirname + '/epubs');
    }
    // check if epubs folder exists
    if (!fs.existsSync(__dirname + '/epubs')){
        await fs.mkdirSync(__dirname + '/epubs');
    }

    return JSON.parse(fs.readFileSync(path))
}

// Get dominant (vibrant) color from image

function getVibrantColorFromImage(imgPath) {
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

function orderBookModality(books_json, sortby){
    var orderedBooks = null;
    if (sortby == 'last_read') {
        orderedBooks = books_json.sort((x, y) => {
            return new Date(x.lastTimeOpened) < new Date(y.lastTimeOpened) ? 1 : -1
        })
    }
    return orderedBooks.slice(0, 6);
}

// Because javascript has some problem iterating arrays this function will help us to do so

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}