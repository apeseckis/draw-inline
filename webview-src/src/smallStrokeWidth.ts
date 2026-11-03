import { atom, defaultShapeUtils, STROKE_SIZES, type TLShape } from 'tldraw'

// Shared by canvas rendering and SVG export. Freehand adds 1 to this base width.
const smallStrokeWidth = atom('draw-inline.smallStrokeWidth', 0.5)
Object.defineProperty(STROKE_SIZES, 's', {
    configurable: true,
    enumerable: true,
    get: () => smallStrokeWidth.get(),
    set: value => smallStrokeWidth.set(value),
})

export function applySmallStrokeWidth(value: unknown) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return
    STROKE_SIZES.s = value
}

// Tldraw 3.5.1 appends shapeUtils to its defaults, so passing replacement classes
// registers duplicate types. Wrap the existing render methods instead. InnerShape
// tracks this atom read, refreshing S content without modifying records/history.
for (const Util of defaultShapeUtils) {
    const prototype = Util.prototype
    const component = prototype.component
    prototype.component = function (shape: TLShape) {
        if ('size' in shape.props && shape.props.size === 's') smallStrokeWidth.get()
        return component.call(this, shape)
    }
    const backgroundComponent = Reflect.get(prototype, 'backgroundComponent')
    if (backgroundComponent) {
        Reflect.set(prototype, 'backgroundComponent', function (this: unknown, shape: TLShape) {
            if ('size' in shape.props && shape.props.size === 's') smallStrokeWidth.get()
            return backgroundComponent.call(this, shape)
        })
    }
}
