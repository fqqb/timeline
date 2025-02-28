import { Bounds } from '../../graphics/Bounds';
import { FillStyle } from '../../graphics/FillStyle';
import { Graphics } from '../../graphics/Graphics';
import { HitRegionSpecification } from '../../graphics/HitRegionSpecification';
import { Path } from '../../graphics/Path';
import { REGION_ID_VIEWPORT } from '../../Timeline';
import { Band } from '../Band';
import { State } from './State';
import { StateClickEvent } from './StateClickEvent';
import { StateMouseEvent } from './StateMouseEvent';


interface AnnotatedState extends State {
    start: number;
    stop: number;
    region: HitRegionSpecification;
    hovered: boolean;
    drawInfo?: DrawInfo;
}

interface DrawInfo {
    text: string; // Actual text to be shown (may include extra decoration: ◀)
    startX: number; // Left of bbox
    stopX: number; // Right of bbox
    textX: number; // Left of label
}

let stateSequence = 1;

/**
 * Draw discrete state changes.
 */
export class StateBand extends Band {

    private _contentHeight = 30;
    private _stateBackground: FillStyle = '#77b1e1';
    private _stateDividerColor = '#e8e8e8';
    private _stateDividerWidth = 1;
    private _stateDividerDash: number[] = [];
    private _stateCursor = 'pointer';
    private _stateFontFamily = 'Verdana, Geneva, sans-serif';
    private _stateHoverBackground: FillStyle = 'rgba(255, 255, 255, 0.2)';
    private _statePaddingLeft = 5;
    private _stateTextColor = '#333333';
    private _stateTextSize = 10;
    private _states: State[] = [];

    private statesById = new Map<State, string>();
    private annotatedStates: AnnotatedState[] = [];

    private stateClickListeners: Array<(ev: StateClickEvent) => void> = [];
    private stateMouseEnterListeners: Array<(ev: StateMouseEvent) => void> = [];
    private stateMouseMoveListeners: Array<(ev: StateMouseEvent) => void> = [];
    private stateMouseLeaveListeners: Array<(ev: StateMouseEvent) => void> = [];

