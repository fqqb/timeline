export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Point {
    x: number;
    y: number;
}

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
