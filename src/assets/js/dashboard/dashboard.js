$(window).on('load', async function(){
    // Load books form jsonfile
    let books_json = await getBooksFromJson();
    await loadAll(books_json)
});

var sortingSettings = { "sortby": "last_read"}

/**
 * Load/reload hero section and books list section
 * 
 * @param {JSON Object} books_json 
 * 
 */

var loadAll = async function (books_json){
    sortingSettings['sortby'] = $('#section-book-current-sorting').data('sort');
    $('#hero-section-loading-animation').removeClass('loaded');
    const orderedBooks = await orderBookModality(books_json, sortingSettings)
    await loadHeroSection(orderedBooks, sortingSettings['sortby'])
    await loadBooksSection(orderedBooks, sortingSettings['sortby'])
}

async function loadHeroSection(books_json, sortby) {
    if (books_json.length > 0) {
        
        const [title, author, bookYear, language, folderBookCode, coverPath, bookOpened] = [books_json[0].title, 
                                                                                books_json[0].author ? books_json[0].author : 'Undefined Author', 
                                                                                books_json[0].bookYear ? books_json[0].bookYear : 'Undefined', 
                                                                                books_json[0].lang ? books_json[0].lang : 'Undefined Language', 
                                                                                books_json[0].folderBookCode, 
                                                                                books_json[0].coverPath,
                                                                                books_json[0].lastPageOpened != null]

        const dominantRGBValue = await getVibrantColorFromImage(__dirname + '/epubs/' + folderBookCode + '/' + coverPath)
        var keepReadingText = bookOpened ? 'Keep reading' : 'Start reading';
        await $('#hero-section-content')
            .html(`
            <div id="hero-section-image-cover"><img src="${'epubs/' + folderBookCode + '/' + coverPath}"></div>
            <div id="hero-section-book-infos" class="flex-column">
              <h1 class="main-text text-color-white text-b">${title}</h1>
              <h2 class="main-text text-color-white">${author}</h2>
              <h3 class="main-text text-color-white op-5">${bookYear} Edition - ${language}</h3>
              <a href="book.html?code=${folderBookCode}" id="keep-reading-button" onmouseover="this.style.backgroundColor='rgba(${dominantRGBValue},0.5)'" onmouseout="this.style.backgroundColor='rgb(${dominantRGBValue})'" class="primary-button" style="background-color: rgb(${dominantRGBValue})">${keepReadingText}</a>
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
    // 
    // 
    for(var i = 0; i <= 5;i++) {
        if (i < books_json.length) {
            let editingClass = $('#edit-books-button').hasClass('currently-editing') ? 'currently-editing' : ''
            const author = books_json[i].author ? books_json[i].author : 'Undefined Author';
            const language = books_json[i].lang ? books_json[i].lang : 'Undefined Language';
            $('#section-book-preview').append(`
            <div onclick="window.location.href = 'book.html?code=${books_json[i].folderBookCode}'" class="book-box ${editingClass} not-empty" data-folderbookcode="${books_json[i].folderBookCode}">
                <div class="book-box-informations overflow-hidden w-100 h-100 flex-column">
                    <h1 class="main-text text-color-white text-b">${books_json[i].title}</h1>
                    <h2 class="main-text text-color-white">${author}</h2>
                    <h3 class="main-text text-color-white op-5">${language}</h3>
                </div>
                <div class="book-box-image overflow-hidden w-100 h-100">
                    <img src="epubs/${books_json[i].folderBookCode}/${books_json[i].coverPath}">
                </div>
                <div class="book-delete-icon cursor-pointer" onclick="event.stopPropagation(); deleteEpubBookHandler($(this).parent().data('folderbookcode'));">
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
    $('#section-book-preview').append('<div class="book-box"><a id="see-all-books" href="library.html" class="main-text text-b text-decoration-none">All Books -></a></div>')
}

// Event called after chose book in dialog

ipcRenderer.on('bookChosenSuccess', async function (event, epubPath) {
    var response = await addEpubBook(epubPath);
    if (response != false) await loadAll(response)
})

async function deleteEpubBookHandler(folderBookCode) {
    var json = await deleteEpubBook(folderBookCode);
    await loadAll(json);
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

// --------------------------------------------------------------------------------------------------

