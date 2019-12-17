/**
 * Resizes a canvas, but only if the new bounds are different.
 */
export function resizeCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
    if (canvas.width != width || canvas.height != height) { // Avoid performance hit when resetting width
        canvas.width = width;
        canvas.height = height;
    }
}
