$(window).on('load', async function () {
    $('#close-app-icon').on('click', async function() {
        if (typeof saveBeforeClose == 'function') {
            await saveBeforeClose();
        }
        window.appConfig.send('closeApp');
    })
    $('#minimize-app-icon').on('click', function () {
        window.appConfig.send('minimizeApp');
    })
    $('#resize-maximize-app-icon, #resize-minimize-app-icon').on('click', function(){
        window.appConfig.send('resizeApp'); 
    })
    $('#edit-books-button').on('click', function () {
        $('.book-box.not-empty').toggleClass('currently-editing')
        $('#edit-books-button').toggleClass('currently-editing')
    })
    $('#add-books-button').on('click', function (){
        window.appConfig.send('openBookChooserDialog')
    })
    $('#settings-menu-open').on('click', function(){
        $('#settings-menu').toggle();
    })
    $("body").on('click', function (e) {
        // iframe click doesn't work, need to be added/fixed
        if (!$(e.target).is('#settings-menu-open') && // Check clicking popup icon
            !$(e.target).parents('#settings-menu-open').length &&
            $(e.target).closest($('#settings-menu')).length == 0) { // Check clicking inside of popup
            $('#settings-menu').hide();
        }
    });
    window.appConfig.on('updateMaximizeIcon', async function(_, isMaximized){
        if(isMaximized){
            $('#resize-minimize-app-icon').show();
            $('#resize-maximize-app-icon').hide();
        } else {
            $('#resize-maximize-app-icon').show();
            $('#resize-minimize-app-icon').hide();
        }
        
    })
    $('#menu-open-app-information').on('click', function(){
        $('#application-information').css("display","flex");
        $('#settings-menu').hide();
    })
    $('#menu-close-app-information').on('click', function () {
        $('#application-information').css("display", "none");
    })

    // preload 
    $('#app-info-version').text("v" + await window.appConfig.appVersion());
});
