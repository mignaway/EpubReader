$(window).on('load', function(){
    loadBook();
    $('#previous-chapter-btn').on('click',async function(){
        book_rendition.prev();
        var current_cfi = book_rendition.currentLocation().start.cfi;
        updateSavePagesButton(book_saved_pages, current_cfi)
        updatePageNumber(current_cfi);
    })
    $('#next-chapter-btn').on('click', async function () {
        book_rendition.next();
        var current_cfi = book_rendition.currentLocation().start.cfi;
        updateSavePagesButton(book_saved_pages, current_cfi)
        updatePageNumber(current_cfi);
    });
})
var epubCodeSearch = "";

var book_epub = null;
var book_rendition = null;
var chapters_rendered = false;
var current_chapter_name = null;
var current_style_settings = null;
var book_saved_pages = null;
var MAX_FONT_SIZE = 130;
var MIN_FONT_SIZE = 70;

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
    // Load saved pages if any
    await loadSavedPages(book_infos.savedPages);

    // Epub settings
    book_epub = ePub(__dirname + "/epubs/" + epubCodeSearch + "/epub.epub", { openAs: "epub"})
    book_rendition = book_epub.renderTo("book-content-columns", { manager: "default", width: "100%", height: "100%"});
    book_saved_pages = book_infos.savedPages;


    if (book_infos.lastPageOpened != null){
        book_rendition.display(book_infos.lastPageOpened);
    } else {
        book_rendition.display();
    }
    
    // Add book reading shortcut 
    book_rendition.on("keyup", keyListener);
    document.addEventListener("keyup", keyListener, false);

    book_epub.ready.then(function () {
        const stored = localStorage.getItem(book_epub.key() + '-locations');
        if (stored) {
            return book_epub.locations.load(stored);
        } else {
            return book_epub.locations.generate(1024); // Generates CFI for every X characters (Characters per/page)
        }
    }).then(function (location) {
        localStorage.setItem(book_epub.key() + '-locations', book_epub.locations.save());
    });

    book_rendition.on("rendered", async function (section) {
        // Load chapter list in navbar
        if (!chapters_rendered) {
            loadChaptersList()
        }
        // Add iframe click event to close all navbar popup
        var iframe = $('iframe').contents();
        iframe.find('body').on('click', function () {
            $('.book-navbar-popup').hide();
        });

        const start_cfi = book_rendition.currentLocation().start.cfi;
        // Update pages
        updatePageNumber(start_cfi)
        // Update save button
        updateSavePagesButton(book_saved_pages, start_cfi);
        
        var chapterName = await getCurrentChapterLabelByHref(book_epub.navigation.toc, section.href);
        if (chapterName != null) current_chapter_name = chapterName;
    })
    book_rendition.themes.default({
        a: {
            'pointer-events': 'none',
            'color': 'inherit'
        }
    });
    // Load book style (color or font size)
    await loadBookStyleSettings();
}

async function updatePageNumber(cfi) {
    var total_pages = book_epub.locations.total;
    var progress = Math.floor(book_epub.locations.percentageFromCfi(cfi) * total_pages);
    $('#current_page_value').text(progress);
    $('#total_page_value').text(total_pages);
    $('#book-info-pages').text(total_pages);
}

