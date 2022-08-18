$(window).on('load', async function () {
    // Load books form jsonfile
    let books_json = await getBooksFromJson();
    let options = null;
    await loadBooks(books_json)
});

var sortingSettings = { "sortby": "last_read", "filter": "none" }

var loadBooks = async function (books_json_not_sorted){
    const books_json = await orderBookModality(books_json_not_sorted, sortingSettings);

    // reset book container before appending
    $('#book-section-grid').html('');
    
    const dominantRGBValue = await getVibrantColorFromImage(__dirname + '/epubs/' + books_json[0].folderBookCode + '/' + books_json[0].coverPath)
    if(books_json.length > 0){
        books_json.forEach((book) => {
            let editingClass = $('#edit-books-button').hasClass('currently-editing') ? 'currently-editing' : ''
            const author = book.author ?? 'Undefined Author';
            const language = book.lang ?? 'Undefined Language';
            const already_read = book.lastPageOpened ? 'none' : 'flex';

            $('#book-section-grid').append(`
            <div onclick="if(!$(this).hasClass('currently-editing')) window.location.href = 'book.html?code=${book.folderBookCode}'" class="book-box ${editingClass} not-empty" data-folderbookcode="${book.folderBookCode}">
                <div class="book-box-informations overflow-hidden w-100 h-100 flex-column">
                    <h1 class="main-text text-color-white text-b">${book.title}</h1>
                    <h2 class="main-text text-color-white">${author}</h2>
                    <h3 class="main-text text-color-white op-5">${language}</h3>
                </div>
                <div class="book-box-image overflow-hidden w-100 h-100">
                    <img src="epubs/${book.folderBookCode}/${book.coverPath}">
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
            `);
        });
    } else {
        $('#book-section-grid').html('<h2 class="no-book-text main-text text-align-center">No preview available.<br>Add books by clicking the "+" button</h2>');
    }
    $('#section-book-loading-animation').addClass('loaded');
    
}


ipcRenderer.on('bookChosenSuccess', async function (event, epubPath) {
    var response = await addEpubBook(epubPath);
    if (response != false) {
        $('#section-book-loading-animation').removeClass('loaded');
        await loadBooks(response);
    }
})

async function deleteEpubBookHandler(folderBookCode) {
    var json = await deleteEpubBook(folderBookCode);
    await loadBooks(json);
}