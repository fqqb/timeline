export interface Event {
    start: number;
    stop: number;
    label?: string;
    /**
     * @deprecated use 'label' attribute
     */
    title?: string;
    color?: string;
    textColor?: string;
    textSize?: number;
    fontFamily?: string;
    borderColor?: string;
    borderWidth?: number;
    marginLeft?: number;
    cornerRadius?: number;
    data?: any;
}
