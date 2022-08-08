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
    // Get book code by url param
    epubCodeSearch = window.location.search.substring(1).split("=")[1];

    var books_json = await getBooksFromJson();
    var book_infos = await searchBookInJson(books_json,epubCodeSearch)

    // Update last time opened book
    await changeValueInJsonBook(books_json, epubCodeSearch, "lastTimeOpened", new Date());
    // Load book info navbar popup
    await loadBookInfo(book_infos);

    // Epub settings
    book_epub = ePub(__dirname + "/epubs/" + epubCodeSearch + "/epub.epub", { openAs: "epub"})
    book_rendition = book_epub.renderTo("book-content-columns", { manager: "default", width: "100%", height: "100%"});

    if (book_infos.lastPageOpened != null){
        book_rendition.display(book_infos.lastPageOpened);
    } else {
        book_rendition.display();
    }
    
    // Add book reading shortcut 
    book_rendition.on("keyup", keyListener);
    document.addEventListener("keyup", keyListener, false);

    book_rendition.on("rendered", async function (section) {
        // Load chapter list in navbar
        if (!chapters_rendered) {
            loadChaptersList()
        }
        // Add iframe click event to close all navbar popup
        var iframe = $('iframe').contents();
        iframe.find('body').on('click', function (event) {
            $('.book-navbar-popup').hide();
        });
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
    // Load book style (color or font size)
    await loadBookStyleSettings();
}

async function loadBookInfo(book_infos){
    $('#book-info-title').text(book_infos.title);
    $('#book-info-author').text(book_infos.author ? book_infos.author : 'undefined');
    $('#book-info-language').text(book_infos.lang ? book_infos.lang : 'undefined');
    $('#book-info-year').text(book_infos.bookYear ? book_infos.bookYear : 'undefined');
    $('#book-info-pages').text('undefined');
}
async function loadChaptersList(){
    $('#book-chapters').html(recursiveChapterHtml(book_epub.navigation, 1))
    chapters_rendered = true;
}
function recursiveChapterHtml(array,level) {
    var finalHtml = '<div class="p-l-10">';
    array.forEach((item) => {
        var op = item.label ? "" : "op-5";
        var bold = level == 1 ? 'text-sb' : '';
        finalHtml += `<h1 class="main-text ${op} ${bold}" onclick="book_rendition.display('${item.href}')">${item.label}</h1>`;
        if (item.subitems.length > 0) {
            finalHtml += recursiveChapterHtml(item.subitems, level+1);
        }
    })

    finalHtml += '</div>';
    return finalHtml;
}
async function loadBookStyleSettings(newStyleColor = null){
    // Load settings
    if (current_style_settings == null) current_style_settings = await getUserSettingsFromJson();

    // Group elements to change on initial style load
    var backround_elements = $('#book-container, #main-navbar, .book-navbar-popup')
    var icon_elements = $('#show-book-chapters, #show-book-saved-pages, #show-book-info, #show-reading-settings, #libraryNavBtn')

    // Check if font size is max/min and change opacity style
    checkNavbarFontSizeOpacity();

    // (NOT INITIAL LOAD) If style is manually changed then do it
    // (INITIAL LOAD) Style is not changed then load initial font size
    if (newStyleColor != null) {
        current_style_settings.book.background_color_style = newStyleColor
    } else {
        await book_rendition.themes.fontSize(current_style_settings.book.font_size_percent + "%")
    }
    
    // Color style setting change 
    switch (current_style_settings.book.background_color_style){
        case "brown":
            // if i use multiple themes (themes.register)
            // when it change text color it will not update cause it won't replace but append the css
            // -> color: #5B4636;color: black; | So it's necessary to apply css directly on default theme
            book_rendition.themes.default({ body: { 'color': '#5B4636' } });
            backround_elements.addClass('page-color-style-brown-bg');
            icon_elements.addClass('page-color-style-brown-color');
            $('#page-color-style-brown').addClass('selected');
            $('#page-color-style-default').removeClass('selected');
            break;
        default:
            book_rendition.themes.default({ body: { 'color': 'black' } })
            backround_elements.removeClass('page-color-style-brown-bg');
            icon_elements.removeClass('page-color-style-brown-color');
            $('#page-color-style-default').addClass('selected');
            $('#page-color-style-brown').removeClass('selected');
            break;
    }
}
var checkNavbarFontSizeOpacity = function () {
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
    localSaveUserSettings(current_style_settings)
}
var saveBookPageBeforeClose = async function(){
    if (book_rendition) {
        let location = book_rendition.currentLocation();
        let cfiString = location.start.cfi;
        var books_json = await getBooksFromJson();
        await changeValueInJsonBook(books_json, epubCodeSearch, "lastPageOpened", cfiString)
    }
}