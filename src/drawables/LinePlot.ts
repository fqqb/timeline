import { FillStyle, Graphics, Path } from '../graphics/Graphics';
import { HitRegionSpecification } from '../graphics/HitRegionSpecification';
import { TimelineEvent } from '../TimelineEvent';
import { Band } from './Band';
import { Line } from './Line';

/**
 * Event generated when a point on a LinePlot was clicked.
 */
export interface PointClickEvent extends TimelineEvent {
    /**
     * Time value of the clicked point.
     */
    time: number;

    /**
     * Value of the clicked point.
     */
    value: number | null;
}

/**
 * Event generated when a point on a LinePlot was hovered.
 */
export interface PointHoverEvent extends TimelineEvent {
    /**
     * Horizontal coordinate of the mouse pointer, relative to
     * the browser page.
     */
    clientX: number;

    /**
     * Vertical coordinate of the mouse pointer, relative to the
     * browser page.
     */
    clientY: number;

    /**
     * Time value of the hovered point.
     */
    time: number;

    /**
     * Value of the hovered point.
     */
    value: number | null;
}

interface AnnotatedLine {
    id: string;
    points: AnnotatedPoint[];
}

interface DrawInfo {
    renderX: number;
    renderY?: number;
}

interface AnnotatedPoint {
    x: number;
    y: number | null;
    region: HitRegionSpecification;
    hovered: boolean;
    drawInfo?: DrawInfo;
}

let lineSequence = 1;

/**
 * Band type that plots a line along the timeline.
 */
export class LinePlot extends Band {

    private _fill: FillStyle = 'transparent';
    private _lineColor = '#4f9146';
    private _lineWidth = 1;
    private _labelFontFamily = 'Verdana, Geneva, sans-serif';
    private _labelBackground: FillStyle = 'transparent';
    private _labelTextColor = '#333333';
    private _labelTextSize = 8;
    private _minimum?: number;
    private _maximum?: number;
    private _pointRadius = 1.5;
    private _pointHoverRadius = 4;
    private _pointColor = '#4f9146';
    private _lines: Line[] = [];
    private _contentHeight = 30;
    private _zeroLineColor = '#e8e8e8';
    private _zeroLineWidth = 0;
    private _zeroLineDash: number[] = [4, 3];
    private _labelFormatter: (value: number) => string = value => {
        return value.toFixed(2);
    };

    private annotatedLines: AnnotatedLine[] = [];
    private viewMinimum?: number;
    private viewMaximum?: number;

    private pointClickListeners: Array<(ev: PointClickEvent) => void> = [];
    private pointHoverListeners: Array<(ev: PointHoverEvent) => void> = [];

