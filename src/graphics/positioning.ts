import { Bounds } from './Bounds';

/**
 * Returns new bounds where the width and height are shrinked.
 */
export function shrink(original: Bounds, v: number, h?: number): Bounds {
    if (h === undefined) {
        h = v;
    }
    return {
        x: original.x + h,
        y: original.y + v,
        width: original.width - (h + h),
        height: original.height - (v + v),
    };
}
