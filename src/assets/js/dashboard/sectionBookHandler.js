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
});