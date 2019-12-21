export class DOMTarget {

    bbox?: { x: number, y: number, width: number, height: number; };

    onclick?: () => void;
    onmousemove?: () => void;
    onmouseout?: () => void;
}
