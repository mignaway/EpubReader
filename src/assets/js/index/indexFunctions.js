var Vibrant = require('node-vibrant')
const EPub = require("epub2").EPub;
const sleep = ms => new Promise(r => setTimeout(r, ms));

$(window).on('load', async function(){
    let books_json = await getBooksFromJson();
    await loadAll(books_json)
});


ipcRenderer.on('addBookConfirmed', async function(event,epubPath) {
    await addEpubBook(epubPath[0])
})

async function loadAll(books_json){
    await loadHeroSection(books_json)
    await loadBooksSection(books_json)
}

function loadBooksSection(books_json) {
    $('#section-book-preview').html('') // RESET BOOK PREVIEW SECTION

    var orderedBooks = books_json.slice(0, 6) // NEED TO BE SORTED BY "lastOpened"
    for(var i = 0; i <= 5;i++) {
        if (i < orderedBooks.length) {
            let editingClass = $('#edit-books-button').hasClass('currently-editing') ? 'currently-editing' : ''
            $('#section-book-preview').append(`
            <div class="book-box ${editingClass} not-empty" data-folderbookcode="${orderedBooks[i].folderBookCode}">
                <div class="book-box-image overflow-hidden w-100 h-100"><img src="epubs/${orderedBooks[i].folderBookCode}/${orderedBooks[i].coverPath}"></div>
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

async function loadHeroSection(books_json) {
    if(books_json.length > 0) {
        const [title, author, bookYear, language, folderBookCode, coverPath] = [books_json[0].title, books_json[0].author, books_json[0].bookYear, books_json[0].lang, books_json[0].folderBookCode, books_json[0].coverPath]
            
        const dominantRGBValue = await getDominantColor(__dirname + '/epubs/' + folderBookCode + '/' + coverPath)
        await $('#hero-section-content')
            .html(`
            <div id="hero-section-image-cover"><img src="${'epubs/' + folderBookCode + '/' + coverPath}"></div>
            <div id="hero-section-book-infos" class="flex-column">
              <h1 class="main-text text-color-white text-b">${title}</h1>
              <h2 class="main-text text-color-white">${author}</h2>
              <h3 class="main-text text-color-white op-5">${bookYear} - ${language}</h3>
              <button id="keep-reading-button" onmouseover="this.style.backgroundColor='rgba(${dominantRGBValue},0.5)'" onmouseout="this.style.backgroundColor='rgb(${dominantRGBValue})'" class="primary-button" style="background-color: rgb(${dominantRGBValue})">Keep reading</button>
            </div>
        `)
        $('#hero-section-image-background').css('background-image', 'linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.8) 100%), url(epubs/' + folderBookCode + '/' + coverPath);
    } else {
        $('#hero-section-content').html('<h2 class="main-text text-color-white">No preview available.</h2>')
        $('#hero-section-image-background').css({ 'background-image': 'none', 'background-color': 'rgb(20, 20, 20)'});
    }
    $('#hero-section-content').addClass('loaded')
}

async function addEpubBook(epubPath) { 
    await EPub.createAsync(epubPath,null,null)
    .then(async function(epub) {
        // console.log(epub.manifest);
        const data = epub.metadata
        const jsonData = await getBooksFromJson()
        let author = data.creator ? data.creator : 'undefined'
        const folderBookCode = data.title.replace(/[^a-z0-9\s]/gi, '').replaceAll(" ", "-").toLowerCase() + "-" + author.replaceAll(" ", "-").toLowerCase();
        const bookFolderPath = __dirname + '/epubs/' + folderBookCode
        var coverPath = epub.metadata.cover ? epub.manifest[epub.metadata.cover].href : '../../assets/images/undefined-cover.jpg'
        if (!fs.existsSync(bookFolderPath)){ // CHECK IF BOOK ALREADY EXISTS
            newBook = {
                "title": data.title,
                "author": author,
                "bookYear": data.date ? data.date.split('-')[0] + " Edition " : 'undefined',
                "lang": data.languege ? data.language.split('-')[0].toUpperCase() : 'undefined',
                "folderBookCode": folderBookCode,
                "coverPath": coverPath,
                "lastOpened": ""
            }
            jsonData.push(newBook)
            await fs.writeFileSync(__dirname + '/assets/json/books.json', JSON.stringify(jsonData))

            // ADD BOOK IMAGES
            await fs.mkdirSync(bookFolderPath) // CREATE FOLDER
            await fs.copyFileSync(epubPath, bookFolderPath + "/epub.epub");
            let imageList = epub.listImage()
            await asyncForEach(imageList, async (image) => {
                await epub.getImageAsync(image.id).then(function ([data, mimeType]) {
                    fse.outputFile(bookFolderPath + "/" + image.href, data, 'binary')
                });
            });

            // RELOAD ALL
            // await sleep(10) // sleep necessary to wait some time until all images are loaded
            await loadAll(jsonData) // reload sections
        } else {
            alert("Book already added!")
        }
    })
}

async function deleteEpubBook(folderBookCode){
    var data = getBooksFromJson() // GET ARRAY FROM JSON
    data.then(async function(arr) {
        var json = arr
        $(json).each((index) => {
            if (json[index].folderBookCode == folderBookCode) {
                json.splice(index, 1);
                return false;
            }
        })
        await fs.writeFileSync(__dirname + '/assets/json/books.json', JSON.stringify(json)) // UPDATE JSON
        await fs.rmSync(__dirname + '/epubs/' + folderBookCode, { recursive: true });
        loadAll(json) // RELOAD HOME PAGE SECTION
    })
    
    // $('.book-box[data-folderBookCode="' + folderBookCode + '"]').remove(); // REMOVE DIV WITH THAT folderBookCode
    // $('#edit-books-button').removeClass('currently-editing')
}

async function getBooksFromJson(){
    let raw = fs.readFileSync(__dirname + '/assets/json/books.json');
    return JSON.parse(raw)
}

function getDominantColor(imgPath) {
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

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}