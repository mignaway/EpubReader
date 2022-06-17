$(window).on('load', function(){
    loadBookHtml();
    $('#previous-chapter-btn').on('click',function(){
        if (currentChapter > 0) {
            loadChapter(currentChapter-1);
            currentChapter--;
        }
    })
    $('#next-chapter-btn').on('click', function () {
        loadChapter(currentChapter + 1);
        currentChapter++;
    })
})
var epubBookContent = null;
var epubCodeSearch = "";
var currentChapter = 0;
var chaptersLength;

var loadBookHtml = async function() {
    epubCodeSearch = window.location.search.substring(1).split("=")[1];
    console.log(__dirname)
    await EPub.createAsync(__dirname + "/epubs/" + epubCodeSearch + "/epub.epub", 'epubs/' + epubCodeSearch, 'epubs/' + epubCodeSearch)
        .then(async function (epub) {
            chaptersLength = epub.flow.length;
            epubBookContent = epub;
            await epub.getFile("css", async function (error, data, mimeType) {
                await fse.outputFile(__dirname + "/epubs/" + epubCodeSearch + "/css.css", data, 'binary')
            });
            var i = 0;
            loadChapter(currentChapter);
            // setInterval(() => {
            //     loadChapter(epub, i, epubCodeSearch);
            //     i++;
            // }, 2000);
        })
}
var loadChapter = async function (index){
    var chapter = epubBookContent.flow[index];
    await epubBookContent.getChapter(chapter.id, function (error, text) {
        var iframe_content = $(`<iframe id="${chapter.id}" scrolling="no" allowfullscreen="true" height="100%" width="100%" style="border: none; visibility: visible;" />`).appendTo($("#book-content-columns").html('')).contents()
        iframe_content.find('head').append('<link rel="stylesheet" type="text/css" href="epubs/' + epubCodeSearch + '/css.css">');
        iframe_content.find('body').append(text);
        iframe_content.find('html').css(
            {"overflow": "hidden",
             "width": "892px",
             "height": "780px",
             "column-fill": "auto",
             "column-gap": "110px",
             "column-width": "391px",
             "column-rule": "1px solid rgba(0, 0, 0, 0.5)"
            });
        iframe_content.find('head').append($("<style type='text/css'>  img { max-width: 100%;}  </style>"));
    });
}