import { Timenav } from './Timenav';

export abstract class Line<T> {

    /**
     * Optional identifier.
     *
     * This is available as a user-convenience for callback handling,
     * and not checked for unicity.
     */
    id?: string;
    protected lineHeight = 20;

    private _label?: string;
    private _frozen = false;
    private _data?: T;
    private _height = this.lineHeight;

    private mutationListeners: Array<() => void> = [];

    addMutationListener(mutationListener: () => void) {
        if (this.mutationListeners.indexOf(mutationListener) === -1) {
            this.mutationListeners.push(mutationListener);
        }
    }

    removeMutationListener(mutationListener: () => void) {
        const idx = this.mutationListeners.indexOf(mutationListener);
        if (idx !== -1) {
            this.mutationListeners.splice(idx, 1);
        }
    }

    /**
     * Custom data associated with this line.
     */
    get data() { return this._data; }
    set data(data: T | undefined) {
        this._data = data;
        this.reportMutation();
    }

    /**
     * Human-friendly label for this line. Typically used
     * in sidebars.
     */
    get label() { return this._label; }
    set label(label: string | undefined) {
        this._label = label;
        this.reportMutation();
    }

    /**
     * If set to true, this line should stay fixed on top, even while
     * scrolling vertically.
     *
     * Frozen lines precede non-frozen lines, regardless of the order in
     * which lines were added.
     */
    get frozen() { return this._frozen; }
    set frozen(frozen: boolean) {
        this._frozen = frozen;
        this.reportMutation();
    }

    /**
     * Mark this line as dirty. This method is intended for use in Line subclasses
     * only and should be called in the implementation of set accessors.
     *
     * Based on this information, a Timenav instance will know when to recalculate
     * a new animation frame.
     *
     * @category extensions
     */
    protected reportMutation() {
        this.mutationListeners.forEach(listener => listener());
    }

    /**
     * Gets called from inside the render loop, but before anything is actually drawn.
     *
     * @category extensions
     */
    calculateLayout() {
        this._height = this.lineHeight;
    }

    /**
     * The height of this line.
     */
    get height() {
        return this._height;
    }

    /**
     * @category extensions
     */
    draw(ctx: CanvasRenderingContext2D, timenav: Timenav, y: number, backgroundColor: string) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, y, ctx.canvas.width, this.height);

        // Bottom horizontal divider
        ctx.lineWidth = 1;
        ctx.strokeStyle = timenav.rowBorderColor!;
        const dividerY = y + this.height - 0.5;
        ctx.beginPath();
        ctx.moveTo(0, dividerY);
        ctx.lineTo(ctx.canvas.width, dividerY);
        ctx.stroke();
    }
}
