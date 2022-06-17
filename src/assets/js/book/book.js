$(window).on('load', function(){
    loadBookHtml();
})

var loadBookHtml = async function() {
    var epubCodeSearch = window.location.search.substring(1).split("=")[1];
    console.log(__dirname)
    var response = await EPub.createAsync(__dirname + "/epubs/" + epubCodeSearch + "/epub.epub", 'epubs/' + epubCodeSearch, 'epubs/' + epubCodeSearch)
        .then(async function (epub) {
            await epub.flow.forEach(function (chapter) {
                epub.getChapter(chapter.id, function (error, text) {
                    $('#book-content-columns').append(text)
                });
            })
        })
}