$(window).on('load', async function () {
    $('body').on('mouseup', function () {
        $('.sorting-settings-list').hide();
    });
    $('.sorting-settings-choose').on('click', function () {
        $(this).parent().find('.sorting-settings-list').toggle();
    });
    $('.sorting-settings-list > li').on('click', async function () {
        var sort_value = $(this).attr("value");
        var current_text = $(this).parent().parent().find('.sorting-settings-current-text');
        current_text.data("sort", sort_value)
        current_text.text($(this).text());
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
});