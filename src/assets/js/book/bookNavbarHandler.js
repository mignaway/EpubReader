$(window).on('load', function(){
    $("body").on('click',function(e){
        // iframe click doesn't work, need to be added/fixed
        if (!$(e.target).hasClass('book-navbar-popup-open') && // Check clicking popup icon
            !$(e.target).parents('.book-navbar-popup-open').length &&  // Check clicking something inside popup icon
            $(e.target).closest($('.book-navbar-popup')).length == 0 && // Check clicking inside of popup
            $(e.target).closest($('#book-action-menu')).length == 0) {  // Check clicking inside the action menu
            $('.book-navbar-popup').hide();
            $('#book-action-menu').hide();
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
    $('#show-dictionary-popup, #action-menu-show-dictionary').on('click', function () {
        $('.book-navbar-popup:not(#dictionary-popup)').hide();
        $('#dictionary-popup').toggle();
        // load selection
        loadDictionary()
    })
    $('#show-book-saved').on('click', function () {
        $('.book-navbar-popup:not(#book-saved)').hide();
        if($('#book-saved').is(':visible')){
            $('#book-saved').hide()
        } else {
            $('#book-saved').css('display','flex')
        }
    })
    $('#libraryNavBtn').on('click', function(){
        ipcRenderer.send('unmaximizeApp');
    })
    $('#settings-increase-font-size').on('click', function(){
        if (current_style_settings.book.font_size_percent < MAX_FONT_SIZE) current_style_settings.book.font_size_percent += 2
        checkNavbarFontSizeOpacity();
        book_rendition.themes.fontSize(current_style_settings.book.font_size_percent + "%");
    })
    $('#settings-decrease-font-size').on('click', function () {   
        if (current_style_settings.book.font_size_percent > MIN_FONT_SIZE) current_style_settings.book.font_size_percent -= 2
        checkNavbarFontSizeOpacity();
        book_rendition.themes.fontSize(current_style_settings.book.font_size_percent + "%");
    })
});

function handleTypeFaceSelection() {
    $('#typeface-option').toggle()
}
function handleChangeFont(fontText,fontValue){
    $('#typeface-section-text').text(fontText);
    book_rendition.themes.font(fontValue);
    current_style_settings.book.typeface = fontValue; 
}