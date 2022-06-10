import { FillStyle, Graphics, Path } from './Graphics';
import { Bounds } from './positioning';

export interface ShapeStyle {
    fill: FillStyle;
    opacity: number;
    borderWidth: number;
    borderColor: string;
    borderDash?: number[];
}

export type ShapeRenderer = (g: Graphics, bounds: Bounds, style: ShapeStyle) => void;


export const drawDiamond: ShapeRenderer = (g: Graphics, bounds: Bounds, style: ShapeStyle) => {
    const rx = bounds.width / 2;
    const ry = bounds.height / 2;
    const path = new Path(bounds.x + rx, bounds.y)
        .lineTo(bounds.x + bounds.width, bounds.y + ry)
        .lineTo(bounds.x + rx, bounds.y + bounds.height)
        .lineTo(bounds.x, bounds.y + ry)
        .closePath();
    g.fillPath({
        path,
        fill: style.fill,
        opacity: style.opacity,
    });

    style.borderWidth && g.strokePath({
        path,
        color: style.borderColor,
        dash: style.borderDash,
        lineWidth: style.borderWidth,
        opacity: style.opacity,
    });
};

export const drawDot: ShapeRenderer = (g: Graphics, bounds: Bounds, style: ShapeStyle) => {
    g.fillEllipse({
        cx: bounds.x + bounds.width / 2,
        cy: bounds.y + bounds.height / 2,
        rx: 4,
        ry: 4,
        fill: style.fill,
        opacity: style.opacity,
    });
    style.borderWidth && g.strokeEllipse({
        cx: bounds.x + bounds.width / 2,
        cy: bounds.y + bounds.height / 2,
        rx: 4 - (style.borderWidth / 2),
        ry: 4 - (style.borderWidth / 2),
        color: style.borderColor,
        dash: style.borderDash,
        lineWidth: style.borderWidth,
        opacity: style.opacity,
    });
};

export const drawCircle: ShapeRenderer = (g: Graphics, bounds: Bounds, style: ShapeStyle) => {
    g.fillEllipse({
        cx: bounds.x + bounds.width / 2,
        cy: bounds.y + bounds.height / 2,
        rx: bounds.width / 2,
        ry: bounds.height / 2,
        fill: style.fill,
        opacity: style.opacity,
    });
    style.borderWidth && g.strokeEllipse({
        cx: bounds.x + bounds.width / 2,
        cy: bounds.y + bounds.height / 2,
        rx: (bounds.width / 2) - (style.borderWidth / 2),
        ry: (bounds.height / 2) - (style.borderWidth / 2),
        color: style.borderColor,
        dash: style.borderDash,
        lineWidth: style.borderWidth,
        opacity: style.opacity,
    });
};

export const drawTriangle: ShapeRenderer = (g: Graphics, bounds: Bounds, style: ShapeStyle) => {
    const path = new Path(bounds.x + (bounds.width / 2), bounds.y)
        .lineTo(bounds.x + bounds.width, bounds.y + bounds.height)
        .lineTo(bounds.x, bounds.y + bounds.height)
        .closePath();
    g.fillPath({
        fill: style.fill,
        path,
        opacity: style.opacity,
    });

    style.borderWidth && g.strokePath({
        path,
        color: style.borderColor,
        dash: style.borderDash,
        lineWidth: style.borderWidth,
        opacity: style.opacity,
    });
};

export const drawReverseTriangle: ShapeRenderer = (g: Graphics, bounds: Bounds, style: ShapeStyle) => {
    const path = new Path(bounds.x, bounds.y)
        .lineTo(bounds.x + bounds.width, bounds.y)
        .lineTo(bounds.x + (bounds.width / 2), bounds.y + bounds.height)
        .closePath();
    g.fillPath({
        fill: style.fill,
        path,
        opacity: style.opacity,
    });

    style.borderWidth && g.strokePath({
        path,
        color: style.borderColor,
        dash: style.borderDash,
        lineWidth: style.borderWidth,
        opacity: style.opacity,
    });
};
