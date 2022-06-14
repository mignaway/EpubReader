$(window).on('load', async function () {
    // Load books form jsonfile
    let books_json = await getBooksFromJson();
    let options = null;
    await loadBooks(books_json, options)
});

var loadBooks = async function (books_json, options){
    // reset book container before appending
    $('#book-section-grid').html('');


    books_json.forEach((book)=>{
        let editingClass = $('#edit-books-button').hasClass('currently-editing') ? 'currently-editing' : ''
        const author = book.author ? book.author : 'Undefined Author';
        const language = book.lang ? book.lang : 'Undefined Language';
        $('#book-section-grid').append(`
        <div class="book-box ${editingClass} not-empty" data-folderbookcode="${book.folderBookCode}">
            <div class="book-box-informations overflow-hidden w-100 h-100 flex-column">
                <h1 class="main-text text-color-white text-b">${book.title}</h1>
                <h2 class="main-text text-color-white">${author}</h2>
                <h3 class="main-text text-color-white op-5">${language}</h3>
            </div>
            <div class="book-box-image overflow-hidden w-100 h-100">
                <img src="epubs/${book.folderBookCode}/${book.coverPath}">
            </div>
            <div class="book-delete-icon cursor-pointer" onclick="deleteEpubBookHandler($(this).parent().data('folderbookcode'))">
                <svg class="cursor-pointer" width="10" height="10" viewBox="0 0 15 1" xmlns="http://www.w3.org/2000/svg">
                <line x1="14.5" y1="0.5" x2="0.5" y2="0.499999" stroke-width="3" stroke-linecap="round" />
                </svg>
            </div>
        </div>
        `);
    })
    
}


ipcRenderer.on('bookChosenSuccess', async function (event, epubPath) {
    var response = await addEpubBook(epubPath);
    if (response != false) await loadBooks(response)
})

async function deleteEpubBookHandler(folderBookCode) {
    var json = await deleteEpubBook(folderBookCode);
    await loadBooks(json);
}