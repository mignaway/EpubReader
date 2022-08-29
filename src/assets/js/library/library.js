$(window).on('load', async function () {
    // Load books form jsonfile
    books_json = await getBooksFromJson();
    await loadBooks(books_json)
});

var sortingSettings = { sortby: "last_read"}

// it can assume the form of an array or dictionary
var books_json;
var dominantRGBValue = null;

var loadBooks = async function (books_json_not_sorted){
    // final book to return
    var final_book = null;

    // if sorted normally (not separator) it must accept only array and return array
    // if sorted with a separator it can also accept dictionary and return dict
    var ordered_books = books_json = await orderBookModality(books_json_not_sorted, sortingSettings);

    var isSearchingSomething = $('#search-bar-input').val().trim().length > 0;

    // if searching something then filter by search
    // if array given it return array, same for dict
    final_book = isSearchingSomething ? await filterBooksByTitle(ordered_books, $('#search-bar-input').val()) : ordered_books

    // start loading animation
    $('#book-loading-logo').css('opacity', '1');

    if (final_book.length > 0) {
        dominantRGBValue = await getVibrantColorFromImage(__dirname + '/epubs/' + final_book[0].folderBookCode + '/' + final_book[0].coverPath)
        await loadBooksAction(final_book, dominantRGBValue);
    } else if (Object.keys(final_book).length) {
        dominantRGBValue = await getVibrantColorFromImage(__dirname + '/epubs/' + final_book[Object.keys(final_book)[0]][0].folderBookCode + '/' + final_book[Object.keys(final_book)[0]][0].coverPath)
        await loadBooksAction(final_book, dominantRGBValue);
    } else {
        $('#book-loading-logo').css('opacity', '0');
        $('#book-section-grid').html('<h2 class="no-book-text main-text text-align-center">No preview available.<br>Add books by clicking the "+" button</h2>')
    }
}

async function loadBooksAction(ordered_books, dominantRGBValue) {
    $('#book-section-grid').html('');
    if (ordered_books.length > 0 || Object.keys(ordered_books).length){
        if(sortingSettings.sortby == "last_read"){
            $('#book-section-grid').addClass('row-style')
            $('#book-section-grid').removeClass('column-style')
            ordered_books.forEach((book) => {
                let editingClass = $('#edit-books-button').hasClass('currently-editing') ? 'currently-editing' : ''
                const author = book.author ?? 'Undefined Author';
                const language = book.lang ?? 'Undefined Language';
                const already_read = book.lastPageOpened ? 'none' : 'flex';
    
                $('#book-section-grid').append(`
                <div onclick="if(!$(this).hasClass('currently-editing')) window.location.href = 'book.html?code=${book.folderBookCode}'" class="book-box ${editingClass} not-empty" data-folderbookcode="${book.folderBookCode}">
                    <div class="book-box-informations overflow-hidden w-100 h-100 flex-column" ${$('#section-book-show-information').hasClass('active') ? 'style="opacity: 1"' : ''}>
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
            $('#book-section-grid').addClass('column-style')
            $('#book-section-grid').removeClass('row-style')
            for(const separator_letter of Object.keys(ordered_books)){
                book_final_html = ''
                book_final_html += '<div class="flex-column flex-1" style="row-gap: 20px;">'
                book_final_html += `<div class="flex-column" style="gap: 5px;"><h1 class="main-text text-sb">${separator_letter}</h1><div class="horizontal-divider-05 bg-black" style="opacity: .1"></div></div>`
                book_final_html += '<div class="flex-row" style="row-gap: 40px;column-gap: 40px;">'


                for (const book of ordered_books[separator_letter]){

                    let editingClass = $('#edit-books-button').hasClass('currently-editing') ? 'currently-editing' : ''
                    const author = book.author ?? 'Undefined Author';
                    const language = book.lang ?? 'Undefined Language';
                    const already_read = book.lastPageOpened ? 'none' : 'flex';

                    book_final_html += `
                    <div onclick="if(!$(this).hasClass('currently-editing')) window.location.href = 'book.html?code=${book.folderBookCode}'" class="book-box ${editingClass} not-empty" data-folderbookcode="${book.folderBookCode}">
                        <div class="book-box-informations overflow-hidden w-100 h-100 flex-column" ${$('#section-book-show-information').hasClass('active') ? 'style="opacity: 1"' : ''}>
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
                    `;
                }
                book_final_html += '</div></div>'
                $('#book-section-grid').append(book_final_html)
            }
        }
    } else {
        $('#book-section-grid').html('<h2 class="no-book-text main-text text-align-center">No books found.<br>You may try remove the search</h2>');
    }
    $('#book-loading-logo').css('opacity', '0');
}

var searchTimeout = null;
async function handleSearchBarChange(newText) {
    newText = newText.trim()
    if (newText.length > 0) {
        $('#book-loading-logo').css('opacity','1');
        var filtered_books = await filterBooksByTitle(books_json, newText)

        searchTimeout = setTimeout(async function () {
            await loadBooksAction(filtered_books, dominantRGBValue)
        }, 300);
        
    } else {
        await loadBooks(books_json)
    }
}

async function filterBooksByTitle(json,title){
    if (json.constructor == Object) {
        var temp_json = {}
        // CASE IS DICT 
        Object.entries(json).forEach(([key, value]) => {
            var books_filtered = value.filter(book => book.title.toLowerCase().includes(title.toLowerCase()))
            if(books_filtered.length > 0) temp_json[key] = books_filtered
        })
        console.log(temp_json)
        return temp_json
    } else {
        // CASE IS ARRAY
        return json.filter(book => book.title.toLowerCase().includes(title.toLowerCase()))
    }
}

ipcRenderer.on('bookChosenSuccess', async function (event, epubPath) {
    var response = await addEpubBook(epubPath);
    if (response) {
        $('#section-book-loading-animation').removeClass('loaded');
        await loadBooks(response);
    }
})

async function deleteEpubBookHandler(folderBookCode) {
    var json = await deleteEpubBook(folderBookCode);
    await loadBooks(json);
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
            // If not already separated by letter then do it
            var books_json_separated = books_json.constructor == Object ? books_json : await separateBooksByLetter(books_json)
            // Order alphabetically ascendent
            orderedBooks = Object.keys(books_json_separated).sort().reduce((r, k) => (r[k] = books_json_separated[k], r), {});
            break;
        default:
            return books_json;
    }
    return orderedBooks;
}