async function loadBookInfo(info){
    $('#book-info-title').text(info.title);
    $('#book-info-author').text(info.author ?? 'undefined');
    $('#book-info-language').text(info.lang ?? 'undefined');
    $('#book-info-year').text(info.bookYear ?? 'undefined');
    $('#book-info-pages').text('undefined');
}
async function loadChaptersList(){
    $('#book-chapters').html(recursiveChapterHtml(book_epub.navigation, 1))
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
async function loadSavedPages(saved_pages){
    $('#book-saved-pages').html('')
    if (saved_pages.length > 0) {
        saved_pages.forEach((info) => {
            $('#book-saved-pages').append(`
                <div class="book-saved-box cursor-pointer flex-row flex-v-center">
                    <div onclick="handleSavedClick('${info.cfi}')" class="saved-information flex-column">
                        <h1 class="main-text text-sb m-b-5">${info.chapterName}</h1>
                        <h2 class="main-text text-small op-5"><span class="text-sb">${info.date.day}</span> at <span class="text-sb">${info.date.time}</span></h2>
                    </div>
                    <svg onclick="deleteSavedPage('${info.cfi}')" width="22" height="23" viewBox="0 0 22 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M18.4719 2.57066C18.1331 2.21673 17.6563 1.99994 17.139 1.99994H5.84116C4.8455 1.99994 3.99988 2.80297 3.99988 3.84123V17.5538L18.4719 2.57066ZM3.99988 19.6361V20.5469C4.00281 21.8647 5.6124 22.4831 6.52747 21.558L10.8339 17.2528C11.179 16.8928 11.8012 16.8928 12.1463 17.2528L16.4527 21.558C17.3681 22.4834 18.9775 21.8641 18.9803 20.5469V4.12663L3.99988 19.6361Z"
                            />
                        <rect x="-0.00186306" y="-0.71746" width="2.44728" height="27.9745" rx="1.22364"
                            transform="matrix(0.698458 0.715651 -0.694731 0.719269 19.4901 0.79992)" stroke="white" />
                    </svg>
                </div>
            `)
        })
    } else {
        $('#book-saved-pages').html('<h1 class="main-text text-small op-5" style="text-align: center;">no page saved</h1>');
    }
}
async function handleSavePage() {
    if ($('#book-saved-btn').hasClass("saving")) {
        addSavedPage()
    } else if ($('#book-saved-btn').hasClass("unsaving")) {
        deleteSavedPage(book_rendition.currentLocation().start.cfi)
    }
}
async function handleSavedClick(cfi) {
    book_rendition.display(cfi);
    updateSavePagesButton(book_saved_pages, cfi)
}
async function addSavedPage() {
    var books_json = await getBooksFromJson();
    const d = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var book_data = await searchBookInJson(books_json, epubCodeSearch);
    var cfi = book_rendition.currentLocation().start.cfi
    var data = {
        chapterName: current_chapter_name,
        cfi: cfi,
        date: {
            day: d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear(),
            time: d.getHours() + ":" + d.getMinutes()
        }       
    }
    book_data.savedPages.unshift(data)
    changeValueInJsonBook(books_json, epubCodeSearch, "savedPages", book_data.savedPages)
    loadSavedPages(book_data.savedPages)
    book_saved_pages = book_data.savedPages;
    updateSavePagesButton(book_data.savedPages,cfi);
}
async function deleteSavedPage(cfi){
    var books_json = await getBooksFromJson();
    var data = await searchBookInJson(await getBooksFromJson(), epubCodeSearch);
    $(data.savedPages).each((index) => {
        if (data.savedPages[index].cfi == cfi) {
            data.savedPages.splice(index, 1);
            return false;
        }
    })
    
    changeValueInJsonBook(books_json, epubCodeSearch, "savedPages", data.savedPages)
    loadSavedPages(data.savedPages)
    book_saved_pages = data.savedPages;
    updateSavePagesButton(data.savedPages, cfi);
}
function updateSavePagesButton(savedPages,cfi){
    var found = savedPages.some(function (item) { return item.cfi == cfi; })
    if (found) {
        $('#book-saved-btn h1').text("Unsave page")
        $('#book-saved-btn').removeClass("saving")
        $('#book-saved-btn').addClass("unsaving")
    } else {
        $('#book-saved-btn h1').text("Save page")
        $('#book-saved-btn').removeClass("unsaving")
        $('#book-saved-btn').addClass("saving")
    }
}
async function loadBookStyleSettings(newStyleColor = null){
    // Load settings
    if (current_style_settings == null) current_style_settings = await getUserSettingsFromJson();

    // Check if font size is max/min and change opacity style
    checkNavbarFontSizeOpacity();

    // (NOT INITIAL LOAD) If style is manually changed then do it
    // (INITIAL LOAD) Style is not changed then load initial font size
    if (newStyleColor != null) {
        current_style_settings.book.background_color_style = newStyleColor
    } else {
        await book_rendition.themes.fontSize(current_style_settings.book.font_size_percent + "%")
    }
    // LOAD FONT
    book_rendition.themes.font(current_style_settings.book.typeface)
    if (current_style_settings.book.typeface.length > 0) $('#typeface-section-text').text(current_style_settings.book.typeface)

    // Group elements to change on initial style load
    var backround_elements = $('#book-container, #main-navbar, .book-navbar-popup, #typeface-option, #typeface-section, #typeface-option h1')
    var icon_elements = $('#show-book-chapters, #show-book-saved, #show-book-info, #show-reading-settings, #libraryNavBtn')
    var text_elements = $('#currentPages h1')

    // Color style setting change 
    switch (current_style_settings.book.background_color_style){
        case "brown":
            // if i use multiple themes (themes.register)
            // when it change text color it will not update cause it won't replace but append the css
            // -> color: #5B4636;color: black; | So it's necessary to apply css directly on default theme
            book_rendition.themes.default({ body: { 'color': '#5B4636' } });
            backround_elements.addClass('page-color-style-brown-bg');
            icon_elements.addClass('page-color-style-brown-color');
            text_elements.css('color','#5B4636');
            $('#page-color-style-brown').addClass('selected');
            $('#page-color-style-default').removeClass('selected');
            break;
        default:
            book_rendition.themes.default({ body: { 'color': 'black' } })
            backround_elements.removeClass('page-color-style-brown-bg');
            icon_elements.removeClass('page-color-style-brown-color');
            text_elements.css('color', 'black');
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

var getCurrentChapterLabelByHref = async function(array,chapterHref){
    chapter_title = null;
    for(const books of array){
        if (books.href.includes(chapterHref)){
            chapter_title = books.label;
            break;
        } else if (books.subitems.length > 0) {
            var temp_chapter_title = await getCurrentChapterLabelByHref(books.subitems, chapterHref)
            if (temp_chapter_title != null) {
                chapter_title = temp_chapter_title;
                break;
            } else {
                // IF CHAPTER DONT FOUND CHOOSE THE PREVIOUS ARRAY LABEL
                if (current_chapter_name == null) {
                    chapter_title = books.label;
                }
            }
        }
    }
    return chapter_title;
}