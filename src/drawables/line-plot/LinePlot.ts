import { Bounds } from '../../graphics/Bounds';
import { FillStyle } from '../../graphics/FillStyle';
import { Graphics } from '../../graphics/Graphics';
import { MouseHitEvent } from '../../graphics/MouseHitEvent';
import { Path } from '../../graphics/Path';
import { Timeline } from '../../Timeline';
import { Band } from '../Band';
import { BandMouseMoveEvent } from '../BandMouseMoveEvent';
import { GridLayer } from '../GridLayer';
import { AxisRegion } from './AxisRegion';
import { HLine } from './HLine';
import { Line } from './Line';
import { LinePlotMouseMoveEvent } from './LinePlotMouseMoveEvent';
import { LinePlotRegion } from './LinePlotRegion';
import { LinePoint } from './LinePoint';
import { LineStyle } from './LineStyle';
import { generateTicksForHeight } from './tickgen';


interface AnnotatedLine {
    id: string;
    visible: boolean;
    lineColor?: string;
    lineWidth?: number;
    lineStyle?: LineStyle;
    fill?: FillStyle;
    pointRadius?: number;
    pointColor?: string;
    lohiColor?: string;
    points: AnnotatedPoint[];
}

interface AnnotatedHLine extends HLine {
    y: number;
}

interface DrawInfo {
    /** @deprecated */
    renderX: number;
    /**
     * X-coordinate on band, relative to time=0.
     *
     * Represents a point in a pixel canvas, so always a whole integer. This property
     * can be used to avoid jitter coming from rounding errors when calculating positions
     * on the fly relative to the viewport:
     *
     * renderX = renderX0 - start0
     *
     * where start0 = distance in whole pixels between t0 and actual start.
     */
    renderX0: number;
    renderY?: number;
}

interface AnnotatedPoint {
    x: number; // Time
    y: number | null; // Value
    low?: number;
    high?: number;
    pointRadius?: number;
    pointColor?: string;
    drawInfo?: DrawInfo;
    originalPoint: LinePoint; // Immutable copy of what the user provides
}

interface AnnotatedTick {
    y: number;
    value: number;
}

let lineSequence = 1;

/**
 * Band type that plots a line along the timeline.
 */
export class LinePlot extends Band {

    private _fill: FillStyle = 'transparent';
    private _lineColor = '#4f9146';
    private _lineWidth = 1;
    private _lineStyle: LineStyle = 'straight';
    private _labelFontFamily = 'Verdana, Geneva, sans-serif';
    private _hoveredValueLabelBackground: FillStyle = 'rgba(97, 97, 97, 0.9)';
    private _hoveredValueLabelTextColor: string = 'white';
    private _labelTextColor = 'grey';
    private _labelTextSize = 8;
    private _labelPadding = 2;
    private _labelRadius = 4;
    private _axisBackground: FillStyle = 'transparent';
    private _axisTickColor: string = '#888888';
    private _axisTickLength = 8;
    private _axisWidth?: number;
    private _axisRangePadding = 0.1;
    private _minimum?: number;
    private _maximum?: number;
    private _centerZero = false;
    private _zoomMultiplier = 0.05;
    private _closestPointMaxDistance = 5;
    private _pointRadius = 1.5;
    private _pointColor = '#4f9146';
    private _lohiColor = '#5555552b';
    private _grid?: GridLayer;
    private _gridColor: string = '#e8e8e8';
    private _lines: Line[] = [];
    private _hlines: HLine[] = [];
    private _contentHeight = 30;
    private _resetAxisZoomOnDoubleClick = true;

    // Formatter for numbers that are more 'predictable'.
    private _axisLabelFormatter: (value: number) => string = value => {
        return String(value);
    };

    // Formatter for numbers that are 'unpredictable' (derived from
    // hover position)
    private _hoveredValueLabelFormatter: (value: number) => string = value => {
        return value.toFixed(2);
    };

    private annotatedTicks: AnnotatedTick[] = [];
    private annotatedLines: AnnotatedLine[] = [];
    private annotatedHLines: AnnotatedHLine[] = [];
    private minTick?: AnnotatedTick;
    private maxTick?: AnnotatedTick;

    private axisRegion?: AxisRegion;
    private _customMinimum?: number;
    private _customMaximum?: number;

    private mouseMoveListener: (evt: BandMouseMoveEvent) => void;
    private mouseLeaveListener: () => void;

    private hoveredY?: number;

    /** @hidden */
    valueForPositionFn?: (position: number) => number;

    private linePlotRegion: LinePlotRegion;

