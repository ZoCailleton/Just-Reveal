export default class PointTimeline {
	
	constructor(month) {
		
		this.month = month
		
		this.html = document.createElement('div')
		this.html.classList.add('point')

		return this.html

	}

}
