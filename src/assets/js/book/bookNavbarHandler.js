$(window).on('load', function(){
    $('body').on('click', function (e) {
        if (!$(e.target).hasClass('book-navbar-popup-open') && $(event.target).closest($('.book-navbar-popup')).length == 0) {
            $('.book-navbar-popup').hide();
        }
    });
    $('#show-reading-settings').on('click', function(){
        $('.book-navbar-popup').hide();
        $('#reading-settings').toggle();
    })
    $('#show-book-info').on('click', function () {
        $('.book-navbar-popup').hide();
        $('#book-info').toggle();
    })
});