    constructor(timeline: Timeline) {
        super(timeline);
        this.linePlotRegion = new LinePlotRegion(this.bandRegion, this);

        this.mouseMoveListener = (evt: BandMouseMoveEvent) => {
            if (evt.y !== this.hoveredY) {
                this.hoveredY = evt.y;
                this.reportMutation();
            }
        };
        this.addMouseMoveListener(this.mouseMoveListener);

        this.mouseLeaveListener = () => {
            if (this.hoveredY !== undefined) {
                this.hoveredY = undefined;
                this.reportMutation();
            }
        };
        this.addMouseLeaveListener(this.mouseLeaveListener);
    }

    /**
     * Register a listener that receives updates whenever the mouse is moving over
     * this plot.
     */
    addMouseMoveListener(listener: (ev: LinePlotMouseMoveEvent) => void) {
        super.addMouseMoveListener(listener as any);
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * plot mouse-move events.
     */
    removeMouseMoveListener(listener: (ev: LinePlotMouseMoveEvent) => void) {
        super.removeMouseMoveListener(listener as any);
    }

    /**
     * Reprocess plot data, then repaint.
     */
    updatePlot() {
        // Convert user input to internal data structure
        this.annotatedLines.length = 0;
        const lineId = 'line_plot_' + lineSequence++;
        if (this.lines.length) {
            for (const line of this.lines) {
                const annotatedPoints = [];
                for (const point of line.points) {
                    annotatedPoints.push({
                        ...point,
                        originalPoint: point,
                    });
                }
                annotatedPoints.sort((a, b) => a.x - b.x);
                this.annotatedLines.push({
                    id: lineId,
                    visible: line.visible ?? true,
                    lineColor: line.lineColor,
                    lineWidth: line.lineWidth,
                    lineStyle: line.lineStyle,
                    fill: line.fill,
                    pointRadius: line.pointRadius,
                    pointColor: line.pointColor,
                    lohiColor: line.lohiColor,
                    points: annotatedPoints,
                });
            }
        }

        this.axisRegion = new AxisRegion(lineId + '_axis', this.bandRegion.id, this);
        this.reportMutation();
    }

    calculateContentHeight(g: Graphics) {
        return this._contentHeight;
    }

    drawBandContent(g: Graphics) {
        const { contentHeight } = this;

        const hitRegion = this.offscreen!.addHitRegion(this.linePlotRegion);
        hitRegion.addRect(0, 0, this.timeline.mainWidth, contentHeight);

        // Prioritize custom range when applicable
        let min = this.customMinimum;
        let max = this.customMaximum;

        // Determine min/max, either through configuration or from the data
        // However, ignore data outside of viewport.
        if (min === undefined || max === undefined) {
            min = this.minimum;
            max = this.maximum;
            if (min == undefined || max == undefined) {
                for (const line of this.visibleLines) {
                    for (const pt of line.points) {
                        if (pt.x < this.timeline.start || pt.x > this.timeline.stop) {
                            continue;
                        }
                        if (this.minimum === undefined && pt.y !== null) {
                            const viewLow = pt.low !== undefined ? Math.min(pt.low, pt.y) : pt.y;
                            if (min === undefined || viewLow < min) {
                                min = viewLow;
                            }
                        }
                        if (this.maximum === undefined && pt.y !== null) {
                            const viewHigh = pt.high !== undefined ? Math.max(pt.high, pt.y) : pt.y;
                            if (max === undefined || viewHigh > max) {
                                max = viewHigh;
                            }
                        }
                    }
                }
                for (const hline of this.hlines) {
                    if (hline.extendAxisRange ?? true) {
                        if (min === undefined || hline.value < min) {
                            min = hline.value;
                        }
                        if (max === undefined || hline.value > max) {
                            max = hline.value;
                        }
                    }
                }
            }
        }

        if (min === undefined || max === undefined) {
            return;
        }
        if (max < min) { // Edge case in case only one of minimum/maximum was configured
            [min, max] = [max, min];
        } else if (min === max) { // Avoid min===max
            [min, max] = [min - 1, max + 1];
        }

        if (this.centerZero
            && this.minimum === undefined
            && this.customMinimum === undefined
            && this.maximum === undefined
            && this.customMaximum === undefined) {
            if (min >= 0) {
                min = Math.min(-max, min);
            } else if (min < 0) {
                max = Math.max(-min, max);
            }
        }

        // Calculate ticks for the available content height.
        // Don't consider range padding for this to avoid labels getting clipped.
        const calculatedTicks = generateTicksForHeight(min, max, contentHeight, this.labelTextSize, 2);
        const dataMin = min;
        const dataMax = max;

        // Add range padding unless an explicit value was defined
        if (this.minimum === undefined && this.customMinimum === undefined) {
            min -= (max - min) * this.axisRangePadding;
        }
        if (this.maximum === undefined && this.customMaximum === undefined) {
            max += (max - min) * this.axisRangePadding;
        }

        const positionForValueFn = (value: number) => {
            return contentHeight - ((value - min) / (max - min) * (contentHeight - 0));
        };
        this.valueForPositionFn = (position: number) => {
            return min + (contentHeight - position) * (max - min) / contentHeight;
        };

        this.annotatedTicks.length = 0;
        for (const tick of calculatedTicks) {
            this.annotatedTicks.push({ y: positionForValueFn(tick), value: tick });
        }
        this.minTick = { y: positionForValueFn(dataMin), value: dataMin };
        this.maxTick = { y: positionForValueFn(dataMax), value: dataMax };

        this.annotatedHLines.length = 0;
        for (const hline of this.hlines) {
            this.annotatedHLines.push({
                ...hline,
                y: positionForValueFn(hline.value),
            });
        }

        // Draw order:
        // 1/ area fill (per line)
        // 2/ zero line (shared)
        // 3/ Low/High area (per line)
        // 4/ trace (per line)

        for (let i = 0; i < this.visibleLines.length; i++) {
            if (this.visibleLines[i].points.length) {
                const visibleLine = this.visibleLines[i];

                for (const point of visibleLine.points) {
                    point.drawInfo = {
                        renderX: Math.round(this.timeline.positionTime(point.x)),
                        renderX0: Math.round(this.timeline.distanceBetween(0, point.x)),
                        renderY: point.y !== null ? positionForValueFn(point.y) : undefined,
                    };
                }

                this.drawArea(g, visibleLine, positionForValueFn);
            }
        }

        for (let i = 0; i < this.visibleLines.length; i++) {
            if (this.visibleLines[i].points.length) {
                const visibleLine = this.visibleLines[i];
                this.drawLohi(g, visibleLine, positionForValueFn);
                this.drawLine(g, visibleLine);
            }
        }

        for (const hline of this.annotatedHLines) {
            this.drawHLine(g, hline);
        }
    }

    override drawSidebarContent(g: Graphics) {
        const font = `${this.labelTextSize}px ${this.labelFontFamily}`;

        const tickTextIsFullyVisible = (tick: AnnotatedTick) => {
            const y1 = tick.y - (this.labelTextSize / 2);
            const y2 = tick.y + (this.labelTextSize / 2);
            return y1 >= 0 && y2 <= this.contentHeight;
        };

        let visibleTicks = this.annotatedTicks.filter(tickTextIsFullyVisible);
        if (visibleTicks.length < 2 && this.minTick && this.maxTick) {
            visibleTicks = [this.minTick, this.maxTick];
        }

        let axisWidth = this.axisWidth;
        if (axisWidth === undefined) {
            for (const tick of visibleTicks) {
                const text = this.axisLabelFormatter(tick.value);
                const fm = g.measureText(text, font);
                const requiredWidth = this.labelPadding + fm.width + this.labelPadding + this.axisTickLength;
                if (axisWidth === undefined || axisWidth < requiredWidth) {
                    axisWidth = requiredWidth;
                }
            }
        }
        if (axisWidth === undefined) {
            axisWidth = 30;
        }

        g.fillRect({
            x: g.width - axisWidth,
            y: 0,
            width: axisWidth,
            height: this.contentHeight,
            fill: this.axisBackground,
        });

        if (this.axisRegion) {
            const hitRegion = g.addHitRegion(this.axisRegion);
            hitRegion.addRect(g.width - axisWidth, 0, axisWidth, this.contentHeight);
        }

        // Draw tick regardless of label visibility
        for (const tick of this.annotatedTicks) {
            const y = Math.round(tick.y) + 0.5;

            g.strokePath({
                color: this.axisTickColor,
                lineWidth: 1,
                path: new Path(g.width - this.axisTickLength, y).lineTo(g.width, y),
            });
        }

        for (const tick of visibleTicks) {
            const y = Math.round(tick.y) + 0.5;

            if (tickTextIsFullyVisible(tick)) {
                g.fillText({
                    text: this.axisLabelFormatter(tick.value),
                    align: 'right',
                    baseline: 'middle',
                    color: this.labelTextColor,
                    font,
                    x: g.width - this.axisTickLength - this.labelPadding,
                    y,
                });
            } else if (tick === this.minTick) {
                g.fillText({
                    text: this.axisLabelFormatter(tick.value),
                    align: 'right',
                    baseline: 'bottom',
                    color: this.labelTextColor,
                    font,
                    x: g.width - this.axisTickLength - this.labelPadding,
                    y: this.contentHeight + 0.5,
                });
            } else if (tick === this.maxTick) {
                g.fillText({
                    text: this.axisLabelFormatter(tick.value),
                    align: 'right',
                    baseline: 'top',
                    color: this.labelTextColor,
                    font,
                    x: g.width - this.axisTickLength - this.labelPadding,
                    y: 0.5,
                });
            }
        }

        for (const hline of this.annotatedHLines.filter(l => l.label !== undefined)) {
            const y = Math.round(hline.y) + 0.5;

            const label = this.axisLabelFormatter(hline.value);

            const font = `${this.labelTextSize}px ${this.labelFontFamily}`;
            const padding = this.labelPadding;

            const fm = g.measureText(label, font);

            const textBounds: Bounds = {
                x: g.width - this.axisTickLength - padding - fm.width - padding,
                y: y - padding - fm.height / 2,
                width: padding + fm.width + padding + this.axisTickLength + this.labelRadius,
                height: padding + fm.height + padding,
            };

            g.fillRect({
                ...textBounds,
                fill: hline.labelBackground ?? 'transparent',
                rx: this.labelRadius,
                ry: this.labelRadius,
            });
            g.strokePath({
                color: hline.labelTextColor ?? this.labelTextColor,
                lineWidth: 1,
                path: new Path(g.width - this.axisTickLength, y).lineTo(g.width, y),
            });
            g.fillText({
                x: textBounds.x + padding,
                y: textBounds.y + textBounds.height / 2,
                align: 'left',
                baseline: 'middle',
                color: hline.labelTextColor ?? this.labelTextColor,
                font,
                text: label,
            });
        }

        if (this.hoveredY !== undefined && this.valueForPositionFn) {
            const value = this.valueForPositionFn(this.hoveredY);
            const label = this.hoveredValueLabelFormatter(value);

            const font = `${this.labelTextSize}px ${this.labelFontFamily}`;
            const padding = this.labelPadding;

            const fm = g.measureText(label, font);

            // Offset to have radius only on rightside
            const xOffset = this.labelRadius;
            const textBounds: Bounds = {
                x: g.width - this.axisTickLength - padding - fm.width - padding,
                y: this.hoveredY - padding - fm.height / 2,
                width: padding + fm.width + padding + xOffset,
                height: padding + fm.height + padding,
            };

            // Stay within the band's bounds
            if (textBounds.y < 0) {
                textBounds.y = 0;
            } else if (textBounds.y + textBounds.height > this.contentHeight) {
                textBounds.y = this.contentHeight - textBounds.height;
            }

            g.fillRect({
                ...textBounds,
                fill: this.hoveredValueLabelBackground,
                rx: this.labelRadius,
                ry: this.labelRadius,
            });
            g.fillText({
                x: textBounds.x + padding,
                y: textBounds.y + textBounds.height / 2,
                align: 'left',
                baseline: 'middle',
                color: this.hoveredValueLabelTextColor,
                font,
                text: label,
            });
        }
    }

    private drawLohi(g: Graphics, line: AnnotatedLine, positionForValueFn: (value: number) => number) {
        const fill = line.lohiColor ?? this.lohiColor;
        const start0 = Math.round(this.timeline.distanceBetween(0, this.timeline.start));

        let combinedPath: Path | null = null;

        for (let i = 1; i < line.points.length; i++) {
            const prev = line.points[i - 1].drawInfo!;
            const prevLow = line.points[i - 1].low;
            const prevHigh = line.points[i - 1].high;

            const point = line.points[i].drawInfo!;
            const pointLow = line.points[i].low;
            const pointHigh = line.points[i].high;

            if (prev.renderY !== undefined
                && point.renderY !== undefined
                && prevLow !== undefined
                && prevHigh !== undefined
                && pointLow !== undefined
                && pointHigh !== undefined) {

                const prevX = prev.renderX0 - start0;
                const pointX = point.renderX0 - start0;
                const prevLowY = positionForValueFn(prevLow);
                const prevHighY = positionForValueFn(prevHigh);
                const pointLowY = positionForValueFn(pointLow);
                const pointHighY = positionForValueFn(pointHigh);

                if (!combinedPath) {
                    combinedPath = new Path(prevX, prevHighY);
                } else {
                    combinedPath.moveTo(prevX, prevHighY);
                }

                combinedPath.lineTo(prevX, prevLowY)
                    .lineTo(pointX, pointLowY)
                    .lineTo(pointX, pointHighY);
            }
        }

        if (combinedPath) {
            g.fillPath({
                path: combinedPath,
                fill,
            });
        }
    }

    private drawArea(g: Graphics, line: AnnotatedLine, positionForValueFn: (value: number) => number) {
        if (line.points.length < 2) {
            return;
        }
        const fill = line.fill ?? this.fill;
        const lineWidth = line.lineWidth ?? this.lineWidth;
        const lineStyle = line.lineStyle ?? this.lineStyle;
        const start0 = Math.round(this.timeline.distanceBetween(0, this.timeline.start));
        const originY = Math.round(positionForValueFn(0)) + 0.5;

        let combinedPath: Path | null = null;

        if (lineStyle === 'straight') {
            for (let i = 1; i < line.points.length; i++) {
                const prev = line.points[i - 1].drawInfo!;
                const point = line.points[i].drawInfo!;

                if (prev.renderY !== undefined && point.renderY !== undefined) {
                    const x0 = prev.renderX0 - start0;
                    const x1 = point.renderX0 - start0;

                    if (!combinedPath) {
                        combinedPath = new Path(x0, prev.renderY);
                    } else {
                        combinedPath.moveTo(x0, prev.renderY);
                    }

                    combinedPath.lineTo(x0, originY)
                        .lineTo(x1, originY)
                        .lineTo(x1, point.renderY);
                }
            }
        } else {
            const offset = lineWidth === 1 ? 0.5 : 0;
            for (let i = 1; i < line.points.length; i++) {
                const prev = line.points[i - 1].drawInfo!;
                const point = line.points[i].drawInfo!;

                if (prev.renderY !== undefined && point.renderY !== undefined) {
                    const prevX = prev.renderX0 - start0 + offset;
                    const prevY = Math.round(prev.renderY) + offset;
                    const pointX = point.renderX0 - start0 + offset;

                    if (!combinedPath) {
                        combinedPath = new Path(prevX, prevY);
                    } else {
                        combinedPath.moveTo(prevX, prevY);
                    }

                    combinedPath.lineTo(prevX, originY)
                        .lineTo(pointX, originY)
                        .lineTo(pointX, prevY);
                }
            }
        }

        if (combinedPath) {
            g.fillPath({
                path: combinedPath,
                fill,
            });
        }
    }

    private drawHLine(g: Graphics, hline: AnnotatedHLine) {
        const y = Math.round(hline.y) + 0.5;
        g.strokePath({
            path: new Path(0, y).lineTo(this.timeline.mainWidth, y),
            color: hline.lineColor,
            dash: hline.lineDash,
            lineWidth: hline.lineWidth ?? 1,
        });
        const label = hline.label;
        if (label) {
            const labelTextSize = this.labelTextSize;
            const labelFontFamily = this.labelFontFamily;
            const font = `${labelTextSize}px ${labelFontFamily}`;
            const fm = g.measureText(label, font);
            // Offset to have radius only on rightside
            const xOffset = this.labelRadius;
            g.fillRect({
                x: -xOffset,
                y: y - fm.height / 2 - this.labelPadding,
                width: xOffset + this.labelPadding + fm.width + this.labelPadding,
                height: this.labelPadding + fm.height + this.labelPadding,
                fill: hline.lineColor,
                rx: this.labelRadius,
                ry: this.labelRadius,
            });
            g.fillText({
                x: 0 + this.labelPadding,
                y: y,
                align: 'left',
                baseline: 'middle',
                color: hline.labelTextColor ?? this.labelTextColor,
                text: label,
                font,
            });
        }
    }

    private drawLine(g: Graphics, line: AnnotatedLine) {
        const lineColor = line.lineColor ?? this.lineColor;
        const lineWidth = line.lineWidth ?? this.lineWidth;
        const lineStyle = line.lineStyle ?? this.lineStyle;
        const pointColor = line.pointColor ?? this.pointColor;
        const pointRadius = line.pointRadius ?? this.pointRadius;

        const { points } = line;

        const start0 = Math.round(this.timeline.distanceBetween(0, this.timeline.start));

        // Draw trace
        if (lineWidth && points.length) {
            const path = new Path(points[0].drawInfo!.renderX0 - start0, points[0].drawInfo!.renderY ?? 0);

            if (lineStyle === 'straight') {
                for (let i = 1; i < points.length; i++) {
                    const prev = points[i - 1].drawInfo!;
                    const point = points[i].drawInfo!;
                    if (prev.renderY !== undefined && point.renderY !== undefined) {
                        path.lineTo(point.renderX0 - start0, point.renderY);
                    } else if (point.renderY !== undefined) {
                        path.moveTo(point.renderX0 - start0, point.renderY);
                    }
                }
            } else {
                const offset = lineWidth === 1 ? 0.5 : 0;
                for (let i = 1; i < points.length; i++) {
                    const prev = points[i - 1].drawInfo!;
                    const point = points[i].drawInfo!;
                    if (prev.renderY !== undefined && point.renderY !== undefined) {
                        const x = point.renderX0 - start0 + offset;
                        let y = Math.round(prev.renderY) + offset;
                        path.lineTo(x, y);
                        y = Math.round(point.renderY) + offset;
                        path.lineTo(x, y);
                    } else if (point.renderY !== undefined) {
                        const x = point.renderX0 - start0 + offset;
                        const y = Math.round(point.renderY) + offset;
                        path.moveTo(x, y);
                    }
                }
            }

            g.strokePath({
                path,
                color: lineColor,
                lineWidth,
                lineCap: 'butt',
                lineJoin: 'round',
            });
        }

        // Draw point symbols
        for (const point of points) {
            const { renderX0, renderY } = point.drawInfo!;
            if (renderY !== undefined) {
                g.fillEllipse({
                    cx: renderX0 - start0,
                    cy: renderY,
                    rx: point.pointRadius ?? pointRadius,
                    ry: point.pointRadius ?? pointRadius,
                    fill: point.pointColor ?? pointColor,
                });
            }
        }
    }

    override drawUnderlay(g: Graphics) {
        if (this.grid === 'underlay') {
            this.drawGrid(g);
        }
    }

    override drawOverlay(g: Graphics) {
        if (this.grid === 'overlay') {
            this.drawGrid(g);
        }
    }

    private drawGrid(g: Graphics) {
        const tickIsVisible = (tick: AnnotatedTick) => {
            const y = this.y + tick.y;
            return y >= this.y && y <= (this.y + this.contentHeight);
        };

        const path = new Path(0, 0);
        for (const tick of this.annotatedTicks) {
            if (tickIsVisible(tick)) {
                const y = Math.round(tick.y) + 0.5;
                path.moveTo(0, y);
                path.lineTo(g.width, y);
            }
        }
        g.strokePath({
            color: this.gridColor,
            path,
        });
    }

    private get visibleLines(): AnnotatedLine[] {
        return this.annotatedLines.filter(line => line.visible);
    }

    private findClosestByTime(t: number): Array<LinePoint | null> {
        // Note: closest may also be a gap
        const closestPoints: Array<LinePoint | null> = [];

        for (const line of this.visibleLines) {
            let currIdx: number | null = null;
            let currX: number | null = null;
            let currPoint: AnnotatedPoint | null = null;
            let tdelta = Infinity;
            for (let i = 0; i < line.points.length; i++) {
                const point = line.points[i];
                if (Math.abs(point.x - t) < tdelta) {
                    currIdx = i;
                    currX = point.x;
                    currPoint = line.points[i];

                    tdelta = Math.abs(point.x - t);
                }
            }

            // Avoid showing value for trailing gap
            let ignorePoint = (currIdx === line.points.length - 1) && currX !== t;

            // Avoid showing value beyond max distance
            if (currPoint !== null) {
                const x1 = this.timeline.positionTime(currPoint.x);
                const x2 = this.timeline.positionTime(t);
                const distance = Math.abs(x1 - x2);
                ignorePoint ||= distance > this.closestPointMaxDistance;
            }

            if (currPoint !== null && !ignorePoint) {
                closestPoints.push(currPoint.originalPoint);
            } else {
                closestPoints.push(null);
            }
        }

        return closestPoints;
    }

    override createMouseMoveEvent(evt: MouseHitEvent): LinePlotMouseMoveEvent {
        const mouseEvent = super.createMouseMoveEvent(evt);
        return {
            ...mouseEvent,
            points: this.findClosestByTime(mouseEvent.time),
        };
    }

    /**
     * Specify a custom data range for the Y-axis.
     *
     * If the `axisRangePadding` property is set, it will have no effect.
     */
    setAxisRange(min: number, max: number) {
        this._customMinimum = !isNaN(min) ? min : undefined;
        this._customMaximum = !isNaN(max) ? max : undefined;
        this.reportMutation();
    }

    /**
     * Reset any custom data range for the Y-axis.
     */
    resetAxisRange() {
        this._customMinimum = undefined;
        this._customMaximum = undefined;
        this.reportMutation();
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
     * Color of the line that connects data points.
     */
    get lineColor() { return this._lineColor; }
    set lineColor(lineColor: string) {
        this._lineColor = lineColor;
        this.reportMutation();
    }

    /**
     * Thickness of the plot line.
     */
    get lineWidth() { return this._lineWidth; }
    set lineWidth(lineWidth: number) {
        this._lineWidth = lineWidth;
        this.reportMutation();
    }

    /**
     * Plot line style (straight or step).
     */
    get lineStyle() { return this._lineStyle; }
    set lineStyle(lineStyle: LineStyle) {
        this._lineStyle = lineStyle;
        this.reportMutation();
    }

    /**
     * Area fill between the plot line and the value 0.
     */
    get fill() { return this._fill; }
    set fill(fill: FillStyle) {
        this._fill = fill;
        this.reportMutation();
    }

    /**
     * Color of the point symbol.
     */
    get pointColor() { return this._pointColor; }
    set pointColor(pointColor: string) {
        this._pointColor = pointColor;
        this.reportMutation();
    }

    /**
     * Color of the low/high area.
     */
    get lohiColor() { return this._lohiColor; }
    set lohiColor(lohiColor: string) {
        this._lohiColor = lohiColor;
        this.reportMutation();
    }

    /**
     * Whether to extend ticks over the entire canvas width
     */
    get grid() { return this._grid; }
    set grid(grid: GridLayer | undefined) {
        this._grid = grid;
        this.reportMutation();
    }

    /**
     * Color of the grid
     */
    get gridColor() { return this._gridColor; }
    set gridColor(gridColor: string) {
        this._gridColor = gridColor;
        this.reportMutation();
    }

    /**
     * Radius of the point symbol.
     */
    get pointRadius() { return this._pointRadius; }
    set pointRadius(pointRadius: number) {
        this._pointRadius = pointRadius;
        this.reportMutation();
    }

    /**
     * Font family of any value labels.
     */
    get labelFontFamily() { return this._labelFontFamily; }
    set labelFontFamily(labelFontFamily: string) {
        this._labelFontFamily = labelFontFamily;
        this.reportMutation();
    }

    /**
     * Text color of any value labels.
     */
    get labelTextColor() { return this._labelTextColor; }
    set labelTextColor(labelTextColor: string) {
        this._labelTextColor = labelTextColor;
        this.reportMutation();
    }

    /**
     * Background color of value labels.
     */
    get hoveredValueLabelBackground() { return this._hoveredValueLabelBackground; }
    set hoveredValueLabelBackground(hoveredValueLabelBackground: FillStyle) {
        this._hoveredValueLabelBackground = hoveredValueLabelBackground;
        this.reportMutation();
    }

    /**
     * Text color of value labels.
     */
    get hoveredValueLabelTextColor() { return this._hoveredValueLabelTextColor; }
    set hoveredValueLabelTextColor(hoveredValueLabelTextColor: string) {
        this._hoveredValueLabelTextColor = hoveredValueLabelTextColor;
        this.reportMutation();
    }

    /**
     * Size of any value labels.
     */
    get labelTextSize() { return this._labelTextSize; }
    set labelTextSize(labelTextSize: number) {
        this._labelTextSize = labelTextSize;
        this.reportMutation();
    }

    /**
     * Padding of value labels.
     */
    get labelPadding() { return this._labelPadding; }
    set labelPadding(labelPadding: number) {
        this._labelPadding = labelPadding;
        this.reportMutation();
    }

    /**
     * Corner radius of of value labels.
     */
    get labelRadius() { return this._labelRadius; }
    set labelRadius(labelRadius: number) {
        this._labelRadius = labelRadius;
        this.reportMutation();
    }

    /**
     * Function that formats an axis tick value to string. It is also
     * used to format hline values.
     *
     * The default behavior is to cast the number to a string.
     */
    get axisLabelFormatter() { return this._axisLabelFormatter; }
    set axisLabelFormatter(axisLabelFormatter: (value: number) => string) {
        this._axisLabelFormatter = axisLabelFormatter;
        this.reportMutation();
    }

    /**
     * Function that formats the hovered value.
     *
     * The default behavior is to format with 2 digits after the
     * decimal point.
     */
    get hoveredValueLabelFormatter() { return this._hoveredValueLabelFormatter; }
    set hoveredValueLabelFormatter(hoveredValueLabelFormatter: (value: number) => string) {
        this._hoveredValueLabelFormatter = hoveredValueLabelFormatter;
        this.reportMutation();
    }

    /**
     * Background color of the axis.
     */
    get axisBackground() { return this._axisBackground; }
    set axisBackground(axisBackground: FillStyle) {
        this._axisBackground = axisBackground;
        this.reportMutation();
    }

    /**
     * Color of axis ticks
     */
    get axisTickColor() { return this._axisTickColor; }
    set axisTickColor(axisTickColor: string) {
        this._axisTickColor = axisTickColor;
        this.reportMutation();
    }

    /**
     * Length of tick line
     */
    get axisTickLength() { return this._axisTickLength; }
    set axisTickLength(axisTickLength: number) {
        this._axisTickLength = axisTickLength;
        this.reportMutation();
    }

    /**
     * Axis width on the sidebar.
     *
     * If undefined, the width takes the space of the actual tick
     * label width.
     */
    get axisWidth() { return this._axisWidth; }
    set axisWidth(axisWidth: number | undefined) {
        this._axisWidth = axisWidth;
        this.reportMutation();
    }

    /**
     * Value that corresponds with the minimum value on the curve. If undefined,
     * the value is automatically derived from the plot data.
     */
    get minimum() { return this._minimum; }
    set minimum(minimum: number | undefined) {
        this._minimum = minimum;
        this.updatePlot();
        this.reportMutation();
    }

    /**
     * Current minimum value derived from user actions (by using `setAxisRange`).
     */
    get customMinimum() { return this._customMinimum; }

    /**
     * Current maximum value derived from user actions (by using `setAxisRange`).
     */
    get customMaximum() { return this._customMaximum; }

    /**
     * Returns the smallest visible value on the axis. This accounts for
     * axisRangePadding where applicable.
     */
    get visibleMinimum() {
        return this.valueForPositionFn!(this.contentHeight);
    }

    /**
     * Value that corresponds with the maximum value on the curve. If undefined,
     * the value is automatically derived from the plot data.
     */
    get maximum() { return this._maximum; }
    set maximum(maximum: number | undefined) {
        this._maximum = maximum;
        this.updatePlot();
        this.reportMutation();
    }

    /**
     * Returns the largest visible value on the axis. This accounts for
     * axisRangePadding where applicable.
     */
    get visibleMaximum() {
        return this.valueForPositionFn!(0);
    }

    /**
     * If true, ensure the 0 value is in the middle of the Y-axis.
     *
     * This property is ignored when `minimum` or `maximum` are explicitly set.
     */
    get centerZero() { return this._centerZero; }
    set centerZero(centerZero: boolean) {
        this._centerZero = centerZero;
        this.reportMutation();
    }

    /**
     * Add y-axis padding around the data. When autoscaling, additional space
     * is added both to the top and the bottom using the formula:
     * `axisRangePadding * data_range`.
     *
     * For example, if the data ranges from 0 to 10, the y-axis will show
     * 0 to 10 with an axisRangePadding of 0, and -1 to 11 with an
     * axisRangePadding of 0.1.
     *
     * This property is ignored at the bottom when `minimum` is explicitly
     * set, and it is ignored at the top when `maximum` is explicitly set.
     */
    get axisRangePadding() { return this._axisRangePadding; }
    set axisRangePadding(axisRangePadding: number) {
        this._axisRangePadding = axisRangePadding;
        this.reportMutation();
    }

    /**
     * If true, double-click on the viewport region will reset any
     * vertical zoom.
     */
    get resetAxisZoomOnDoubleClick() { return this._resetAxisZoomOnDoubleClick; }
    set resetAxisZoomOnDoubleClick(resetAxisZoomOnDoubleClick: boolean) {
        this._resetAxisZoomOnDoubleClick = resetAxisZoomOnDoubleClick;
        this.reportMutation();
    }

    /**
     * The larger this number, the faster to zoom in/out
     * A multiplier of 1 allows for a max zoom-in of twice the data range.
     */
    get zoomMultiplier() { return this._zoomMultiplier; }
    set zoomMultiplier(zoomMultiplier: number) {
        this._zoomMultiplier = zoomMultiplier;
    }

    /**
     * Impacts the closest points that are emitted on mouse-move events.
     * If the mouse is further than max distance away from the actual
     * closest point, that point is not emitted.
     */
    get closestPointMaxDistance() { return this._closestPointMaxDistance; }
    set closestPointMaxDistance(closestPointMaxDistance: number) {
        this._closestPointMaxDistance = closestPointMaxDistance;
        this.reportMutation();
    }

    get lines() { return this._lines; }
    set lines(lines: Line[]) {
        this._lines = lines;
        this.updatePlot();
        this.reportMutation();
    }

    get hlines() { return this._hlines; }
    set hlines(hlines: HLine[]) {
        this._hlines = hlines;
        this.reportMutation();
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();

        this.removeMouseMoveListener(this.mouseMoveListener);
        this.removeMouseLeaveListener(this.mouseLeaveListener);
    }
}
