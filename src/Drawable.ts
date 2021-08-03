import { Graphics } from './Graphics';
import { Timeline } from './Timeline';

/**
 * Base class for any visual component that can be added to a
 * Timeline instance (lines or decorations).
 */
export abstract class Drawable {

    private _data?: any;
    private mutationListeners: Array<() => void> = [];

    /**
     * Timeline instance that this instance is bound to.
     */
    readonly timeline: Timeline;

    /**
     * @param timeline Timeline instance that this instance is bound to.
     */
    constructor(timeline: Timeline) {
        this.timeline = timeline;
        timeline.add(this);
    }

    /**
     * Arbitrary data associated with this line. For example
     * an identifier of a backend system.
     */
    get data() { return this._data; }
    set data(data: any) {
        this._data = data;
        this.reportMutation();
    }

    /**
     * Adds a listener that is notified whenever one of the properties
     * changes.
     *
     * This method is used by the Timeline instance to detect when
     * to redraw the Canvas.
     */
    addMutationListener(mutationListener: () => void) {
        if (this.mutationListeners.indexOf(mutationListener) === -1) {
            this.mutationListeners.push(mutationListener);
        }
    }

    /**
     * Remove a previously added mutation listener.
     */
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

    /**
     * Creates an animatable property.
     *
     * Animatable properties apply easing over time between numeric
     * value changes.
     *
     * @param value Initial value (not animated)
     */
    protected createAnimatableProperty(value: number) {
        return this.timeline.createAnimatableProperty(value);
    }

    /**
     * Gets called before any of the draw methods.
     */
    beforeDraw(g: Graphics) {
    }

    /**
     * Gets called before regular content is drawn.
     * Override this if you need a bottom layer.
     */
    drawUnderlay(g: Graphics) {
    }

    /**
     * Draw regular content.
     */
    drawContent(g: Graphics) {
    }

    /**
     * Gets called after regular content is drawn.
     * Override this if you need a top layer.
     */
    drawOverlay(g: Graphics) {
    }

    /**
     * Called when this drawable is removed from its Timeline
     */
    disconnectedCallback() {
    }
}
