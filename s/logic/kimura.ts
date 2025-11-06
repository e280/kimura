import {
	Container,
	Graphics,
	Point,
	FederatedPointerEvent,
  Rectangle,
} from 'pixi.js'

export class Kimura extends Container {
	group: Container[]
	wireframe: Graphics
	activeHandle: string | null = null
	isDragging = false
	lastPointer = new Point()
	activeTarget: Container | null = null

	constructor(opts: {group: Container[]}) {
		super()
		this.group = opts.group

		this.eventMode = 'static'
		this.wireframe = new Graphics()
		this.addChild(this.wireframe)

		this.#drawWireframe()
		this.bindEvents()
	}

	private bindEvents() {
		this.addEventListener('pointerdown', this.#onPointerDown)
		this.addEventListener('pointerup', this.#onPointerUp)
		this.addEventListener('pointerupoutside', this.#onPointerUp)
		this.addEventListener('globalpointermove', this.#onPointerMove)
	}

	#onPointerDown = (e: FederatedPointerEvent) => {
		const global = e.global
		this.isDragging = true
		this.lastPointer.copyFrom(global)
		this.cursor = 'grabbing'
	}

	#onPointerUp = () => {
		this.isDragging = false
		this.activeHandle = null
		this.cursor = 'default'
	}

	#onPointerMove = (e: FederatedPointerEvent) => {
		if (!this.isDragging) return

		const dx = e.global.x - this.lastPointer.x
		const dy = e.global.y - this.lastPointer.y

		// translate group container
		for (const obj of this.group)
			obj.position.set(obj.x + dx, obj.y + dy)

		this.lastPointer.copyFrom(e.global)
		this.#drawWireframe()
	}

	#drawWireframe() {
		const bounds = this.#computeGroupBounds()

		const color = 0x55c1ff
		const thickness = 1

		this.wireframe.clear()
		this.wireframe
			.setStrokeStyle({ width: thickness, color })
			.rect(bounds.x, bounds.y, bounds.width, bounds.height)
			.stroke()

		this.hitArea = new Rectangle(
			bounds.x,
			bounds.y,
			bounds.width,
			bounds.height
		)
	}

	#computeGroupBounds() {
		const r = new Point(Number.MAX_VALUE, Number.MAX_VALUE)
		const s = new Point(-Number.MAX_VALUE, -Number.MAX_VALUE)
		for (const obj of this.group) {
			const b = obj.getBounds()
			r.x = Math.min(r.x, b.x)
			r.y = Math.min(r.y, b.y)
			s.x = Math.max(s.x, b.x + b.width)
			s.y = Math.max(s.y, b.y + b.height)
		}
		return { x: r.x, y: r.y, width: s.x - r.x, height: s.y - r.y }
	}
}
