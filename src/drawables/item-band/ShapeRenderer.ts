import { Bounds } from '../../graphics/Bounds';
import { Graphics } from '../../graphics/Graphics';
import { ShapeStyle } from './ShapeStyle';

export type ShapeRenderer = (g: Graphics, bounds: Bounds, style: ShapeStyle) => void;
