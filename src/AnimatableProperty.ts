
/**
 * Identity function. This causes the animated property to
 * change at the same rate from start to finish.
 */
export const LINEAR = (x: number) => x;

/**
 * Transitions a numeric property over a configurable duration.
 *
 * This can be used while rendering canvas frames to create an
 * animation effect.
 */
export class AnimatableProperty {

    private _value: number;

    private time0?: number;
    private src?: number;
    private dst?: number;

    /**
     * How long (wallclock time) this transition takes.
     */
    private duration = 200;

    constructor(initialValue: number, private easing: ((x: number) => number) = LINEAR) {
        this._value = initialValue;
    }

    /**
     * Applies the new transition specifications.
     *
     * Each time this is called, the previous transition
     * is replaced.
     *
     * @param time0 initial wallclock time
     * @param dst the target value of the transition
     */
    setTransition(time0: number | undefined, dst: number) {
        if (time0 === undefined) {
            this._value = dst;
        } else {
            this.time0 = time0;
            this.src = this.value;
            this.dst = dst;
        }
    }

    /**
     * Advance the transition with respect to the advancement in wallclock time.
     *
     * @param time current wallclock time
     */
    step(time: number): boolean {
        if (this.dst !== undefined && this.dst !== this.value) {
            let progress = Math.min((time - this.time0!) / this.duration, 1);
            progress = this.easing(progress);
            this._value = this.src! + ((this.dst! - this.src!) * progress);

            if (time - this.time0! > this.duration) {
                this.completeTransition();
            }

            return true;
        }
        return false;
    }

    get value() { return this._value; }
    set value(value: number) {
        this.abortTransition();
        this._value = value;
    }

    abortTransition() {
        this.time0 = undefined;
        this.src = undefined;
        this.dst = undefined;
    }

    completeTransition() {
        if (this.dst !== undefined) {
            this._value = this.dst;
            this.abortTransition();
        }
    }
}
