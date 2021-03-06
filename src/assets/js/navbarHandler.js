const $ = require('jquery');
const { ipcMain, ipcRenderer, shell, dialog } = require('electron');
const fs = require('fs');
const fse = require('fs-extra');

$(window).on('load', function () {
    $('#close-app-icon').on('click', async function() {
        if (typeof saveBeforeClose == 'function') {
            await saveBeforeClose();
        }
        ipcRenderer.send('closeApp');
    })
    $('#minimize-app-icon').on('click', function () {
        ipcRenderer.send('minimizeApp');
    })
    $('#resize-maximize-app-icon, #resize-minimize-app-icon').on('click', function(){
        $('#resize-maximize-app-icon').toggle();
        $('#resize-minimize-app-icon').toggle();
        ipcRenderer.send('resizeApp'); 
    })
    $('#edit-books-button').on('click', function () {
        $('.book-box.not-empty').toggleClass('currently-editing')
        $('#edit-books-button').toggleClass('currently-editing')
    })
    $('#add-books-button').on('click', function (){
        ipcRenderer.send('openBookChooserDialog')
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
    ipcRenderer.on('getAppVersion', async function(event, appVersion){
        $('#app-info-version').text("v" + appVersion);
    })
    $('#menu-open-app-information').on('click', function(){
        $('#application-information').css("display","flex");
        $('#settings-menu').hide();
    })
    $('#menu-close-app-information').on('click', function () {
        $('#application-information').css("display", "none");
    })
});
