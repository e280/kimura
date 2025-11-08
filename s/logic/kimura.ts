import {
	Container,
	Point,
	FederatedPointerEvent,
	Rectangle,
	Matrix,
} from 'pixi.js'

import {Wireframe} from './parts/wireframe.js'
import {Corner, Handle} from './parts/handle.js'


const TMP = {
	delta: new Matrix(),
	newLocal: new Matrix(),
}

export class Kimura extends Container {
	group: Container[]
	wireframe = new Wireframe()
	activeHandle: string | null = null
	isDragging = false
	lastPointer = new Point()
	activeTarget: Container | null = null
	#handles: Record<string, Handle>
	#childStart = new Map<Container, Matrix>()
	#opBounds = new Rectangle()
	#pivot = new Point()

	constructor(opts: {group: Container[]}) {
		super()
		this.group = opts.group

		this.eventMode = 'static'

		const callbacks = {
			beginDrag: (corner: Corner, start: Point) => this.#beginHandleDrag(corner, start),
			updateDrag: (corner: Corner, pos: Point) => this.#scale(corner, pos),
			endDrag: () => (this.isDragging = false),
		}

		this.#handles = {
			tl: new Handle('tl', 'nwse-resize', callbacks),
			tr: new Handle('tr', 'nesw-resize', callbacks),
			bl: new Handle('bl', 'nesw-resize', callbacks),
			br: new Handle('br', 'nwse-resize', callbacks),
		}
		
		for (const handle of Object.values(this.#handles)) {
			this.addChild(handle)
			handle.zIndex = this.wireframe.zIndex + 1
		}

		this.addChild(this.wireframe)

		this.#refresh()
		this.#bindEvents()
	}

	#bindEvents() {
		this.on('pointerdown', this.#onPointerDown)
		this.on('pointerup', this.#onPointerUp)
		this.on('pointerupoutside', this.#onPointerUp)
		this.on('globalpointermove', this.#onPointerMove)
	}

	#onPointerDown = (e: FederatedPointerEvent) => {
		this.isDragging = true
		this.lastPointer.copyFrom(e.global)
		this.cursor = 'grabbing'
	}

	#onPointerUp = () => {
		this.isDragging = false
		this.activeHandle = null
		this.cursor = 'default'
	}

	#onPointerMove = (e: FederatedPointerEvent) => {
		if (!this.isDragging || !this.parent) return

		for (const obj of this.group) {
			const parent = obj.parent
			if (!parent) continue

			// convert global pointer positions into the parent's local space
			const localStart = parent.toLocal(this.lastPointer)
			const localNow = parent.toLocal(e.global)

			obj.position.x += localNow.x - localStart.x
			obj.position.y += localNow.y - localStart.y
		}

		this.lastPointer.copyFrom(e.global)
		this.#refresh()
	}


	#beginHandleDrag(corner: Corner, start: Point) {
		this.isDragging = true
		this.#childStart.clear()

		for (const c of this.group)
			this.#childStart.set(c, c.localTransform.clone())

		this.#opBounds.copyFrom(this.#computeGroupBounds())

		const { left, right, top, bottom } = this.#opBounds
		this.#pivot.set(
			corner.includes('l') ? right : left,
			corner.includes('t') ? bottom : top
		)
	}

	#scale(corner: Corner, global: Point) {
		const local = this.toLocal(global)
		const b = this.#opBounds
		const newW = corner.includes('l') ? this.#pivot.x - local.x : local.x - this.#pivot.x
		const newH = corner.includes('t') ? this.#pivot.y - local.y : local.y - this.#pivot.y
		const scaleX = b.width ? newW / b.width : 1
		const scaleY = b.height ? newH / b.height : 1

		for (const c of this.group) {
			const start = this.#childStart.get(c)!
			const delta = TMP.delta.identity()
				.translate(-this.#pivot.x, -this.#pivot.y)
				.scale(scaleX, scaleY)
				.translate(this.#pivot.x, this.#pivot.y)
			c.setFromMatrix(TMP.newLocal.copyFrom(delta).append(start))
		}

		this.#refresh()
	}

	#refresh() {
		const b = this.#computeGroupBounds()
		this.wireframe.draw(b)

		// const cx = b.x + b.width / 2
		// const cy = b.y + b.height / 2

		this.#handles.tl.position.set(b.x, b.y)
		this.#handles.tr.position.set(b.x + b.width, b.y)
		this.#handles.bl.position.set(b.x, b.y + b.height)
		this.#handles.br.position.set(b.x + b.width, b.y + b.height)
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
		return new Rectangle(r.x, r.y, s.x - r.x, s.y - r.y)
	}
}
