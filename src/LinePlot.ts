import { Band } from './Band';
import { Graphics, Path } from './Graphics';
import { HitRegionSpecification } from './HitCanvas';
import { Line } from './Line';
import { Timeline } from './Timeline';

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

    private _lineColor = '#4f9146';
    private _lineWidth = 1;
    private _fillColor = 'transparent';
    private _labelFontFamily = 'Verdana, Geneva, sans-serif';
    private _labelTextColor = '#333333';
    private _labelTextSize = 8;
    private _minimum?: number;
    private _maximum?: number;
    private _pointRadius = 1.5;
    private _pointHoverRadius = 4;
    private _pointColor = '#4f9146';
    private _lines: Line[] = [];
    private _contentHeight = 30;
    private _labelFormatter: (value: number) => string = value => {
        return value.toFixed(2);
    };

    private annotatedLines: AnnotatedLine[] = [];
    private viewMinimum?: number;
    private viewMaximum?: number;

    constructor(timeline: Timeline) {
        super(timeline);
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
                            mouseEnter: () => {
                                annotatedPoint.hovered = true;
                                this.reportMutation();
                            },
                            mouseOut: evt => {
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

    /** @hidden */
    calculateContentHeight(g: Graphics) {
        return this._contentHeight;
    }

    /** @hidden */
    drawBandContent(g: Graphics) {
        const { contentHeight } = this;
        const { viewMinimum: min, viewMaximum: max } = this;

        if (min !== undefined && max !== undefined) {
            for (let i = 0; i < this.lines.length; i++) {
                if (this.lines[i].points.size) {
                    const annotatedLine = this.annotatedLines[i];
                    this.drawLine(g, this.lines[i], annotatedLine, min, max);
                }
            }

            g.fillText({
                text: this.labelFormatter(min),
                align: 'right',
                baseline: 'bottom',
                color: this.labelTextColor,
                font: `${this.labelTextSize}px ${this.labelFontFamily}`,
                x: this.timeline.mainWidth,
                y: contentHeight,
            });
            g.fillText({
                text: this.labelFormatter(max),
                align: 'right',
                baseline: 'top',
                color: this.labelTextColor,
                font: `${this.labelTextSize}px ${this.labelFontFamily}`,
                x: this.timeline.mainWidth,
                y: 0,
            });
        }
    }

    private drawLine(g: Graphics, line: Line, annotatedLine: AnnotatedLine, min: number, max: number) {
        const { contentHeight } = this;

        // Plot max should align with mid of top label, and plot min with mid of bottom label.
        // So we add a little whitespace to the actually available plot area.
        // (unrelated to any other band margins)
        const margin = this.labelTextSize / 2;
        const plotHeight = contentHeight - margin - margin;
        const positionValue = (value: number) => {
            return contentHeight - margin - ((value - min) / (max - min) * (plotHeight - 0));
        };

        const fillColor = line.fillColor ?? this.fillColor;
        const lineColor = line.lineColor ?? this.lineColor;
        const lineWidth = line.lineWidth ?? this.lineWidth;
        const pointColor = line.pointColor ?? this.pointColor;
        const pointRadius = line.pointRadius ?? this.pointRadius;
        const pointHoverRadius = line.pointHoverRadius ?? this.pointHoverRadius;

        const { points } = annotatedLine;

        for (const point of points) {
            point.drawInfo = {
                renderX: Math.round(this.timeline.positionTime(point.x)),
                renderY: point.y !== null ? positionValue(point.y) : undefined,
            };
        }

        // Draw trace
        const path = new Path(points[0].drawInfo!.renderX, points[0].drawInfo!.renderY ?? 0);
        const originY = positionValue(0);
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1].drawInfo!;
            const point = points[i].drawInfo!;
            if (prev.renderY !== undefined && point.renderY !== undefined) {
                path.lineTo(point.renderX, point.renderY);

                // Area fill
                g.fillPath({
                    path: new Path(prev.renderX, prev.renderY)
                        .lineTo(prev.renderX, originY)
                        .lineTo(point.renderX, originY)
                        .lineTo(point.renderX, point.renderY),
                    color: fillColor,
                });
            } else if (point.renderY !== undefined) {
                path.moveTo(point.renderX, point.renderY);
            }
        }

        g.strokePath({
            path,
            color: lineColor,
            lineWidth,
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
                    color: pointColor,
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
     * Color of the area between the plot line and the value 0.
     */
    get fillColor() { return this._fillColor; }
    set fillColor(fillColor: string) {
        this._fillColor = fillColor;
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
