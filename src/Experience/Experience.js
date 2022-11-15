import * as THREE from 'three'

let instance = null

export default class Experience {

	constructor() {
		
		if(instance != null) {
			return instance
		}

		instance = true
			
	}
	
	tick() {
		
	}

}
