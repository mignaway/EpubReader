const API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/'

const getDictionaryWordDefinitions = async function(word){
	let wordToSearch = word.trim().split(' ');
	// Check if multiple words are selected
    if(wordToSearch.length > 1){
		return []
	}
    return await fetch(API_URL + wordToSearch)
        .then((response) => { return response.json() })
}

