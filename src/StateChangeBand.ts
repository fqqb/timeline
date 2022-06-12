import { Band } from './Band';
import { FillStyle, Graphics, Path } from './Graphics';
import { HitRegionSpecification } from './HitCanvas';
import { Bounds } from './positioning';
import { StateChange } from './StateChange';
import { Timeline } from './Timeline';

interface DrawInfo {
    text: string; // Actual text to be shown (may include extra decoration: ◀)
    startX: number; // Left of bbox
    stopX: number; // Right of bbox
    textX: number; // Left of label
}

interface Range {
    start: number;
    stop: number;
    state: string | null;
    region: HitRegionSpecification;
    hovered: boolean;
    drawInfo?: DrawInfo;
}

let stateChangeSequence = 1;

export class StateChangeBand extends Band {

    private _contentHeight = 20;
    private _stateBackground: FillStyle | ((state: string) => FillStyle) = '#77b1e1';
    private _stateDividerColor = '#e8e8e8';
    private _stateDividerWidth = 1;
    private _stateDividerDash: number[] = [];
    private _stateCursor = 'pointer';
    private _stateFontFamily = 'Verdana, Geneva, sans-serif';
    private _stateHoverBackground: FillStyle = 'rgba(255, 255, 255, 0.2)';
    private _stateMarginLeft = 5;
    private _stateTextColor = '#333333';
    private _stateTextSize = 10;
    private _stateChanges: StateChange[] = [];

    private ranges: Range[] = [];

    constructor(timeline: Timeline) {
        super(timeline);
    }

    private processData() {
        this.ranges.length = 0;

        const uniqueStateChanges: StateChange[] = [];

        let prev: StateChange | undefined;
        for (const stateChange of this.stateChanges.sort((a, b) => a.time - b.time)) {
            if (!prev || stateChange.state !== prev.state) {
                uniqueStateChanges.push(stateChange);
                prev = stateChange;
            }
        }

        for (let i = 0; i < uniqueStateChanges.length; i++) {
            const startEvent = uniqueStateChanges[i];

            let stop;
            if (i + 1 < uniqueStateChanges.length) {
                stop = uniqueStateChanges[i + 1].time;
            } else {
                stop = Infinity;
            }

            const range: Range = {
                start: startEvent.time,
                stop,
                state: startEvent.state!,
                hovered: false,
                region: {
                    id: 'state_change_' + stateChangeSequence++,
                    cursor: this.stateCursor,
                    mouseEnter: () => {
                        range.hovered = true;
                        this.reportMutation();
                    },
                    mouseOut: mouseEvent => {
                        range.hovered = false;
                        this.reportMutation();
                    }
                },
            };

            this.ranges.push(range);
        }
    }

    /** @hidden */
    calculateContentHeight(g: Graphics) {
        return this._contentHeight;
    }

    /** @hidden */
    drawBandContent(g: Graphics) {
        for (const range of this.ranges) {
            this.measureRange(g, range);
            this.drawRange(g, range);
        }

        if (this.stateDividerWidth) {
            let prevX; // Ensure not to overlap identical stop and start
            for (const range of this.ranges) {
                if (range.drawInfo) {
                    let { startX, stopX } = range.drawInfo;
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

    private measureRange(g: Graphics, range: Range) {
        if (range.state === null) { // Gap
            return;
        }
        if (range.start > this.timeline.stop || range.stop < this.timeline.start) {
            range.drawInfo = undefined; // Forget draw info from previous step
            return;
        }

        const startX = this.timeline.positionTime(range.start);
        const stopX = this.timeline.positionTime(range.stop);

        let text = range.state || '';
        let textX = startX + this.stateMarginLeft;
        if (range.start < this.timeline.start && range.stop > this.timeline.start) {
            text = '◀' + text;
            textX = this.timeline.positionTime(this.timeline.start);
        }

        const fm = g.measureText(text, `${this.stateTextSize}px ${this.stateFontFamily}`);
        const labelFitsBox = stopX - textX >= fm.width;
        if (!labelFitsBox) {
            text = '';
        }

        range.drawInfo = { startX, stopX, textX, text };
    }

    private drawRange(g: Graphics, range: Range) {
        if (!range.drawInfo) {
            return;
        }
        let { startX, stopX, textX, text } = range.drawInfo;

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

        if (typeof this.stateBackground === 'function') {
            g.fillRect({
                ...box,
                fill: this.stateBackground(range.state!),
            });
        } else {
            g.fillRect({ ...box, fill: this.stateBackground });
        }

        if (range.hovered) {
            g.fillRect({ ...box, fill: this.stateHoverBackground });
        }

        // Hit region covers both the shape, and potential outside text
        const hitRegion = g.addHitRegion(range.region);
        hitRegion.addRect(box.x, box.y, box.width, box.height);

        if (text) {
            const textY = box.y + (box.height / 2);
            g.fillText({
                x: textX,
                y: textY,
                text,
                font: `${this.stateTextSize}px ${this.stateFontFamily}`,
                baseline: 'middle',
                align: 'left',
                color: this.stateTextColor,
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
     * List of state changes to be drawn on this band.
     */
    get stateChanges() { return this._stateChanges; }
    set stateChanges(stateChanges: StateChange[]) {
        this._stateChanges = stateChanges;
        this.processData();
        this.reportMutation();
    }

    /**
     * Background color of states belonging to this band.
     */
    get stateBackground() { return this._stateBackground; }
    set stateBackground(stateBackground: FillStyle | ((state: string) => FillStyle)) {
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
    get stateMarginLeft() { return this._stateMarginLeft; }
    set stateMarginLeft(stateMarginLeft: number) {
        this._stateMarginLeft = stateMarginLeft;
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
