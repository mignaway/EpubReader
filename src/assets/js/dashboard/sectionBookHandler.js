$(window).on('load', async function () {
    $('#section-book-hide-information').addClass("active");
    $('#section-book-show-information').on('click', function(){
        $('#section-book-hide-information').removeClass("active");
        $('#section-book-show-information').addClass("active");
        $('.book-box-informations').css("opacity", "1");
    });
    $('#section-book-hide-information').on('click', function () {
        $('#section-book-show-information').removeClass("active");
        $('#section-book-hide-information').addClass("active");
        $('.book-box-informations').css("opacity","0");
    });
    $('#section-book-choose-sorting').on('click', function () {
        $('#section-book-sortings-list').toggle();
    });
    $('#section-book-sortings-list > li').on('click', async function(){
        var sort_value = $(this).attr("value");
        $('#section-book-current-sorting').data("sort",sort_value)
        $('#section-book-current-sorting').text($(this).text());
        var books = await getBooksFromJson()
        loadAll(books,sort_value);
    })
    $('body').on('mouseup', function () {
        $('#section-book-sortings-list').hide();
    });
});