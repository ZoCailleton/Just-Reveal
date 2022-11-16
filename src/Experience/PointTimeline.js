export default class PointTimeline {
	
	constructor(month, index) {
		
		this.month = month
		this.index = index
		
		this.html = document.createElement('div')
		this.html.classList.add('point')
		this.html.dataset.index = this.index

		this.setupName()

		return this.html

	}

	setupName() {

		const name = document.createElement('div')
		name.classList.add('name')
		name.innerHTML = this.month
		this.html.append(name)

	}

}
