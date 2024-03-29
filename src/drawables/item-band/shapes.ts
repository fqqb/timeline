import { Bounds } from '../../graphics/Bounds';
import { Graphics } from '../../graphics/Graphics';
import { Path } from '../../graphics/Path';
import { shrink } from '../../graphics/positioning';
import { ShapeRenderer } from './ShapeRenderer';
import { ShapeStyle } from './ShapeStyle';


export const drawDiamond: ShapeRenderer = (g: Graphics, bounds: Bounds, style: ShapeStyle) => {
    let rx = bounds.width / 2;
    let ry = bounds.height / 2;
    let path = new Path(bounds.x + rx, bounds.y)
        .lineTo(bounds.x + bounds.width, bounds.y + ry)
        .lineTo(bounds.x + rx, bounds.y + bounds.height)
        .lineTo(bounds.x, bounds.y + ry)
        .closePath();
    g.fillPath({
        path,
        fill: style.fill,
    });

    if (style.borderWidth) {
        // Draw borders within box
        bounds = shrink(bounds, style.borderWidth / 2);
        rx = bounds.width / 2;
        ry = bounds.height / 2;
        path = new Path(bounds.x + rx, bounds.y)
            .lineTo(bounds.x + bounds.width, bounds.y + ry)
            .lineTo(bounds.x + rx, bounds.y + bounds.height)
            .lineTo(bounds.x, bounds.y + ry)
            .closePath();
        g.strokePath({
            path,
            color: style.borderColor,
            dash: style.borderDash,
            lineWidth: style.borderWidth,
            lineCap: 'round',
            lineJoin: 'round',
        });
    }
};

export const drawDot: ShapeRenderer = (g: Graphics, bounds: Bounds, style: ShapeStyle) => {
    g.fillEllipse({
        cx: bounds.x + bounds.width / 2,
        cy: bounds.y + bounds.height / 2,
        rx: 4,
        ry: 4,
        fill: style.fill,
    });
    style.borderWidth && g.strokeEllipse({
        cx: bounds.x + bounds.width / 2,
        cy: bounds.y + bounds.height / 2,
        rx: 4 - (style.borderWidth / 2),
        ry: 4 - (style.borderWidth / 2),
        color: style.borderColor,
        dash: style.borderDash,
        lineWidth: style.borderWidth,
    });
};

export const drawCircle: ShapeRenderer = (g: Graphics, bounds: Bounds, style: ShapeStyle) => {
    g.fillEllipse({
        cx: bounds.x + bounds.width / 2,
        cy: bounds.y + bounds.height / 2,
        rx: bounds.width / 2,
        ry: bounds.height / 2,
        fill: style.fill,
    });
    style.borderWidth && g.strokeEllipse({
        cx: bounds.x + bounds.width / 2,
        cy: bounds.y + bounds.height / 2,
        rx: (bounds.width / 2) - (style.borderWidth / 2),
        ry: (bounds.height / 2) - (style.borderWidth / 2),
        color: style.borderColor,
        dash: style.borderDash,
        lineWidth: style.borderWidth,
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
    });

    style.borderWidth && g.strokePath({
        path,
        color: style.borderColor,
        dash: style.borderDash,
        lineWidth: style.borderWidth,
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
    });

    style.borderWidth && g.strokePath({
        path,
        color: style.borderColor,
        dash: style.borderDash,
        lineWidth: style.borderWidth,
    });
};
