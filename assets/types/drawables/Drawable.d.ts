import { Graphics } from '../graphics/Graphics';
import { Timeline } from '../Timeline';
/**
 * Base class for any visual component that can be added to a
 * Timeline instance (bands or decorations).
 */
export declare abstract class Drawable {
    private _data?;
    private mutationListeners;
    /**
     * Timeline instance that this instance is bound to.
     */
    readonly timeline: Timeline;
    /**
     * @param timeline Timeline instance that this instance is bound to.
     */
    constructor(timeline: Timeline);
    /**
     * Arbitrary data. For example an identifier of a backend system.
     */
    get data(): any;
    set data(data: any);
    /**
     * Adds a listener that is notified whenever one of the properties
     * changes.
     *
     * This method is used by the Timeline instance to detect when
     * to redraw the Canvas.
     */
    addMutationListener(mutationListener: () => void): void;
    /**
     * Remove a previously added mutation listener.
     */
    removeMutationListener(mutationListener: () => void): void;
    /**
     * Mark this Drawable as dirty. This method is intended for use in subclasses
     * and should be called in the implementation of set accessors.
     */
    reportMutation(): void;
    /**
     * Creates an animatable property.
     *
     * Animatable properties apply easing over time between numeric
     * value changes.
     *
     * @param value Initial value (not animated)
     */
    protected createAnimatableProperty(value: number): import("../AnimatableProperty").AnimatableProperty;
    /**
     * Gets called before any of the draw methods.
     */
    beforeDraw(g: Graphics): void;
    /**
     * Gets called before regular content is drawn.
     * Override this if you need a bottom layer.
     */
    drawUnderlay(g: Graphics): void;
    /**
     * Draw regular content.
     */
    drawContent(g: Graphics): void;
    /**
     * Gets called after regular content is drawn.
     * Override this if you need a top layer.
     */
    drawOverlay(g: Graphics): void;
    /**
     * Called when this drawable is removed from its Timeline
     */
    disconnectedCallback(): void;
}
