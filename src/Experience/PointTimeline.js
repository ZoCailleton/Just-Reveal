export default class PointTimeline {
	
	constructor(month) {
		
		this.month = month
		
		this.html = document.createElement('div')
		this.html.classList.add('point')

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
