$(window).on('load', async function(){
	activeDropFeature()	
    // Load books form jsonfile
    let books_json = await window.bookConfig.getBooks();
    await loadAll(books_json)
});



var sortingSettings = { sortby: "last_read"}

var loadAll = async function (books_json){
    // console.log(books_json)
    sortingSettings.sortby = $('#section-book-current-sorting').data('sort');
    $('#hero-section-loading-animation').removeClass('loaded');
    const orderedBooks = await orderBookModality(books_json, sortingSettings)
    await loadHeroSection(orderedBooks)
    await loadBooksSection(orderedBooks.slice(0, 6))
}

async function loadHeroSection(books_json) {
    if (books_json.length > 0) {
        
        const [title, author, bookYear, language, folderBookCode, coverPath, bookOpened] = [books_json[0].title, 
                                                                                books_json[0].author ?? 'Undefined Author', 
                                                                                books_json[0].bookYear ?? 'Undefined', 
                                                                                books_json[0].lang ?? 'Undefined Language', 
                                                                                books_json[0].folderBookCode, 
                                                                                books_json[0].coverPath,
                                                                                books_json[0].lastPageOpened != null]
        
        const dominantRGBValue = await window.bookConfig.getVibrantColorFromImage(folderBookCode,coverPath)
        const bookCover = await window.bookConfig.ensureBookCoverExistsAndReturn(folderBookCode, coverPath)

        var keepReadingText = bookOpened ? 'Keep reading' : 'Start reading';
        $('#hero-section-content')
            .html(`
            <div id="hero-section-image-cover"><img src="${bookCover}"></div>
            <div id="hero-section-book-infos" class="flex-column">
              <h1 class="main-text text-color-white text-b">${title}</h1>
              <h2 class="main-text text-color-white">${author}</h2>
              <h3 class="main-text text-color-white op-5">${bookYear} Edition - ${language}</h3>
              <a href="book.html?code=${folderBookCode}" id="keep-reading-button" onmouseover="this.style.backgroundColor='rgba(${dominantRGBValue},0.5)'" onmouseout="this.style.backgroundColor='rgb(${dominantRGBValue})'" class="primary-button" style="background-color: rgb(${dominantRGBValue})">${keepReadingText}</a>
            </div>
        `)
        $('#hero-section-image-background').css('background-image', `linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.8) 100%), url(${bookCover}`);
    } else {
        $('#hero-section-content').html('<h2 class="main-text text-color-white text-align-center">No preview available.<br>Add books by clicking the "+" button</h2>')
        $('#hero-section-image-background').css({ 'background-image': 'none', 'background-color': 'rgb(20, 20, 20)' });
    }
    $('#hero-section-loading-animation').addClass('loaded')
}

async function loadBooksSection(books_json) {
    // Reset book preview section
    $('#section-book-preview').html('') 
    if (books_json.length > 0) {
        $('.circle-loading-logo').css('opacity', '1');
        const dominantRGBValue = await window.bookConfig.getVibrantColorFromImage(books_json[0].folderBookCode,books_json[0].coverPath)
        for(var i = 0; i <= 5;i++) {
            if (i < books_json.length) {
                let editingClass = $('#edit-books-button').hasClass('currently-editing') ? 'currently-editing' : ''
                const author = books_json[i].author ?? 'Undefined Author';
                const language = books_json[i].lang ?? 'Undefined Language';
                const already_read = books_json[i].lastPageOpened ? 'none' : 'flex';
                const bookCover = await window.bookConfig.ensureBookCoverExistsAndReturn(books_json[i].folderBookCode, books_json[i].coverPath)

                $('#section-book-preview').append(`
                <div onclick="if(!$(this).hasClass('currently-editing')) window.location.href = 'book.html?code=${books_json[i].folderBookCode}'" class="book-box ${editingClass} not-empty" data-folderbookcode="${books_json[i].folderBookCode}">
                    <div class="book-box-informations overflow-hidden w-100 h-100 flex-column" ${$('#section-book-show-information').hasClass('active') ? 'style="opacity: 1"' : ''}>
                        <h1 class="main-text text-color-white text-b">${books_json[i].title}</h1>
                        <h2 class="main-text text-color-white">${author}</h2>
                        <h3 class="main-text text-color-white op-5">${language}</h3>
                    </div>
                    <div class="book-box-image overflow-hidden w-100 h-100">
                        <img src="${bookCover}">
                    </div>
                    <div class="new-book-box" style="background-color: rgb(${dominantRGBValue}); display: ${already_read}">
                        <h1 class="main-text text-color-white text-b">NEW</h1>
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
    $('.circle-loading-logo').css('opacity', '0');
}

// Event called after chose book in dialog

window.appConfig.on('bookChosenSuccess', async function (event, epubPath) {
	await addEpubBookHandler(epubPath)
})

async function addEpubBookHandler(epubPath){
    var response = await window.bookConfig.addEpubBook(epubPath);
    if (response != false) await loadAll(response)
}
async function deleteEpubBookHandler(folderBookCode) {
    var json = await window.bookConfig.deleteEpubBook(folderBookCode);
    await loadAll(json);
}

// Order a json object by modality
async function orderBookModality(books_json, option) {

    var orderedBooks = null;
    switch (option.sortby) {
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
        default:
            return books_json;
    }
    return orderedBooks;
}


