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
    $('#hero-section-loading-animation').removeClass('hidden');
    const orderedBooks = await orderBookModality(books_json, sortingSettings)
    await loadHeroSection(orderedBooks)
    await loadBooksSection(orderedBooks.slice(0, 6))
    await fetchContributors(); // Fetch contributors from github
}

async function loadHeroSection(books_json) {
    if (books_json.length > 0) {

		// Get data from json
        const [title, author, bookYear, language, bookFolderName, coverPath, bookOpened] = [books_json[0].title ?? 'Undefined Title', 
                                                                                books_json[0].author ?? 'Undefined Author', 
                                                                                books_json[0].bookYear ?? 'Undefined', 
                                                                                books_json[0].lang ?? 'Undefined Language', 
                                                                                books_json[0].bookFolderName, 
                                                                                books_json[0].coverPath,
                                                                                books_json[0].lastPageOpened != null]
        // Get vibrant color of image 
        const dominantRGBValue = await window.bookConfig.getVibrantColorFromImage(bookFolderName,coverPath)
		// Check cover exists and return path 
        const bookCover = await window.bookConfig.ensureBookCoverExistsAndReturn(bookFolderName, coverPath)

        // var keepReadingText = bookOpened ? 'Keep reading' : 'Start reading';
        var keepReadingText = bookOpened ? window.i18n.t('keepReadingButton.keepReading') : window.i18n.t('keepReadingButton.startReading');
        $('#hero-section-content')
            .html(`
            <div id="hero-section-image-cover" class="flex justify-center items-center overflow-hidden select-none w-[140px] h-[213px]">
				<img class="w-full h-full" src="${bookCover}"></div>
            <div id="hero-section-book-infos" class="flex flex-col ml-5 flex-1">
              <h1 class="main-text w-full line-clamp-3 overflow-hidden !text-[24px] mb-1 text-white font-bold">${title}</h1>
              <h2 class="main-text !text-[16px] mb-1 text-white">${author}</h2>
              <h3 class="main-text !text-[14px] mb-1 text-white opacity-50">${bookYear} Edition - ${language}</h3>
			  <a href="book.html?code=${bookFolderName}" id="keep-reading-button" onmouseover="this.style.backgroundColor='rgba(${dominantRGBValue},0.5)'" onmouseout="this.style.backgroundColor='rgb(${dominantRGBValue})'" class="primary-button w-full drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)] mt-auto text-center decoration-none" style="background-color: rgb(${dominantRGBValue})"><span class="drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]">${keepReadingText}</span></a>
            </div>
        `)
        $('#hero-section-image-background').css('background-image', `linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.8) 100%), url(${bookCover}`);
    } else {
        $('#hero-section-content').html(`<h2 class="main-text text-white text-center">${window.i18n.t("noPreviewAvailable")}<br>${window.i18n.t("addBooksByClickingPlusButton")}</h2>`)
        $('#hero-section-image-background').css({ 'background-image': 'none', 'background-color': 'rgb(20, 20, 20)' });
    }
    $('#hero-section-loading-animation').addClass('hidden')
}

async function loadBooksSection(books_json) {
    // Reset book preview section
    $('#section-book-preview').html('') 
    if (books_json.length > 0) {

        $('.circle-loading-logo').css('opacity', '1');
        const dominantRGBValue = await window.bookConfig.getVibrantColorFromImage(books_json[0].bookFolderName,books_json[0].coverPath)
        for(var i = 0; i <= 5;i++) {
            if (i < books_json.length) {
                let editingClass = $('#edit-books-button').hasClass('currently-editing') ? 'currently-editing' : ''
                const title = books_json[i].title ?? 'Undefined Title';
                const author = books_json[i].author ?? 'Undefined Author';
                const language = books_json[i].lang ?? 'Undefined Language';
                const already_read = books_json[i].lastPageOpened ? 'none' : 'flex';
                const bookCover = await window.bookConfig.ensureBookCoverExistsAndReturn(books_json[i].bookFolderName, books_json[i].coverPath)

                $('#section-book-preview').append(`
                <div class="book-box ${editingClass} not-empty" data-folderbookcode="${books_json[i].bookFolderName}" onclick="if(!$(this).hasClass('currently-editing')) window.location.href = 'book.html?code=${books_json[i].bookFolderName}'">
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
                `)
            } else {
                $('#section-book-preview').append('<div class="book-box"></div>')
            }
        }
		$('#section-book-preview').append(`<div class="book-box"><a id="see-all-books" href="library.html" class="main-text font-bold transition py-5 px-[30px] rounded-[10px] hover:bg-black hover:text-white" data-i18n="allBooksRightArrow">All Books -></a></div>`)
    }
    $('.circle-loading-logo').css('opacity', '0');
}

// Event called after chose book in dialog

window.appConfig.on('bookChosenSuccess', async function (event, epubPath) {
	await addEpubBookHandler(epubPath)
})

// Event called after updating book cover
window.appConfig.on('coverChosenSuccess', async function (event, coverPath) {
	$('#edit-book-information-cover').attr('src',coverPath)
})

async function addEpubBookHandler(epubPath){
	try {
		// check if it's an epub file
		if(!(/\.epub$/i.test(epubPath))) {
			$('#hero-section-loading-animation').removeClass('hidden');
			// convert to pdf and change variable 
			epubPath = await window.bookConfig.convertToEpub(epubPath)
		}
		var response = await window.bookConfig.addEpubBook(epubPath);
		if (response != false) {
			await loadAll(response)
		} else $('#hero-section-loading-animation').addClass('hidden');

	} catch (e){
		console.log(e)
		$('#hero-section-loading-animation').addClass('hidden');
	}
}
async function deleteEpubBookHandler(bookFolderName) {
    var json = await window.bookConfig.deleteEpubBook(bookFolderName);
    await loadAll(json);
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
	let json = await window.bookConfig.updateEpubBook(bookFolderName,{title: title, author: author,language:language,year: year,cover: cover});
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

async function fetchContributors() {
    fetch('https://api.github.com/repos/mignaway/EpubReader/contributors')
        .then((res) => res.json())
        .then((data) => {
            console.log(data);
            const contributorsList = document.getElementById('contributors-list');
            contributorsList.innerHTML = '';
            data.forEach(contributor => {
                if (contributor.login !== 'mignaway') {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `<img src="${contributor.avatar_url}" alt="${contributor.login}" class="rounded-full w-8 h-8 mr-2">
                    <a href="${contributor.html_url}" target="_blank">${contributor.login}</a>`;
                    contributorsList.appendChild(listItem);
                }
            });
        })
        .catch((error) => console.error('Erro no fetch:', error));
}