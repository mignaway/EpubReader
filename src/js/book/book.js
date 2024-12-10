$(window).on('load', function(){
	window.appConfig.send('setWindowResizable');
    loadBook();
})

const MAX_FONT_SIZE = 180;
const MIN_FONT_SIZE = 100;

let epubCodeSearch = "";
let book_epub = null;
let book_rendition = null;
let first_time_rendered = true;
let current_section_href = null;
let current_style_settings = null;
let book_saved_pages = null;
let sessionDictionaryLanguage = "en"

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

var loadBook = async function(styleSettings = null) {

	// Clear content before rendering again
	$('#book-content-columns').empty()

	// Editable book layout styles
	const bookLayoutStyle = {
		manager: styleSettings?.manager ?? 'default',
		flow: styleSettings?.flow ?? 'paginated',
		width: styleSettings?.width ?? '100%',
	}

    // Get book code by url param
    epubCodeSearch = window.location.search.substring(1).split("=")[1];

	// Get books info and filter it
    var books_json = await window.bookConfig.getBooks();
    var book_infos = await window.bookConfig.searchBook(books_json,epubCodeSearch)

	// Update global variable
	book_saved_pages = book_infos.savedPages;

    // Update last time opened book
    await window.bookConfig.changeBookValue(books_json, epubCodeSearch, "lastTimeOpened", new Date());
    // Display book info 
	await loadBookInfo(book_infos);
    // Display saved pages 
	await loadSavedPages(book_saved_pages);

    // Load epub and rendition 
    book_epub = ePub(await window.appConfig.dirname() + "/epubs/" + epubCodeSearch + "/epub.epub", { openAs: "epub"})
	book_rendition = book_epub.renderTo("book-content-columns", { manager: bookLayoutStyle.manager, flow: bookLayoutStyle.flow, width: bookLayoutStyle.width, height: "100%"});

	// Get back where you left off 
    if (book_infos.lastPageOpened != null){
        book_rendition.display(book_infos.lastPageOpened);
    } else {
        book_rendition.display();
    }

    // Check layout types and display/hide elements 
	if (bookLayoutStyle.flow === 'paginated'){
		$('#previous-chapter-btn, #next-chapter-btn').show()
		$('#previous-chapter-btn').off('click').on('click',async function(){
			book_rendition.prev();
			var current_cfi = book_rendition.currentLocation().start.cfi;
			updateSavePagesButton(book_saved_pages, current_cfi)
			updatePageNumber(current_cfi);
		})
		$('#next-chapter-btn').off('click').on('click', async function () {
			book_rendition.next();
			var current_cfi = book_rendition.currentLocation().start.cfi;
			updateSavePagesButton(book_saved_pages, current_cfi)
			updatePageNumber(current_cfi);
		});
		book_rendition.on("keyup", keyListener);
		document.addEventListener("keyup", keyListener, false);
	} else {
		$('#previous-chapter-btn, #next-chapter-btn').hide()
	}

	// Load on localStorage the epub locations	
    book_epub.ready.then(function () {
        const stored = localStorage.getItem(book_epub.key() + '-locations');
        if (stored) {
            return book_epub.locations.load(stored);
        } else {
            return book_epub.locations.generate(1024); // Generates CFI for every X characters (Characters per/page)
        }
    }).then(function (_) {
        localStorage.setItem(book_epub.key() + '-locations', book_epub.locations.save());
    });

	// Update informations and add events when page rendered 
    book_rendition.on("rendered", async function (section) {
        // Load chapter list in navbar
        if (first_time_rendered) {
            loadChaptersList()
			WebFont.load({
				google: {
					families: ['Inter', 'IBM Plex Serif']
				},
				context: window.frames[0].frameElement.contentWindow,
			})
			first_time_rendered = false
        }
        // Add iframe click event to close all navbar popups
        var iframe = $('iframe').contents();
        iframe.find('body').on('click', function () {
            $('.book-navbar-popup').hide();
            $('#book-action-menu').hide();
        });
        // Add main color selection background 
        iframe.find('head').append("<style>::selection { background-color: #E3B230;}</style>");
		// Spawn action menu on right click if something selected
        iframe.on('contextmenu', function (e) {
            const somethingSelected = $('iframe')[0].contentWindow.getSelection().toString().trim().length > 0
            if(somethingSelected) {
                spawnActionMenu(e)
            }
        });

        const start_cfi = book_rendition.currentLocation().start?.cfi;
        // Update pages
        updatePageNumber(start_cfi)
        // Update save button
        updateSavePagesButton(book_saved_pages, start_cfi);

		// Update global variable with current section href
        current_section_href = section.href;
    })

    // Load book styles in navbar
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
    $('#book-info-title').text(info.title ?? 'undefined');
    $('#book-info-author').text(info.author ?? 'undefined');
    $('#book-info-language').text(info.lang ?? 'undefined');
    $('#book-info-year').text(info.bookYear ?? 'undefined');
    $('#book-info-pages').text('undefined');
}
async function loadChaptersList(){
    $('#book-chapters').html(recursiveChapterHtml(book_epub.navigation, 1))
}
var loadDictionary = async function (){
    // get highlighted text from iframe
    const selection_text = $('iframe')[0].contentWindow.getSelection().toString().trim();
    // if text is highlighted
    if (selection_text.length > 0) {
        var finalHtml = '';
        $('#dictionary-popup').html('<div class="circle-loading-logo" style="margin: 0 auto"></div>')
		
		// IGNORE, Future dictionary function supports multiple languages
		/*
        let language_flag_svg = getHtmlSvgFlag(sessionDictionaryLanguage)
        finalHtml += `
                    <div id="language-selection" class="flex-row flex-v-center">
                        <select id="lang-select" onchange="updateDictionaryLanguage(this.value)">
                            <option value="en" ${sessionDictionaryLanguage == "en" && 'selected'}>EN</option>
                            <option value="it" ${sessionDictionaryLanguage == "it" && 'selected'}>IT</option>
                        </select>
                        <div id="lang-flag">
                            ${language_flag_svg}
                        </div>
                    </div></div>`
        // TODO Switch between italian dictinary api and the english one
        switch(sessionDictionaryLanguage) {
            case "en":
                finalHtml += await getHtmlEnglishDictionary(selection_text)
            case "it":
                finalHtml += '<h1 class="main-text text-small text-center"><b>Italian Dictionary API</b> is not available yet.<h1>'
        }
		*/
		
        finalHtml += await getHtmlEnglishDictionary(selection_text)

        $('#dictionary-popup').html(finalHtml);
    } else {
        // No selection text
        $('#dictionary-popup').html('<h1 class="main-text text-sb" style="text-align: center; font-size: 14px;">Highlight some text to know his definition!</h1>')
    }
}

