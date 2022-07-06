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
var current_style_settings = null;
var MAX_FONT_SIZE = 120;
var MIN_FONT_SIZE = 80;

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
    await loadBookStyleSettings();
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
async function loadBookStyleSettings(newStyleColor = null){
    if (current_style_settings == null) current_style_settings = await getUserSettingsFromJson();
    var backround_elements = $('#book-container, #main-navbar, .book-navbar-popup')
    var icon_elements = $('#show-book-chapters, #show-book-saved-pages, #show-book-info, #show-reading-settings, #libraryNavBtn')
    // fontSize here doesn't load, it needs to be fixed
    // book_rendition.themes.fontSize(current_style_settings.book.font_size_percent);
    checkFontSizeOpacity();
    if (newStyleColor != null) current_style_settings.book.background_color_style = newStyleColor
     
    switch (current_style_settings.book.background_color_style){
        case "brown":
            // if i use multiple themes (themes.register)
            // when it change text color it will not update cause it won't replace but append the css
            // -> color: #5B4636;color: black; | So it's necessary to apply css directly on default theme
            book_rendition.themes.default({ body: { 'color': '#5B4636' } });
            backround_elements.addClass('page-color-style-brown-bg');
            icon_elements.addClass('page-color-style-brown-color');
            break;
        default:
            book_rendition.themes.default({ body: { 'color': 'black' } })
            backround_elements.removeClass('page-color-style-brown-bg');
            icon_elements.removeClass('page-color-style-brown-color');
            break;
    }
}
var checkFontSizeOpacity = function () {
    $('#settings-decrease-font-size').removeClass('op-5');
    $('#settings-increase-font-size').removeClass('op-5');
    if (current_style_settings.book.font_size_percent == MAX_FONT_SIZE) {
        $('#settings-increase-font-size').addClass('op-5');

    } else if (current_style_settings.book.font_size_percent == MIN_FONT_SIZE) {
        $('#settings-decrease-font-size').addClass('op-5');
    }

}
var saveBeforeClose = async function() {
    saveBookPageBeforeClose();
    saveSettingsBeforeClose();
}
var saveBookPageBeforeClose = async function(){
    if (book_rendition) {
        let location = book_rendition.currentLocation();
        let cfiString = location.start.cfi;
        var books_json = await getBooksFromJson();
        await changeValueInJsonBook(books_json, epubCodeSearch, "lastPageOpened", cfiString)
    }
}
var saveSettingsBeforeClose = async function(){
    var settings = await getUserSettingsFromJson();
    settings.book.background_color_style = current_style_settings.book.background_color_style;
    // settings.book.font_size_percent = current_style_settings.book.font_size_percent; 
    updateUserSettings(settings)
}