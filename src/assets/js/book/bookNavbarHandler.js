$(window).on('load', function(){
    $("body").on('click',function(e){
        // iframe click doesn't work, need to be added/fixed
        if (!$(e.target).hasClass('book-navbar-popup-open') && // Check clicking popup icon
            !$(e.target).parents('.book-navbar-popup-open').length &&  // Check clicking something inside popup icon
            $(e.target).closest($('.book-navbar-popup')).length == 0){ // Check clicking inside of popup
            $('.book-navbar-popup').hide();
        }
    });
    $('#show-reading-settings').on('click', function(){
        $('.book-navbar-popup:not(#reading-settings)').hide();
        $('#reading-settings').toggle();
    })
    $('#show-book-info').on('click', function () {
        $('.book-navbar-popup:not(#book-info)').hide();
        $('#book-info').toggle();
    })
    $('#show-book-chapters').on('click', function () {
        $('.book-navbar-popup:not(#book-chapters)').hide();
        $('#book-chapters').toggle();
    })
    
    $('#settings-increase-font-size').on('click', function(){
        if (current_style_settings.book.font_size_percent < MAX_FONT_SIZE) current_style_settings.book.font_size_percent += 2
        checkFontSizeOpacity();
        book_rendition.themes.fontSize(current_style_settings.book.font_size_percent + "%");
    })
    $('#settings-decrease-font-size').on('click', function () {   
        if (current_style_settings.book.font_size_percent > MIN_FONT_SIZE) current_style_settings.book.font_size_percent -= 2
        checkFontSizeOpacity();
        book_rendition.themes.fontSize(current_style_settings.book.font_size_percent + "%");
    })
});