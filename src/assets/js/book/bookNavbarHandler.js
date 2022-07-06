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
    $('#show-book-chapters').on('click', function () {
        $('.book-navbar-popup').hide();
        $('#book-chapters').toggle();
    })
    $('#settings-increase-font-size').on('click', function(){
        if (current_font_size < MAX_FONT_SIZE) current_font_size += 2
        checkFontSizeOpacity();
        book_rendition.themes.fontSize(current_font_size + "%");
    })
    $('#settings-decrease-font-size').on('click', function () {
        
        if (current_font_size > MIN_FONT_SIZE) current_font_size -= 2
        checkFontSizeOpacity(current_font_size);
        book_rendition.themes.fontSize(current_font_size + "%");
    })
    function checkFontSizeOpacity(){
        console.log(current_font_size)
        $('#settings-decrease-font-size').removeClass('op-5');
        $('#settings-increase-font-size').removeClass('op-5');
        if (current_font_size == MAX_FONT_SIZE){
            $('#settings-increase-font-size').addClass('op-5');
            
        } else if (current_font_size == MIN_FONT_SIZE) {
            $('#settings-decrease-font-size').addClass('op-5');    
        }
        
    }
});