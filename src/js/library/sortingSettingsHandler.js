$(window).on('load', async function () {
    $('body').on('mouseup', function () {
        $('.sorting-settings-list').addClass('hidden');
    });
    $('.sorting-settings-choose').on('click', function () {
        $(this).parent().find('.sorting-settings-list').toggleClass('hidden');
    });
    $('.sorting-settings-list > li').on('click', async function () {
        var sort_value = $(this).attr("value");
        var current_text = $(this).parent().parent().find('.sorting-settings-current-text');
        current_text.data("sort", sort_value)
        current_text.text($(this).text());
        sortingSettings[$(this).parent().data('settings')] = sort_value;
    })
    
    // display information preview 
    $('#section-book-hide-information').addClass("active");
    $('#section-book-show-information').on('click', function () {
        $('#section-book-hide-information').removeClass("active");
        $('#section-book-show-information').addClass("active");
        $('.book-box-informations').css("opacity", "1");
    });
    $('#section-book-hide-information').on('click', function () {
        $('#section-book-show-information').removeClass("active");
        $('#section-book-hide-information').addClass("active");
        $('.book-box-informations').css("opacity", "0");
    });
    $('#sorting-apply-btn').on('click', async function(){
        var books_json = await window.bookConfig.getBooks();
        await loadBooks(books_json, sortingSettings)
    });
});
