$(window).on('load', async function () {
	activeDropFeature()
    // Load books form jsonfile
    books_json = await window.bookConfig.getBooks();
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
    final_book = isSearchingSomething ? await filterBooksByTitleAndAuthor(ordered_books, $('#search-bar-input').val()) : ordered_books

    // start loading animation
    $('.circle-loading-logo').css('opacity', '1');

    if (final_book.length > 0) {
        dominantRGBValue = await window.bookConfig.getVibrantColorFromImage(final_book[0].bookFolderName, final_book[0].coverPath)
        await loadBooksAction(final_book, dominantRGBValue);
    } else if (Object.keys(final_book).length) {
        dominantRGBValue = await window.bookConfig.getVibrantColorFromImage(final_book[Object.keys(final_book)[0]][0].bookFolderName, final_book[Object.keys(final_book)[0]][0].coverPath)
        await loadBooksAction(final_book, dominantRGBValue);
    } else {
        $('.circle-loading-logo').css('opacity', '0');
        if (isSearchingSomething) {
            $('#book-section-grid').html(`<h2 class="no-book-text main-text text-align-center">${window.i18n.t("library.noBooksFound")}<br>${window.i18n.t("library.youMayTryRemoveTheSearch")}</h2>`);    
        } else {
            $('#book-section-grid').html(`<h2 class="no-book-text main-text text-align-center">${window.i18n.t("noPreviewAvailable")}<br>${window.i18n.t("addBooksByClickingPlusButton")}</h2>`);
        }
    }
}

async function loadBooksAction(ordered_books, dominantRGBValue) {
    $('#book-section-grid').html('');
    if (ordered_books.length > 0 || Object.keys(ordered_books).length){
        if(sortingSettings.sortby == "last_read"){
            $('#book-section-grid').addClass('row-style')
            $('#book-section-grid').removeClass('column-style')
            for(const book of ordered_books) {
                let editingClass = $('#edit-books-button').hasClass('currently-editing') ? 'currently-editing' : ''
                const title = book.title ?? 'Undefined Title';
                const author = book.author ?? 'Undefined Author';
                const language = book.lang ?? 'Undefined Language';
                const already_read = book.lastPageOpened ? 'none' : 'flex';
                const bookCover = await window.bookConfig.ensureBookCoverExistsAndReturn(book.bookFolderName, book.coverPath)

                $('#book-section-grid').append(`
<div class="book-box ${editingClass} not-empty" data-folderbookcode="${book.bookFolderName}" onclick="if(!$(this).hasClass('currently-editing')) window.location.href = 'book.html?code=${book.bookFolderName}'">
                    <div class="book-box-informations absolute p-5 bg-black/90 gap-2.5 flex flex-col transition opacity-0 z-[5] overflow-hidden w-full h-full" ${$('#section-book-show-information').hasClass('active') ? 'style="opacity: 1"' : ''}>
                        <h1 class="main-text text-[15px] w-full line-clamp-5 text-white font-bold">${title}</h1>
                        <h2 class="main-text text-[13px] text-white">${author}</h2>
                        <h3 class="main-text text-[13px] text-white opacity-50">${language}</h3>
                    </div>
                    <div class="book-box-image overflow-hidden w-full h-full">
                        <img class="w-full h-full" src="${bookCover}">
                    </div>
                    <div class="new-book-box drop-shadow-lg" style="background-color: rgb(${dominantRGBValue}); display: ${already_read}">
                        <h1 class="main-text text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)] font-bold">${window.i18n.t("new")}</h1>
                    </div>
                    <div class="book-delete-icon cursor-pointer" onclick="event.stopPropagation(); deleteEpubBookHandler($(this).parent().data('folderbookcode'));">
                        <svg class="cursor-pointer" width="10" height="10" viewBox="0 0 15 1" xmlns="http://www.w3.org/2000/svg">
                        <line x1="14.5" y1="0.5" x2="0.5" y2="0.499999" stroke-width="3" stroke-linecap="round" />
                        </svg>
					</div>
					<div class="book-edit-icon cursor-pointer" onclick="event.stopPropagation(); editEpubBookHandler($(this).parent().data('folderbookcode'));">
<svg class="cursor-pointer" width="10" height="10" xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svgjs="http://svgjs.com/svgjs" width="512" height="512" x="0" y="0" viewBox="0 0 492.493 492" style="enable-background:new 0 0 512 512" xml:space="preserve" class=""><g><path d="M304.14 82.473 33.165 353.469a10.799 10.799 0 0 0-2.816 4.949L.313 478.973a10.716 10.716 0 0 0 2.816 10.136 10.675 10.675 0 0 0 7.527 3.114 10.6 10.6 0 0 0 2.582-.32l120.555-30.04a10.655 10.655 0 0 0 4.95-2.812l271-270.977zM476.875 45.523 446.711 15.36c-20.16-20.16-55.297-20.14-75.434 0l-36.949 36.95 105.598 105.597 36.949-36.949c10.07-10.066 15.617-23.465 15.617-37.715s-5.547-27.648-15.617-37.719zm0 0" data-original="#000000" class=""></path></g></svg>
					</div>
				</div>
                `);
            }
        } else {
            $('#book-section-grid').addClass('column-style')
            $('#book-section-grid').removeClass('row-style')
            for(const separator_letter of Object.keys(ordered_books)){

				const booksLimitRange = ordered_books[separator_letter].length > 5

                book_final_html = ''
				book_final_html += `<div class="flex flex-col ${booksLimitRange ? 'flex-5' : 'flex-1'} gap-5">`
                book_final_html += `<div class="flex flex-col gap-1"><h1 class="main-text font-semibold">${separator_letter}</h1><div class="horizontal-divider-05 bg-black opacity-10"></div></div>`
				book_final_html += `<div class="${booksLimitRange ? 'grid grid-cols-5' : 'flex flex-row'} gap-10">`


				for (const book of ordered_books[separator_letter]){

					let editingClass = $('#edit-books-button').hasClass('currently-editing') ? 'currently-editing' : ''
					const title = book.title ?? 'Undefined Title';
					const author = book.author ?? 'Undefined Author';
					const language = book.lang ?? 'Undefined Language';
					const already_read = book.lastPageOpened ? 'none' : 'flex';
					const bookCover = await window.bookConfig.ensureBookCoverExistsAndReturn(book.bookFolderName, book.coverPath)


					book_final_html += `
				<div class="book-box ${editingClass} not-empty" data-folderbookcode="${book.bookFolderName}" onclick="if(!$(this).hasClass('currently-editing')) window.location.href = 'book.html?code=${book.bookFolderName}'">
					<div class="book-box-informations absolute p-5 bg-black/90 gap-2.5 flex flex-col transition opacity-0 z-[5] overflow-hidden w-full h-full" ${$('#section-book-show-information').hasClass('active') ? 'style="opacity: 1"' : ''}>
						<h1 class="main-text text-[15px] w-full line-clamp-5 text-white font-bold">${title}</h1>
						<h2 class="main-text text-[13px] text-white">${author}</h2>
						<h3 class="main-text text-[13px] text-white opacity-50">${language}</h3>
					</div>
					<div class="book-box-image overflow-hidden w-full h-full">
						<img class="w-full h-full" src="${bookCover}">
					</div>
					<div class="new-book-box drop-shadow-lg" style="background-color: rgb(${dominantRGBValue}); display: ${already_read}">
						<h1 class="main-text text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)] font-bold">${window.i18n.t("new")}</h1>
					</div>
					<div class="book-delete-icon cursor-pointer" onclick="event.stopPropagation(); deleteEpubBookHandler($(this).parent().data('folderbookcode'));">
						<svg class="cursor-pointer" width="10" height="10" viewBox="0 0 15 1" xmlns="http://www.w3.org/2000/svg">
						<line x1="14.5" y1="0.5" x2="0.5" y2="0.499999" stroke-width="3" stroke-linecap="round" />
						</svg>
					</div>
					<div class="book-edit-icon cursor-pointer" onclick="event.stopPropagation(); editEpubBookHandler($(this).parent().data('folderbookcode'));">
						<svg class="cursor-pointer" width="10" height="10" xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svgjs="http://svgjs.com/svgjs" width="512" height="512" x="0" y="0" viewBox="0 0 492.493 492" style="enable-background:new 0 0 512 512" xml:space="preserve" class=""><g><path d="M304.14 82.473 33.165 353.469a10.799 10.799 0 0 0-2.816 4.949L.313 478.973a10.716 10.716 0 0 0 2.816 10.136 10.675 10.675 0 0 0 7.527 3.114 10.6 10.6 0 0 0 2.582-.32l120.555-30.04a10.655 10.655 0 0 0 4.95-2.812l271-270.977zM476.875 45.523 446.711 15.36c-20.16-20.16-55.297-20.14-75.434 0l-36.949 36.95 105.598 105.597 36.949-36.949c10.07-10.066 15.617-23.465 15.617-37.715s-5.547-27.648-15.617-37.719zm0 0" data-original="#000000" class=""></path></g></svg>
					</div>
				</div>
				   `;
				}
				book_final_html += '</div></div>'
				$('#book-section-grid').append(book_final_html)
			}
		}
	} else {
		$('#book-section-grid').html('<h2 class="no-book-text main-text text-align-center">${window.i18n.t("library.noBooksFound")}<br>${window.i18n.t("library.youMayTryRemoveTheSearch")}</h2>');
	}
	$('.circle-loading-logo').css('opacity', '0');
}

var searchTimeout = null;
async function handleSearchBarChange(newText) {
	newText = newText.trim()
	if (newText.length > 0) {
		$('.circle-loading-logo').css('opacity','1');
		var filtered_books = await filterBooksByTitleAndAuthor(books_json, newText)

        searchTimeout = setTimeout(async function () {
            await loadBooksAction(filtered_books, dominantRGBValue)
        }, 300);

    } else {
        await loadBooks(books_json)
    }
}

async function filterBooksByTitleAndAuthor(json,searchText){
    /* filterBooksByTitleAndAuthor handle two json types:
        - dict -> if filtered with alphabetically method 
        - array -> if filtered with default method
    */
    // check if dict
    if (json.constructor == Object) {
        var temp_json = {}
        Object.entries(json).forEach(([key, value]) => {
            var books_filtered = value.filter(book => book.title.toLowerCase().includes(searchText.toLowerCase()) || book.author.toLowerCase().includes(searchText.toLowerCase()))
            if(books_filtered.length > 0) temp_json[key] = books_filtered
        })
        return temp_json
    } else {
        // is array
        return json.filter(book => book.title.toLowerCase().includes(searchText.toLowerCase()) || book.author.toLowerCase().includes(searchText.toLowerCase()))
    }
}

window.appConfig.on('bookChosenSuccess', async function (_, epubPath) {
	addEpubBookHandler(epubPath)
})

// Event called after updating book cover
window.appConfig.on('coverChosenSuccess', async function (event, coverPath) {
	$('#edit-book-information-cover').attr('src',coverPath)
})

async function addEpubBookHandler(epubPath){
	try {
		// check if it's an epub file
		if(!(/\.epub$/i.test(epubPath))) {
			$('.circle-loading-logo').css('opacity', '1');
			// convert to pdf and change variable 
			epubPath = await window.bookConfig.convertToEpub(epubPath)
		}
		var response = await window.bookConfig.addEpubBook(epubPath);
		if (response != false) {
			await loadBooks(response)
		} else $('.circle-loading-logo').css('opacity', '0');

	} catch (e){
		console.log(e)
		$('.circle-loading-logo').css('opacity', '0');
	}
}
async function deleteEpubBookHandler(bookFolderName) {
    var json = await window.bookConfig.deleteEpubBook(bookFolderName);
    await loadBooks(json);
}
async function editEpubBookHandler(bookFolderName){
	const bookData = await window.bookConfig.getBooks()
	const book = await window.bookConfig.searchBook(bookData,bookFolderName)
	const bookCoverPath = await window.bookConfig.ensureBookCoverExistsAndReturn(bookFolderName,book.coverPath)	
	if(book){
		$('#edit-book-information-cover').attr('src',bookCoverPath);
		$('#edit-book-information-title').val(book.title);
		$('#edit-book-information-author').val(book.author);
		$('#edit-book-information-language').val(book.lang);
		$('#edit-book-information-year').val(book.bookYear);
		$('#edit-book-information-apply-btn').data('folderbookcode',bookFolderName);
		$('#edit-book-information').removeClass('hidden');
	}
}

async function applyEditEpubBookHandler(bookFolderName) {
	let title = $('#edit-book-information-title').val() 
	let author = $('#edit-book-information-author').val()
	let language = $('#edit-book-information-language').val()
	let year = $('#edit-book-information-year').val()
	let cover = $('#edit-book-information-cover').attr('src')
	let json = await window.bookConfig.updateEpubBook(bookFolderName,{title: title, author: author,language:language,year: year,cover:cover});
    await loadBooks(json);
}

async function separateBooksByLetter(books_json) {
    temp_ordered = {}
    for (const book of books_json) {
        var firstLetter = book.title.charAt(0).toUpperCase();
        if (!temp_ordered[firstLetter]) {
            temp_ordered[firstLetter] = [book]
        } else {
            temp_ordered[firstLetter].push(book);
        }
    }
    return temp_ordered
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

