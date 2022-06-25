$(window).on('load', function(){
    loadBookHtml();
    $('#previous-chapter-btn').on('click',function(){
        if (currentChapter > 0) {
            loadChapterById(currentChapter-1);
            currentChapter--;
        }
    })
    $('#next-chapter-btn').on('click', function () {
        var containerWidth = $('#book-content-columns').width();
        var iframeBodyWidth = $('#book-iframe').contents().find('html').outerWidth();
        console.log(iframeBodyWidth)
        if ((currentColumnWidthTranslate + containerWidth) < iframeBodyWidth) {
            currentColumnWidthTranslate += containerWidth;
            $('#book-iframe').contents().find('html').css('transform', 'translateX(-' + currentColumnWidthTranslate +'px)');
        } else {
            loadChapterById(currentChapter + 1);
            currentChapter++;
        } 
    });
})
var epubBookContent = null;
var epubCodeSearch = "";
var currentColumnWidthTranslate = 0;
var currentChapter = 0;
var chaptersLength;

var loadBookHtml = async function() {
    epubCodeSearch = window.location.search.substring(1).split("=")[1];
    console.log(__dirname)
    await EPub.createAsync(__dirname + "/epubs/" + epubCodeSearch + "/epub.epub", 'epubs/' + epubCodeSearch, 'epubs/' + epubCodeSearch)
        .then(async function (epub) {
            

            var books_json = await getBooksFromJson()
            var books_infos = await searchBookInJson(books_json, epubCodeSearch)
            if (books_infos != false) await loadBookInfo(books_infos)
            await loadChaptersInfo(epub)

            chaptersLength = epub.flow.length;
            epubBookContent = epub;
            await epub.getFile("css", async function (error, data, mimeType) {
                await fse.outputFile(__dirname + "/epubs/" + epubCodeSearch + "/css.css", data, 'binary')
            });
            var i = 0;
            loadChapterById(currentChapter);
            // await epub.flow.forEach((data) =>  {
            //     epub.getChapter(data.id, function (error, text) {
            //         $('#book-content-columns').append(text);
            //     });
            // });
        })
}
var loadChapterById = async function (index){
    var chapter = epubBookContent.flow[index];
    await loadChapter(chapter.id)
}

var loadChapter = async function (chapter_id) {
    await epubBookContent.getChapter(chapter_id, function (error, text) {
        $('#book-content-columns').html(text);
        var iframe_content = $(`<iframe id="book-iframe" data-id="${chapter_id}" scrolling="no" allowfullscreen="true" height="100%" width="100%" style="border: none; visibility: visible;" />`).appendTo($("#book-content-columns").html('')).contents()
        iframe_content.find('head').append('<link rel="stylesheet" type="text/css" href="epubs/' + epubCodeSearch + '/css.css">');
        iframe_content.find('body').append(text);
        iframe_content.find('html').css(
            {"overflow": "hidden",
             "width": $('#book-content-columns').width(),
             "height": $('#book-content-columns').height(),
             "column-fill": "auto",
             "column-gap": "100px",
             "column-width": "400px",
             "column-rule": "1px solid rgba(0, 0, 0, 0.5)"
            });
        iframe_content.find('head').append($("<style type='text/css'>  img { max-width: 100%;}  </style>"));
    });
}

async function loadBookInfo(book_infos){
    $('#book-info-title').text(book_infos.title);
    $('#book-info-author').text(book_infos.author ? book_infos.author : 'undefined');
    $('#book-info-language').text(book_infos.lang ? book_infos.lang : 'undefined');
    $('#book-info-year').text(book_infos.bookYear ? book_infos.bookYear : 'undefined');
    $('#book-info-pages').text('undefined');
}

async function loadChaptersInfo(epub) {
    epub.flow.forEach(chapter => {
        var op = chapter.title ? "" : "op-5";
        $('#book-chapters').append(`<h1 class="main-text ${op}" onclick="loadChapter('${chapter.id}')">${chapter.title}</h1>`)
    });
}