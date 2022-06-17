$(window).on('load', function(){
    loadBookHtml();
})

var loadBookHtml = async function() {
    var epubCodeSearch = window.location.search.substring(1).split("=")[1];
    console.log(__dirname)
    var response = await EPub.createAsync(__dirname + "/epubs/" + epubCodeSearch + "/epub.epub", 'epubs/' + epubCodeSearch, 'epubs/' + epubCodeSearch)
        .then(async function (epub) {
            console.log(epub.metadata)
            epub.getFile("css", async function (error, data, mimeType) { 
                await fse.outputFile(__dirname + "/epubs/" + epubCodeSearch + "/css.css", data, 'binary')
                $('head').append('<link rel="stylesheet" type="text/css" href="epubs/' + epubCodeSearch + '/css.css">');
            })
            await epub.flow.forEach(function (chapter) {
                epub.getChapter(chapter.id, function (error, text) {
                    $('#book-content-columns').append(`<div id="${chapter.id}" class="chapter-content">${text}</div>`);
                });
            })
        })
}