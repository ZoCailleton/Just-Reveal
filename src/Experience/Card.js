import { getRandomIntFromInterval } from "../utils"

export default class Card {

	constructor({title, month, image, description}) {
		
		this.title = title
		this.month = month
		this.image = image
		this.description = description

		this.html = document.createElement('article')
		this.html.classList.add('card')

		this.setupIllu()
		this.setupTitle()
		this.setupMonth()
		this.setupDescription()
		this.setupStars()

		return this.html

	}

	setupIllu() {

		const img = document.createElement('img')
		img.src = `./assets/${this.image}`

		this.html.append(img)

	}

	setupTitle() {

		const title = document.createElement('h2')
		title.classList.add('heading')
		title.innerHTML = this.title
		
		this.html.append(title)

	}

	setupMonth() {

		const month = document.createElement('div')
		month.classList.add('month')
		month.innerHTML = this.month
		
		this.html.append(month)

	}

	setupDescription() {

		const description = document.createElement('p')
		description.classList.add('description')
		description.innerHTML = this.description
		
		this.html.append(description)

	}

	setupStars() {

		for(let i=0; i<4; i++) {

			const star = document.createElement('img')
			star.src = './assets/star.svg'
			star.classList.add('star')

			star.style.transform = `scale(${getRandomIntFromInterval(7, 10)/10})`
			star.style.animationDelay = `${getRandomIntFromInterval(0, 500)}ms`

			if(i < 2) {
				star.style.right = `${getRandomIntFromInterval(-15, 5)}%`
				star.style.top = `${getRandomIntFromInterval(-15, 5)}%`
			} else {
				star.style.left = `${getRandomIntFromInterval(-15, 5)}%`
				star.style.bottom = `${getRandomIntFromInterval(-15, 5)}%`
			}

			this.html.append(star)

		}

	}

}
