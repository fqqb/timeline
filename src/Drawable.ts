import { Timenav } from './Timenav';

export abstract class Drawable {

    /**
     * Optional identifier.
     *
     * This is available as a user-convenience for callback handling,
     * and not checked for unicity.
     */
    id?: string;

    private mutationListeners: Array<() => void> = [];

    constructor(readonly timenav: Timenav) {
        timenav.add(this);
    }

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
     * Mark this Drawable as dirty. This method is intended for use in subclasses
     * and should be called in the implementation of set accessors.
     */
    reportMutation() {
        this.mutationListeners.forEach(listener => listener());
        this.timenav.requestRepaint();
    }

    protected createAnimatableProperty(value: number) {
        return this.timenav.createAnimatableProperty(value);
    }

    /**
     * Gets called before any of the draw methods.
     */
    beforeDraw() {
    }

    drawUnderlay(ctx: CanvasRenderingContext2D) {
    }

    drawContent(ctx: CanvasRenderingContext2D) {
    }

    drawOverlay(ctx: CanvasRenderingContext2D) {
    }
}
