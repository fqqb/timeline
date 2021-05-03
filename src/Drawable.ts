import { Graphics } from './Graphics';
import { RetargetableEventListener } from './RetargetableEventListener';
import { Timeline } from './Timeline';

export abstract class Drawable {

    private mutationListeners: Array<() => void> = [];
    private eventListeners: RetargetableEventListener[] = [];

    constructor(readonly timeline: Timeline) {
        timeline.add(this);
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
        this.timeline.requestRepaint();
    }

    protected createAnimatableProperty(value: number) {
        return this.timeline.createAnimatableProperty(value);
    }

    protected addClickListener(listener: () => void) {
        const l: RetargetableEventListener = {
            type: 'click',
            listener,
        };
        this.eventListeners.push(l);
        return l;
    }

    protected addHoverListener(listener: () => void, cursor?: string) {
    }

    /**
     * Gets called before any of the draw methods.
     */
    beforeDraw(g: Graphics) {
    }

    drawUnderlay(g: Graphics) {
    }

    drawContent(g: Graphics) {
    }

    drawOverlay(g: Graphics) {
    }

    /**
     * Called when this drawable is removed from its Timeline
     */
    disconnectedCallback() {
    }
}
