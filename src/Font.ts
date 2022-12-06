export interface Font {
    line_height: number;
    default_glyph: Glyph;
    glyphs: {
        [index: string]: Glyph
    };
    kerning: Kerning[];
    src?: string;
}
export interface Glyph {
    codepoint: number;
    x: number;
    y: number;
    w: number;
    h: number;
    top: number;
    right: number;
    kern: number;
}
export interface Kerning {
    left: number;
    kerning: {right: number, kern: number}[];
}