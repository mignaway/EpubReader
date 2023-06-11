var dictionaryGetWord = async function(word){
    const wordToSearch = word.split(' ').length > 1 ? '-' : word
    return await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + wordToSearch)
        .then((response) => { return response.json() })
}