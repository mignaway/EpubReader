var dictionaryGetWord = async function(word){
    if (word.split(' ').length > 1) {
        return await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + '-')
            .then((response) => { return response.json() })
    } else {
        return await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + word)
            .then((response) => { return response.json() })
    }
    
}