import { Path } from './Path';

/**
 * Properties to be provided with {@link Graphics.strokePath}.
 */
export interface PathStroke {
    path: Path;
    color: string;
    lineWidth?: number;
    lineCap?: CanvasLineCap;
    lineJoin?: CanvasLineJoin;
    dash?: number[];
}