async function getHtmlEnglishDictionary(selection_text){
    let finalHtml = ''
    const multiple_definitions = await getDictionaryWordDefinitions(selection_text)
    // if got any results match
    if (multiple_definitions.length > 0) {
        for (const definition of multiple_definitions) {
            for (const meaning of definition.meanings) {

                var audioObject = await getAudioFromPhonetics(definition.phonetics);

                var audioButtonHtml = audioObject?.hasOwnProperty('audio') ? `
                    <div class="flex-all-centered dictionary-audio-button cursor-pointer" onclick="$(this).children('audio').get(0).play()">
                            <audio hidden class="dictionary-audio-input">
                                <source src="${audioObject.audio}" type="audio/mp3">
                            </audio>
                            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" 
                                xmlns:svgjs="http://svgjs.com/svgjs" width="15" height="15" x="0" y="0" viewBox="0 0 512 512" 
                                style="enable-background:new 0 0 512 512" xml:space="preserve" class="">
                            <g>
                                <path xmlns="http://www.w3.org/2000/svg" d="m36.17 325.18h18.44a59.94 59.94 0 0 1 41.13 16.11c27.94 
                                26.48 55.26 52.93 80.57 79.31 15.19 15.79 39.15 18.35 58.54 5.78 20.34-13.24 36.12-34.53 40.22-59.08 
                                3.84-23.4 7.45-55.57 7.49-99.61s-3.64-76.2-7.47-99.61c-4.13-24.67-20-46.06-40.54-59.28-19.25-12.37-42.91-10.07-58.13
                                5.36-25 25.4-51.94 50.86-79.5 76.36a59.91 59.91 0 0 1 -40.56 15.62h-20.06c-19.22 0-35.57 14.63-36 32.67s-.4 35.8-.07
                                53.69c.36 18.05 16.7 32.68 35.94 32.68z"></path>
                                <path xmlns="http://www.w3.org/2000/svg" d="m409.25 261.1a272 272 0 0 0 -8.56-68.9 228.86 228.86 0 0 0 
                                -19.15-49.45c-14-26.38-28.47-39.92-30.07-41.37a25.56 25.56 0 0 0 -34.56 37.67c2.13 2 41.22 40.58 41.22 
                                122.05a220.4 220.4 0 0 1 -6.77 55.39 176.71 176.71 0 0 1 -14.61 38.07c-9.57 18.07-19.18 27.44-19.75 28.06a25.56 
                                25.56 0 0 0 34.4 37.81c1.6-1.44 16.08-14.88 30.14-41.18a226.73 226.73 0 0 0 19.18-49.32 271.72 271.72 0 0 0 8.53-68.83z"></path>
                                <path xmlns="http://www.w3.org/2000/svg" d="m500.12 165.48a315.72 315.72 0 0 0 
                                -26.45-68.32c-19.19-36.07-38.54-54.24-40.67-56.16a25.56 25.56 0 0 0 -34.56 37.67c.57.54 
                                15.59 15 30.44 43.15a265.35 265.35 0 0 1 21.92 57.08 327.46 327.46 0 0 1 10.08 82.3 326 326 0 0 1 
                                -10.08 82.17 262.7 262.7 0 0 1 -21.9 56.85c-14.79 27.85-29.74 42.17-30.37 42.77a25.56 25.56 0 0 0 
                                34.35 37.86c2.15-1.94 21.54-20 40.77-55.9a313.81 313.81 0 0 0 26.47-68.12 377.06 377.06 0 0 0 
                                11.88-95.63 378.17 378.17 0 0 0 -11.88-95.72z"></path>
                            </g></svg>
                    </div> ` : '';


                // Upper text word, audio & phonetic
                finalHtml += `<div class="dictionary-definition-box flex-column">
                                        <div class="flex-row flex-v-center" style="padding-top: 10px;"><h1 class="main-text text-sb" style="font-size: 20px;">${definition.word}</h1>
                                        ${audioButtonHtml}
                                        </div>
                                        <div class="flex-row flex-v-center" style="gap: 5px; padding: 10px 0;">
                                        ${definition.phonetic ? "<h2 class='main-text'>" + definition.phonetic + "</h2>" : ""}
                                        <h2 class="main-text">${meaning.partOfSpeech}</h2>
                                  </div>`

                // Upper text synonyms
                if (meaning.synonyms.length > 0) {
                    var synonymText = '<h2 class="main-text m-b-10" style="font-size: 14px; opacity: .8;">Synonyms: '
                    for (const [i, synonym] of meaning.synonyms.entries()) {
                        synonymText += '<i>' + synonym + '</i>'
                        if (i < meaning.synonyms.length - 1) { synonymText += ', ' }
                    }
                    synonymText += '</h2>'
                    finalHtml += synonymText
                }
                // Closing Upper Text
                finalHtml += '<div class="horizontal-divider-05 bg-black"></div>'
                // Definitions list
                finalHtml += '<ol style="padding: 0;list-style-position: inside;">'
                for (const meaning_definition of meaning.definitions) {
                    finalHtml += `<li class="main-text m-t-10">${meaning_definition.definition}</li>`
                }
                finalHtml += '</ol>'
                // Closing dictionary-definition-box
                finalHtml += `</div>`
            }
        }
    } else {
        // No match text
        finalHtml += `<div class="dictionary-definition-box flex-column"><h1 class="main-text text-sb" style="font-size: 20px; padding-top: 10px;">${multiple_definitions.title}</h1><div class="horizontal-divider-05 m-t-10 m-b-10 bg-black"></div><h2 class="main-text">${multiple_definitions.message}<br><br>Rembember to search for <u>only one word at a time</u></h2></div>`;
    }
    return finalHtml
}
function getAudioFromPhonetics(phonetics){
    return phonetics.find(item => { return item.audio != '' }) ?? null

}
function spawnActionMenu(e) {
    var horizontalPadding = $(window).width() - $('#book-content-columns-wrapper').width()
    var hasOverflowedX = (e.pageX % $('#book-content-columns-wrapper').width() + horizontalPadding + $('#book-action-menu').width()) > $(window).width();
    var x = hasOverflowedX ? (e.pageX % $('#book-content-columns-wrapper').width()) - $('#book-action-menu').width() + 'px' : e.pageX % $('#book-content-columns-wrapper').width() + 'px';
    var y = e.pageY + 20 + 'px';

    $('#book-action-menu').css({ 'display': 'block','margin-left': x ,'margin-top': y});
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
    let books_json = await window.bookConfig.getBooks();
    const d = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let book_data = await window.bookConfig.searchBook(books_json, epubCodeSearch);
    let cfi = book_rendition.currentLocation().start.cfi
	let chapterName = await getCurrentChapterLabelByHref(book_epub.navigation.toc, current_section_href)
    let data = {
        chapterName: chapterName,
        cfi: cfi,
        date: {
            day: d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear(),
            time: d.getHours() + ":" + d.getMinutes()
        }
    }
    book_data.savedPages.unshift(data)
    await window.bookConfig.changeBookValue(books_json, epubCodeSearch, "savedPages", book_data.savedPages)
    loadSavedPages(book_data.savedPages)
    book_saved_pages = book_data.savedPages;
    updateSavePagesButton(book_data.savedPages,cfi);
}
async function deleteSavedPage(cfi){
    let books_json = await window.bookConfig.getBooks();
    let data = await window.bookConfig.searchBook(books_json, epubCodeSearch);
    $(data.savedPages).each((index) => {
        if (data.savedPages[index].cfi == cfi) {
            data.savedPages.splice(index, 1);
            return false;
        }
    })

    await window.bookConfig.changeBookValue(books_json, epubCodeSearch, "savedPages", data.savedPages)
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
async function loadBookStyleSettings(newStyleColor = null) {
    // Load user settings if not already loaded
    if (!current_style_settings) {
        current_style_settings = await window.bookConfig.getUserSettings();
    }

    // Update style settings if a new style is selected
    if (newStyleColor) {
        current_style_settings.book.background_color_style = newStyleColor;
    }

    // Apply font size and font family
    await book_rendition.themes.fontSize(current_style_settings.book.font_size_percent + "%");
    book_rendition.themes.font(current_style_settings.book.typeface);
    if (current_style_settings.book.typeface.length > 0) {
        $('#typeface-section-text').text(current_style_settings.book.typeface);
    }

    // Apply color styles
    applyThemeStyles(current_style_settings.book.background_color_style);
}

// Helper function to apply theme styles
function applyThemeStyles(theme) {
    const backgroundElements = $('#book-container, #main-navbar, .book-navbar-popup, #typeface-option, #typeface-section, #book-action-menu, .dictionary-audio-button, #currentPagesContainer');
    const iconElements = $('#show-book-chapters, #show-book-saved, #show-book-info, #show-reading-settings, #libraryNavBtn, #show-dictionary-popup');
    const textElements = $('#currentPages h1');

    // Get the previous and next chapter or page buttons
    const previousChapterBtn = $('#previous-chapter-btn g path');
    const nextChapterBtn = $('#next-chapter-btn g path');

    // Get the close and minimize app buttons
    const closeAppBtn = $('#close-app-icon');
    const resizeAppBtn = $('#resize-minimize-app-icon path');
    const maximizeAppBtn = $('#resize-maximize-app-icon rect');
    const minimizeAppBtn = $('#minimize-app-icon');

    // Reading settings
    const readingSettingsSpan = $('#reading-settings span');
    const readingSettingsH1 = $('#reading-settings h1');
    const verticalDivider = $('.vertical-divider-05');
    const horizontalDivider = $('.horizontal-divider-05');
    const typefaceSectionSVG = $('#typeface-section svg path');
    const selectFontFamily = $('#typeface-option');

    // Book infos
    const bookInfoH1 = $('#book-info h1')
    const bookInfoSpan = $('#book-info span')

    // Reset classes
    backgroundElements.removeClass('page-color-style-brown-bg page-color-style-dark-bg');
    iconElements.removeClass('page-color-style-brown-color page-color-style-dark-color');
    textElements.css('color', '');

    previousChapterBtn.css('fill', 'black');
    nextChapterBtn.css('fill', 'black');
    
    closeAppBtn.css('stroke', 'black');
    resizeAppBtn.css('fill', 'black');
    maximizeAppBtn.css('stroke', 'black');
    minimizeAppBtn.css('stroke', 'black');

    readingSettingsSpan.css('color', '');
    readingSettingsH1.css('color', '');
    verticalDivider.css('background-color', 'black');
    horizontalDivider.css('background-color', 'black');
    typefaceSectionSVG.css('fill', 'black');
    selectFontFamily.css('background-color', 'white');

    bookInfoH1.css('color', 'black')
    bookInfoSpan.css('color', 'black')
    // Apply theme-specific styles
    switch (theme) {
        case "brown":
            book_rendition.themes.default({ body: { 'color': '#5B4636' } });
            backgroundElements.addClass('page-color-style-brown-bg');
            iconElements.addClass('page-color-style-brown-color');
            textElements.css('color', '#5B4636');

            previousChapterBtn.css('fill', 'black');
            nextChapterBtn.css('fill', 'black');

            closeAppBtn.css('stroke', '#5B4636');
            resizeAppBtn.css('fill', '#5B4636');
            maximizeAppBtn.css('stroke', '#5B4636');
            minimizeAppBtn.css('stroke', '#5B4636');

            readingSettingsSpan.css('color', '#5B4636');
            readingSettingsH1.css('color', '#5B4636');
            verticalDivider.css('background-color', '#5B4636');
            horizontalDivider.css('background-color', '#5B4636');
            typefaceSectionSVG.css('fill', '#5B4636');
            selectFontFamily.css('background-color', '#5B4636', 'color', 'white');

            bookInfoH1.css('color', '#5B4636')
            bookInfoSpan.css('color', '#5B4636')
            break;
        case "dark":
            book_rendition.themes.default({ body: { 'color': 'white' } });
            backgroundElements.addClass('page-color-style-dark-bg');
            iconElements.addClass('page-color-style-dark-color');
            textElements.css('color', 'white');

            previousChapterBtn.css('fill', 'white');
            nextChapterBtn.css('fill', 'white');

            closeAppBtn.css('stroke', 'white');
            resizeAppBtn.css('fill', 'white');
            maximizeAppBtn.css('stroke', 'white');
            minimizeAppBtn.css('stroke', 'white');

            readingSettingsSpan.css('color', 'white');
            readingSettingsH1.css('color', 'white');
            verticalDivider.css('background-color', 'white');
            horizontalDivider.css('background-color', 'white');
            typefaceSectionSVG.css('fill', 'white');
            selectFontFamily.css('background-color', 'black', 'color', 'white');
            
            bookInfoH1.css('color', 'white')
            bookInfoSpan.css('color', 'white')
            break;
        default: // Default to light theme
            book_rendition.themes.default({ body: { 'color': 'black' } });
            textElements.css('color', 'black');
    }
}


var checkNavbarFontSizeOpacity = function () {
	if(current_style_settings){
		$('#settings-decrease-font-size').removeClass('op-5');
		$('#settings-increase-font-size').removeClass('op-5');
		if (current_style_settings.book.font_size_percent == MAX_FONT_SIZE) {
			$('#settings-increase-font-size').addClass('op-5');

		} else if (current_style_settings.book.font_size_percent == MIN_FONT_SIZE) {
			$('#settings-decrease-font-size').addClass('op-5');
		}
	}
}
var saveBeforeClose = async function() {
    saveBookPageBeforeClose();
    window.bookConfig.saveUserSettings(current_style_settings)
}
var saveBookPageBeforeClose = async function(){
    if (book_rendition) {
        let location = book_rendition.currentLocation();
        let cfiString = location.start.cfi;
        var books_json = await window.bookConfig.getBooks();
        await window.bookConfig.changeBookValue(books_json, epubCodeSearch, "lastPageOpened", cfiString)
    }
}

var getCurrentChapterLabelByHref = async function(navigationToc,chapterHref){
    chapter_title = null;
    for(const books of navigationToc){
        if (books.href.includes(chapterHref)){
            chapter_title = `[${books.label}] Page ${$("#current_page_value").text()}`;
            break;
        } else if (books.subitems.length > 0) {
            var temp_chapter_title = await getCurrentChapterLabelByHref(books.subitems, chapterHref)
            if (temp_chapter_title != null) {
                chapter_title = temp_chapter_title;
                break;
            } else {
                chapter_title = `Page ${$("#current_page_value").text()}`;
            }
        }
    }
    return chapter_title;
}