    /**
     * Register a listener that receives an update when a point on
     * a Line is clicked.
     */
    addPointClickListener(listener: (ev: PointClickEvent) => void) {
        this.pointClickListeners.push(listener);
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * click events.
     */
    removePointClickListener(listener: (ev: PointClickEvent) => void) {
        this.pointClickListeners = this.pointClickListeners.filter(el => (el !== listener));
    }

    /**
     * Register a listener that receives an update when a point on a
     * Line is hovered.
     */
    addPointHoverListener(listener: (ev: PointHoverEvent) => void) {
        this.pointHoverListeners.push(listener);
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * hover events.
     */
    removePointHoverListener(listener: (ev: PointHoverEvent) => void) {
        this.pointHoverListeners = this.pointHoverListeners.filter(el => (el !== listener));
    }

    private processData() {
        this.annotatedLines.length = 0;
        this.viewMinimum = this.minimum;
        this.viewMaximum = this.maximum;
        if (this.lines.length) {
            for (const line of this.lines) {
                const lineId = 'line_plot_' + lineSequence++;
                const annotatedPoints = [];
                for (const [x, y] of line.points) {
                    const annotatedPoint: AnnotatedPoint = {
                        x, y,
                        hovered: false,
                        region: {
                            id: lineId + '_' + x,
                            cursor: 'pointer',
                            click: () => {
                                this.pointClickListeners.forEach(listener => listener({
                                    time: annotatedPoint.x,
                                    value: annotatedPoint.y,
                                }));
                            },
                            mouseEnter: mouseEvent => {
                                annotatedPoint.hovered = true;
                                this.pointHoverListeners.forEach(listener => listener({
                                    clientX: mouseEvent.clientX,
                                    clientY: mouseEvent.clientY,
                                    time: annotatedPoint.x,
                                    value: annotatedPoint.y,
                                }));
                                this.reportMutation();
                            },
                            mouseOut: () => {
                                annotatedPoint.hovered = false;
                                this.reportMutation();
                            }
                        },
                    };
                    annotatedPoints.push(annotatedPoint);
                    if (this.minimum === undefined && y !== null) {
                        if (this.viewMinimum === undefined || y < this.viewMinimum) {
                            this.viewMinimum = y;
                        }
                    }
                    if (this.maximum === undefined && y !== null) {
                        if (this.viewMaximum === undefined || y > this.viewMaximum) {
                            this.viewMaximum = y;
                        }
                    }
                }
                annotatedPoints.sort((a, b) => a.x - b.x);
                this.annotatedLines.push({
                    id: lineId,
                    points: annotatedPoints,
                });
            }
        }
    }

    calculateContentHeight(g: Graphics) {
        return this._contentHeight;
    }

    drawBandContent(g: Graphics) {
        const { contentHeight } = this;
        const { viewMinimum: min, viewMaximum: max } = this;

        if (min !== undefined && max !== undefined) {

            // Plot max should align with mid of top label, and plot min with mid of bottom label.
            // So we add a little whitespace to the actually available plot area.
            // (unrelated to any other band margins)
            const margin = this.labelTextSize / 2;
            const plotHeight = contentHeight - margin - margin;
            const positionValueFn = (value: number) => {
                return contentHeight - margin - ((value - min) / (max - min) * (plotHeight - 0));
            };

            // Draw order:
            // 1/ area fill (per line)
            // 2/ zero line (shared)
            // 3/ trace (per line)

            for (let i = 0; i < this.lines.length; i++) {
                if (this.lines[i].points.size) {
                    const annotatedLine = this.annotatedLines[i];

                    for (const point of annotatedLine.points) {
                        point.drawInfo = {
                            renderX: Math.round(this.timeline.positionTime(point.x)),
                            renderY: point.y !== null ? positionValueFn(point.y) : undefined,
                        };
                    }

                    this.drawArea(g, this.lines[i], annotatedLine, positionValueFn);
                    this.drawLine(g, this.lines[i], annotatedLine);
                }
            }

            const originY = Math.round(positionValueFn(0)) - 0.5;
            g.strokePath({
                path: new Path(0, originY).lineTo(this.timeline.mainWidth, originY),
                color: this.zeroLineColor,
                dash: this.zeroLineDash,
                lineWidth: this.zeroLineWidth,
            });

            for (let i = 0; i < this.lines.length; i++) {
                if (this.lines[i].points.size) {
                    this.drawLine(g, this.lines[i], this.annotatedLines[i]);
                }
            }

            const tickLength = 5;
            const tickMargin = 2;
            const minY = Math.round(contentHeight - (this.labelTextSize / 2)) - 0.5;
            const maxY = Math.round(this.labelTextSize / 2) - 0.5;
            g.strokePath({
                path: new Path(this.timeline.mainWidth, minY)
                    .lineTo(this.timeline.mainWidth - tickLength, minY)
                    .moveTo(this.timeline.mainWidth, maxY)
                    .lineTo(this.timeline.mainWidth - tickLength, maxY),
                color: this.labelTextColor,
            });

            const font = `${this.labelTextSize}px ${this.labelFontFamily}`;
            const minText = this.labelFormatter(min);
            let fm = g.measureText(minText, font);
            g.fillRect({
                x: this.timeline.mainWidth - tickLength - tickMargin - fm.width,
                y: contentHeight - this.labelTextSize,
                width: fm.width,
                height: this.labelTextSize,
                fill: this.labelBackground,
            });
            const maxText = this.labelFormatter(max);
            fm = g.measureText(maxText, font);
            g.fillRect({
                x: this.timeline.mainWidth - tickLength - tickMargin - fm.width,
                y: 0,
                width: fm.width,
                height: this.labelTextSize,
                fill: this.labelBackground,
            });

            g.fillText({
                text: minText,
                align: 'right',
                baseline: 'bottom',
                color: this.labelTextColor,
                font,
                x: this.timeline.mainWidth - tickLength - tickMargin,
                y: contentHeight,
            });
            g.fillText({
                text: maxText,
                align: 'right',
                baseline: 'top',
                color: this.labelTextColor,
                font,
                x: this.timeline.mainWidth - tickLength - tickMargin,
                y: 0,
            });
        }
    }

    private drawArea(g: Graphics, line: Line, annotatedLine: AnnotatedLine,
        positionValueFn: (value: number) => number) {

        const fill = line.fill ?? this.fill;

        const originY = Math.round(positionValueFn(0)) + 0.5;
        for (let i = 1; i < annotatedLine.points.length; i++) {
            const prev = annotatedLine.points[i - 1].drawInfo!;
            const point = annotatedLine.points[i].drawInfo!;
            if (prev.renderY !== undefined && point.renderY !== undefined) {
                g.fillPath({
                    path: new Path(prev.renderX, prev.renderY)
                        .lineTo(prev.renderX, originY)
                        .lineTo(point.renderX, originY)
                        .lineTo(point.renderX, point.renderY),
                    fill,
                });
            }
        }
    }

    private drawLine(g: Graphics, line: Line, annotatedLine: AnnotatedLine) {
        const lineColor = line.lineColor ?? this.lineColor;
        const lineWidth = line.lineWidth ?? this.lineWidth;
        const pointColor = line.pointColor ?? this.pointColor;
        const pointRadius = line.pointRadius ?? this.pointRadius;
        const pointHoverRadius = line.pointHoverRadius ?? this.pointHoverRadius;

        const { points } = annotatedLine;

        // Draw trace
        const path = new Path(points[0].drawInfo!.renderX, points[0].drawInfo!.renderY ?? 0);
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1].drawInfo!;
            const point = points[i].drawInfo!;
            if (prev.renderY !== undefined && point.renderY !== undefined) {
                path.lineTo(point.renderX, point.renderY);
            } else if (point.renderY !== undefined) {
                path.moveTo(point.renderX, point.renderY);
            }
        }

        g.strokePath({
            path,
            color: lineColor,
            lineWidth,
            lineCap: 'round',
            lineJoin: 'round',
        });

        // Draw point symbols
        for (const point of points) {
            const { renderX, renderY } = point.drawInfo!;
            if (renderY !== undefined) {
                g.fillEllipse({
                    cx: renderX,
                    cy: renderY,
                    rx: point.hovered ? pointHoverRadius : pointRadius,
                    ry: point.hovered ? pointHoverRadius : pointRadius,
                    fill: pointColor,
                });

                const hitRegion = g.addHitRegion(point.region);
                hitRegion.addRect(renderX - pointHoverRadius,
                    renderY - pointHoverRadius,
                    2 * pointHoverRadius,
                    2 * pointHoverRadius);
            }
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
     * Color of the line that connects data points.
     */
    get lineColor() { return this._lineColor; }
    set lineColor(lineColor: string) {
        this.lineColor = lineColor;
        this.reportMutation();
    }

    /**
     * Thickness of the plot line.
     */
    get lineWidth() { return this._lineWidth; }
    set lineWidth(lineWidth: number) {
        this.lineWidth = lineWidth;
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
     * Radius of the point symbol.
     */
    get pointRadius() { return this._pointRadius; }
    set pointRadius(pointRadius: number) {
        this._pointRadius = pointRadius;
        this.reportMutation();
    }

    /**
     * Radius of the point symbol when hovered.
     */
    get pointHoverRadius() { return this._pointHoverRadius; }
    set pointHoverRadius(pointHoverRadius: number) {
        this._pointHoverRadius = pointHoverRadius;
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
     * Background color of any value labels.
     */
    get labelBackground() { return this._labelBackground; }
    set labelBackground(labelBackground: FillStyle) {
        this._labelBackground = labelBackground;
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
     * Size of any value labels.
     */
    get labelTextSize() { return this._labelTextSize; }
    set labelTextSize(labelTextSize: number) {
        this._labelTextSize = labelTextSize;
        this.reportMutation();
    }

    /**
     * Function that formats a point value to string.
     *
     * The default behaviour is to format with 2 digits after the
     * decimal point.
     */
    get labelFormatter() { return this._labelFormatter; }
    set labelFormatter(labelFormatter: (value: number) => string) {
        this._labelFormatter = labelFormatter;
        this.reportMutation();
    }

    /**
     * Color of the line at value zero.
     */
    get zeroLineColor() { return this._zeroLineColor; }
    set zeroLineColor(zeroLineColor: string) {
        this._zeroLineColor = zeroLineColor;
        this.reportMutation();
    }

    /**
     * Width of the line at value zero.
     */
    get zeroLineWidth() { return this._zeroLineWidth; }
    set zeroLineWidth(zeroLineWidth: number) {
        this._zeroLineWidth = zeroLineWidth;
        this.reportMutation();
    }

    /**
     * Dash pattern of the line at value zero.
     */
    get zeroLineDash() { return this._zeroLineDash; }
    set zeroLineDash(zeroLineDash: number[]) {
        this._zeroLineDash = zeroLineDash;
        this.reportMutation();
    }

    /**
     * Value that corresponds with the minimum value on the curve. If undefined,
     * the value is automatically derived from the plot data.
     */
    get minimum() { return this._minimum; }
    set minimum(minimum: number | undefined) {
        this._minimum = minimum;
        this.processData();
        this.reportMutation();
    }

    /**
     * Value that corresponds with the maximum value on the curve. If undefined,
     * the value is automatically derived from the plot data.
     */
    get maximum() { return this._maximum; }
    set maximum(maximum: number | undefined) {
        this._maximum = maximum;
        this.processData();
        this.reportMutation();
    }

    get lines() { return this._lines; }
    set lines(lines: Line[]) {
        this._lines = lines;
        this.processData();
        this.reportMutation();
    }
}
