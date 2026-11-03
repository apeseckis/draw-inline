import { atom, defaultShapeUtils, STROKE_SIZES, type TLAnyShapeUtilConstructor, type TLShape } from 'tldraw'

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

// The reactive S getter invalidates geometry caches. These wrappers also redraw
// memoized content through tldraw's InnerShape state tracking. All shape methods,
// schemas and migrations are inherited unchanged; no records or history change.
export const configurableShapeUtils = defaultShapeUtils.map((Base: TLAnyShapeUtilConstructor) => {
    abstract class ConfigurableShapeUtil extends Base {
        override component(shape: TLShape) {
            if ('size' in shape.props && shape.props.size === 's') smallStrokeWidth.get()
            return Base.prototype.component.call(this, shape)
        }
        backgroundComponent(shape: TLShape) {
            if ('size' in shape.props && shape.props.size === 's') smallStrokeWidth.get()
            return Reflect.get(Base.prototype, 'backgroundComponent')?.call(this, shape)
        }
    }
    // Every Base here is a concrete default tldraw utility.
    return ConfigurableShapeUtil as unknown as TLAnyShapeUtilConstructor
})
