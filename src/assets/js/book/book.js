$(window).on('load', function(){
    loadBook();
    $('#previous-chapter-btn').on('click',function(){
        book_rendition.prev();
        e.preventDefault();
    })
    $('#next-chapter-btn').on('click', function () {
        book_rendition.next();
        e.preventDefault();
    });
})
var epubCodeSearch = "";

var book_epub = null;
var book_rendition = null;
var chapters_rendered = false;

var keyListener = function (e) {

    // Left Key
    if ((e.keyCode || e.which) == 37) {
        book_rendition.prev();
    }

    // Right Key
    if ((e.keyCode || e.which) == 39) {
        book_rendition.next();
    }

};

var loadBook = async function() {
    epubCodeSearch = window.location.search.substring(1).split("=")[1];
    var books_json = await getBooksFromJson();
    var book_infos = await searchBookInJson(books_json,epubCodeSearch)
    await loadBookInfo(book_infos);
    book_epub = ePub(__dirname + "/epubs/" + epubCodeSearch + "/epub.epub", { openAs: "epub" })
    book_rendition = book_epub.renderTo("book-content-columns", { method: "default", width: "100%", height: "100%"});
    await loadBookStyleSettings();
    var book_display; 
    if (book_infos.lastPageOpened != null){
        book_display = book_rendition.display(book_infos.lastPageOpened);
    } else {
        book_display = book_rendition.display();
    }
   
    book_rendition.on("keyup", keyListener);
    document.addEventListener("keyup", keyListener, false);
    book_rendition.on("rendered", function (section) {
        if (!chapters_rendered) {
            loadChaptersTitles()
        }
    })
    book_rendition.themes.default({
        img: {
            'max-width': '100%'
        },
        a: {
            'pointer-events': 'none',
            'color': 'inherit'
        }
    });
    book_rendition.themes.register("brown",
        {
            "body": { "color": "#5B4636" }
        });
}



async function loadBookInfo(book_infos){
    $('#book-info-title').text(book_infos.title);
    $('#book-info-author').text(book_infos.author ? book_infos.author : 'undefined');
    $('#book-info-language').text(book_infos.lang ? book_infos.lang : 'undefined');
    $('#book-info-year').text(book_infos.bookYear ? book_infos.bookYear : 'undefined');
    $('#book-info-pages').text('undefined');
}
async function loadChaptersTitles(){
    await book_epub.navigation.forEach((section) => {
        var op = section.label ? "" : "op-5";
        $('#book-chapters').append(`<h1 class="main-text ${op}" onclick="book_rendition.display('${section.href}')">${section.label}</h1>`)
    })
    chapters_rendered = true;
}

async function loadBookStyleSettings(newValue = null){
    var user_settings = await getUserSettingsFromJson();
    var backround_elements = $('#book-container, #main-navbar, .book-navbar-popup')
    var icon_elements = $('#show-book-chapters, #show-book-saved-pages, #show-book-info, #show-reading-settings, #libraryNavBtn')
    if (newValue != null) user_settings.book.background_color_style = newValue
    switch (user_settings.book.background_color_style){
        case 'brown':
            backround_elements.addClass('page-color-style-brown-bg');
            icon_elements.addClass('page-color-style-brown-color')
            book_rendition.themes.select('brown');
            break;
        default:
            backround_elements.removeClass('page-color-style-brown-bg');
            icon_elements.removeClass('page-color-style-brown-color')
            book_rendition.themes.select('default');
            break;
    }
    if (newValue != null) updateUserSettings(user_settings)

}

var saveBookPageBeforeClose = async function(){
    if (book_rendition) {
        let location = book_rendition.currentLocation();
        let cfiString = location.start.cfi;
        var books_json = await getBooksFromJson();
        await changeValueInJsonBook(books_json, epubCodeSearch, "lastPageOpened", cfiString)
    }
}