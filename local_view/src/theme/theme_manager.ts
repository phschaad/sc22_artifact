import { ColorTheme } from './color_theme';

export class ThemeManager {

    private static readonly INSTANCE = new ThemeManager();

    private constructor() {
    }

    public static getInstance(): ThemeManager {
        return this.INSTANCE;
    }

    private theme: ColorTheme = new ColorTheme();

    public get activeTheme(): ColorTheme {
        return this.theme;
    }

    public set activeTheme(theme: ColorTheme) {
        this.theme = theme;
    }

}