    /**
     * Register a listener that receives an update when a state is clicked.
     */
    addStateClickListener(listener: (ev: StateClickEvent) => void) {
        this.stateClickListeners.push(listener);
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * state click events.
     */
    removeStateClickListener(listener: (ev: StateClickEvent) => void) {
        this.stateClickListeners = this.stateClickListeners.filter(el => (el !== listener));
    }

    /**
     * Register a listener that receives updates whenever the mouse enters
     * a state.
     */
    addStateMouseEnterListener(listener: (ev: StateMouseEvent) => void) {
        this.stateMouseEnterListeners.push(listener);
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * state mouse-enter events.
     */
    removeStateMouseEnterListener(listener: (ev: StateMouseEvent) => void) {
        this.stateMouseEnterListeners = this.stateMouseEnterListeners
            .filter(el => (el !== listener));
    }

    /**
     * Register a listener that receives updates whenever the mouse is moving
     * over a state.
     */
    addStateMouseMoveListener(listener: (ev: StateMouseEvent) => void) {
        this.stateMouseMoveListeners.push(listener);
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * state mouse-move events.
     */
    removeStateMouseMoveListener(listener: (ev: StateMouseEvent) => void) {
        this.stateMouseMoveListeners = this.stateMouseMoveListeners
            .filter(el => (el !== listener));
    }

    /**
     * Register a listener that receives updates whenever the mouse is moving
     * outside a state.
     */
    addStateMouseLeaveListener(listener: (ev: StateMouseEvent) => void) {
        this.stateMouseLeaveListeners.push(listener);
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * state mouse-leave events.
     */
    removeStateMouseLeaveListener(listener: (ev: StateMouseEvent) => void) {
        this.stateMouseLeaveListeners = this.stateMouseLeaveListeners
            .filter(el => (el !== listener));
    }

    private processData() {
        this.annotatedStates.length = 0;

        for (let i = 0; i < this.states.length; i++) {
            const state = this.states[i];
            let id = this.statesById.get(state);
            if (id === undefined) {
                id = 'state_band_' + stateSequence++;
            }

            let stop;
            if (i + 1 < this.states.length) {
                stop = this.states[i + 1].time;
            } else {
                stop = Infinity;
            }

            const annotatedState: AnnotatedState = {
                ...state,
                start: state.time,
                stop,
                hovered: false,
                region: {
                    id,
                    parentId: REGION_ID_VIEWPORT,
                    cursor: this.stateCursor,
                    click: () => {
                        this.stateClickListeners.forEach(listener => listener({
                            state,
                        }));
                    },
                    mouseEnter: mouseEvent => {
                        annotatedState.hovered = true;
                        this.reportMutation();
                        this.stateMouseMoveListeners.forEach(listener => listener({
                            clientX: mouseEvent.clientX,
                            clientY: mouseEvent.clientY,
                            state,
                        }));
                    },
                    mouseMove: mouseEvent => {
                        this.stateMouseMoveListeners.forEach(listener => listener({
                            clientX: mouseEvent.clientX,
                            clientY: mouseEvent.clientY,
                            state,
                        }));
                    },
                    mouseLeave: mouseEvent => {
                        annotatedState.hovered = false;
                        this.reportMutation();
                        this.stateMouseLeaveListeners.forEach(listener => listener({
                            clientX: mouseEvent.clientX,
                            clientY: mouseEvent.clientY,
                            state,
                        }));
                    }
                },
            };

            this.annotatedStates.push(annotatedState);
        }

        this.statesById.clear();
        for (const state of this.annotatedStates) {
            this.statesById.set(state, state.region.id);
        }
    }

    calculateContentHeight(g: Graphics) {
        return this._contentHeight;
    }

    drawBandContent(g: Graphics) {
        for (const state of this.annotatedStates) {
            this.measureState(g, state);
            this.drawState(g, state);
        }

        if (this.stateDividerWidth) {
            let prevX; // Ensure not to overlap identical stop and start
            for (const state of this.annotatedStates) {
                if (state.drawInfo) {
                    let { startX, stopX } = state.drawInfo;
                    startX = Math.round(startX);
                    stopX = Math.round(stopX);

                    // +0.5 on start and -0.5 on stop so that transparent
                    // divider effects operate on the same background
                    if (!prevX || prevX !== startX) {
                        g.strokePath({
                            path: new Path(startX + 0.5, 0)
                                .lineTo(startX + 0.5, this.contentHeight),
                            color: this.stateDividerColor,
                            lineWidth: this.stateDividerWidth,
                            dash: this.stateDividerDash,
                        });
                        prevX = startX;
                    }
                    if (!prevX || prevX !== stopX) {
                        g.strokePath({
                            path: new Path(stopX - 0.5, 0)
                                .lineTo(stopX - 0.5, this.contentHeight),
                            color: this.stateDividerColor,
                            lineWidth: this.stateDividerWidth,
                            dash: this.stateDividerDash,
                        });
                        prevX = stopX;
                    }
                }
            }
        }
    }

    private measureState(g: Graphics, state: AnnotatedState) {
        if (state.label === null) { // Gap
            return;
        }
        if (state.start > this.timeline.stop || state.stop < this.timeline.start) {
            state.drawInfo = undefined; // Forget draw info from previous step
            return;
        }

        const textSize = state.textSize ?? this.stateTextSize;
        const fontFamily = state.fontFamily ?? this.stateFontFamily;

        const startX = this.timeline.positionTime(state.start);
        const stopX = this.timeline.positionTime(state.stop);

        let text = state.label || '';
        let textX = startX + this.statePaddingLeft;
        if (state.start < this.timeline.start && state.stop > this.timeline.start) {
            text = '◀' + text;
            textX = this.timeline.positionTime(this.timeline.start);
        }

        const fm = g.measureText(text, `${textSize}px ${fontFamily}`);
        const labelFitsBox = stopX - textX >= fm.width;
        if (!labelFitsBox) {
            text = '';
        }

        state.drawInfo = { startX, stopX, textX, text };
    }

    private drawState(g: Graphics, state: AnnotatedState) {
        if (!state.drawInfo) {
            return;
        }
        let { startX, stopX, textX, text } = state.drawInfo;
        const background = state.background ?? this.stateBackground;
        const hoverBackground = state.hoverBackground ?? this.stateHoverBackground;
        const textColor = state.textColor ?? this.stateTextColor;
        const textSize = state.textSize ?? this.stateTextSize;
        const fontFamily = state.fontFamily ?? this.stateFontFamily;

        if (startX == -Infinity) {
            startX = this.timeline.positionTime(this.timeline.start);
        }
        if (stopX == Infinity) {
            stopX = this.timeline.positionTime(this.timeline.stop);
        }

        const box: Bounds = {
            x: Math.round(startX),
            y: 0,
            width: Math.round(stopX - Math.round(startX)),
            height: this.contentHeight,
        };

        g.fillRect({ ...box, fill: background });
        if (state.hovered) {
            g.fillRect({ ...box, fill: hoverBackground });
        }

        // Hit region covers both the shape, and potential outside text
        const hitRegion = g.addHitRegion(state.region);
        hitRegion.addRect(box.x, box.y, box.width, box.height);

        if (text) {
            const textY = box.y + (box.height / 2);
            g.fillText({
                x: textX,
                y: textY,
                text,
                font: `${textSize}px ${fontFamily}`,
                baseline: 'middle',
                align: 'left',
                color: textColor,
            });
        }
    }

    /**
     * The height of the band content (excluding margins).
     */
    get contentHeight() { return this._contentHeight; }
    set contentHeight(contentHeight: number) {
        this._contentHeight = contentHeight;
        this.reportMutation();
    }

    /**
     * List of states to be drawn on this band.
     */
    get states() { return this._states; }
    set states(states: State[]) {
        this._states = states;
        this.processData();
        this.reportMutation();
    }

    /**
     * Background color of states belonging to this band.
     */
    get stateBackground() { return this._stateBackground; }
    set stateBackground(stateBackground: FillStyle) {
        this._stateBackground = stateBackground;
        this.reportMutation();
    }

    /**
     * Color of the divider indicating a state change.
     */
    get stateDividerColor() { return this._stateDividerColor; }
    set stateDividerColor(stateDividerColor: string) {
        this._stateDividerColor = stateDividerColor;
        this.reportMutation();
    }

    /**
     * Width of the divider that separates states.
     */
    get stateDividerWidth() { return this._stateDividerWidth; }
    set stateDividerWidth(stateDividerWidth: number) {
        this._stateDividerWidth = stateDividerWidth;
        this.reportMutation();
    }

    /**
     * Dash pattern of the divider that separates states.
     */
    get stateDividerDash() { return this._stateDividerDash; }
    set stateDividerDash(stateDividerDash: number[]) {
        this._stateDividerDash = stateDividerDash;
        this.reportMutation();
    }

    /**
     * Text color of states belonging to this band.
     */
    get stateTextColor() { return this._stateTextColor; }
    set stateTextColor(stateTextColor: string) {
        this._stateTextColor = stateTextColor;
        this.reportMutation();
    }

    /**
     * Text size of states belonging to this band.
     */
    get stateTextSize() { return this._stateTextSize; }
    set stateTextSize(stateTextSize: number) {
        this._stateTextSize = stateTextSize;
        this.reportMutation();
    }

    /**
     * Font family of states belonging to this band.
     */
    get stateFontFamily() { return this._stateFontFamily; }
    set stateFontFamily(stateFontFamily: string) {
        this._stateFontFamily = stateFontFamily;
        this.reportMutation();
    }

    /**
     * Whitespace between the left border of a state, and
     * its label.
     */
    get statePaddingLeft() { return this._statePaddingLeft; }
    set statePaddingLeft(statePaddingLeft: number) {
        this._statePaddingLeft = statePaddingLeft;
        this.reportMutation();
    }

    /**
     * Cursor when mouse hovers a state.
     */
    get stateCursor() { return this._stateCursor; }
    set stateCursor(stateCursor: string) {
        this._stateCursor = stateCursor;
        this.reportMutation();
    }

    /**
     * State background when hovering.
     *
     * This is drawn on top of the actual state background.
     */
    get stateHoverBackground() { return this._stateHoverBackground; }
    set stateHoverBackground(stateHoverBackground: FillStyle) {
        this._stateHoverBackground = stateHoverBackground;
        this.reportMutation();
    }
}
