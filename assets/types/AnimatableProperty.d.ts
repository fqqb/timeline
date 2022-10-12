/**
 * Identity function. This causes the animated property to
 * change at the same rate from start to finish.
 */
export declare const LINEAR: (x: number) => number;
/**
 * Transitions a numeric property over a configurable duration.
 *
 * This can be used while rendering canvas frames to create an
 * animation effect.
 */
export declare class AnimatableProperty {
    private easing;
    private _value;
    private time0?;
    private src?;
    private dst?;
    /**
     * How long (wallclock time) this transition takes.
     */
    private duration;
    /**
     * @param initialValue initial value (not animated)
     * @param easing easing function, defaults to identity (same rate from start to finish).
     */
    constructor(initialValue: number, easing?: ((x: number) => number));
    /**
     * Applies the new transition specifications.
     *
     * Each time this is called, the previous transition
     * is replaced.
     *
     * @param time0 initial wallclock time
     * @param dst the target value of the transition
     */
    setTransition(time0: number | undefined, dst: number): void;
    /**
     * Advance the transition with respect to the advancement in wallclock time.
     *
     * @param time current wallclock time
     */
    step(time: number): boolean;
    get value(): number;
    set value(value: number);
    abortTransition(): void;
    completeTransition(): void;
}
