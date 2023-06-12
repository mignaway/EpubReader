const API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/'

const getDictionaryWordDefinitions = async function(word){
	// Check if multiple words are selected
    if(word.trim().split(' ').length > 1){
		return []
	}
    return await fetch(API_URL + wordToSearch)
        .then((response) => { return response.json() })
}

