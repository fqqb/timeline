/**
 * Coordinates of a box shape.
 */
export interface Bounds {
    /**
     * X-axis coordinate of the box's starting point.
     */
    x: number;
    /**
     * Y-axis coordinate of the box's starting point.
     */
    y: number;
    /**
     * The box's width.
     */
    width: number;
    /**
     * The box's height.
     */
    height: number;
}

/**
 * (x, y) coordinates.
 */
export interface Point {
    /**
     * X-axis coordinate.
     */
    x: number;
    /**
     * Y-axis coordinate.
     */
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
