import { rgb2hex } from '@pixi/utils';
import { Application } from '../main';

// https://stackoverflow.com/a/4382138/3547036
// https://eleanormaclure.files.wordpress.com/2011/03/colour-coding.pdf
export const KELLY_COLORS = [
    0xFFB300, // Vivid Yellow
    0x803E75, // Strong Purple
    0xFF6800, // Vivid Orange
    0xA6BDD7, // Very Light Blue
    0xC10020, // Vivid Red
    0xCEA262, // Grayish Yellow
    0x817066, // Medium Gray

    // The following don't work well for people with defective color vision.
    0x007D34, // Vivid Green
    0xF6768E, // Strong Purplish Pink
    0x00538A, // Strong Blue
    0xFF7A5C, // Strong Yellowish Pink
    0x53377A, // Strong Violet
    0xFF8E00, // Vivid Orange Yellow
    0xB32851, // Strong Purplish Red
    0xF4C800, // Vivid Greenish Yellow
    0x7F180D, // Strong Reddish Brown
    0x93AA00, // Vivid Yellowish Green
    0x593315, // Deep Yellowish Brown
    0xF13A13, // Vivid Reddish Orange
    0x232C16, // Dark Olive Green
];

export function hsl2rgb(h: number, s: number, l: number): number[] {
    const a = s * Math.min(l, 1 - l);
    const f = (n: number, k = (n + h / 30) % 12): number => {
        return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    };
    return [f(0), f(8), f(4)];
}

export function getTempColor(badness: number): number {
    if (Number.isNaN(badness))
        badness = 0;

    const maxVal = 1.0;
    const minVal = 0.5;

    let r = maxVal;
    let g = maxVal;
    const b = minVal;
    if (badness < 0.5)
        r = minVal + ((maxVal - minVal) * (badness / 0.5));
    else
        g = maxVal - ((maxVal - minVal) * ((badness - 0.5) / 0.5));

    return rgb2hex([r, g, b]);

    const hue = (1 - badness) * 120;
    return rgb2hex(hsl2rgb(
        hue,
        Application.getInstance().tempColorSaturation,
        Application.getInstance().tempColorLightness
    ));
}

export function makeId(length: number): string {
    let res = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const len = chars.length;
    for (let i = 0; i < length; i++)
        res += chars.charAt(Math.floor(Math.random() * len));
    return res;
}
