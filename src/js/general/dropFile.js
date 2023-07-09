function activeDropFeature(){
	document.addEventListener("dragover", e => {
		e.stopPropagation()
		e.preventDefault()
	})
	document.addEventListener("dragenter", e => {
		e.stopPropagation()
		e.preventDefault()
		$('#droparea').addClass('active')
	})
	document.getElementById('droparea').addEventListener("dragleave", e => {
		e.stopPropagation()
		e.preventDefault()
		$('#droparea').removeClass('active')
	})
	document.getElementById('droparea').addEventListener("drop", e => {
		e.stopPropagation()
		e.preventDefault()
		$('#droparea').removeClass('active')
		for (const f of e.dataTransfer.files){
			const fileExt = f.path.split('.').pop();
			if(window.bookConfig.isAllowedExtension(fileExt)) {
				addEpubBookHandler(f.path)
			} else {
				window.appConfig.displayAlert("File type not supported", 'warning')
			}
		}
	})
}


