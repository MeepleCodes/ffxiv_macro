export interface RawFont {
    lineHeight: number;
    maxWidth: number;
    defaultGlyph: Glyph;
    glyphs: Glyph[];
    kerning: Kerning[];
    src: string;
}
export function isRawFont(arg: any): arg is RawFont {
    return arg && 
        typeof(arg.lineHeight === "number") && 
        arg.defaultGlyph && isGlyph(arg.defaultGlyph) &&
        Array.isArray(arg.glyphs) && arg.glyphs.length > 0 && arg.glyphs.every(isGlyph) &&
        Array.isArray(arg.kerning) && arg.kerning.every(isKerning) &&
        typeof(arg.src) === "string";
}
export type GlyphMap = {
    [codePoint: number]: Glyph
};
export type KerningMap = {
    [leftClass: number]: {
        [rightClass:number]: number
    }
}
export interface Font extends RawFont {
    glyphMap: GlyphMap;
    kerningMap: KerningMap;
}
/**
 * Turn a RawFont object into a Font object by creating the map properties.
 *
 * JSON doesn't allow numerical indexes for objects so we need to generate these
 * after the fact (it's also more space-efficient).
 *
 * The RawFont object is modified in-place (with Object.assign()) to avoid
 * needless copying
 *
 * @param raw The raw font
 * @returns The same object with the glyphMap and kerningMap properties added
 */
export function mapRawFont(raw: RawFont): Font {
    const glyphMap: GlyphMap = Object.fromEntries(raw.glyphs.map(glyph => [glyph.codepoint, glyph]));
    const kerningMap: KerningMap = Object.fromEntries(
        raw.kerning.map(group => [group.left, Object.fromEntries(
            group.kerning.map(row => [row.right, row.kern])
        )])
    );
    let asFont: Font = Object.assign(raw, {
        glyphMap,
        kerningMap
    });
    return asFont;
}
export interface Glyph {
    codepoint: number;
    x: number;
    y: number;
    w: number;
    h: number;
    top: number;
    right: number;
    kerningClass: number;
}
export function isGlyph(arg: any): arg is Glyph {
    return arg && 
        typeof(arg.codepoint) === "number" &&
        typeof(arg.x) === "number" &&
        typeof(arg.y) === "number" &&
        typeof(arg.w) === "number" &&
        typeof(arg.h) === "number" &&
        typeof(arg.top) === "number" &&
        typeof(arg.right) === "number" &&
        typeof(arg.kerningClass) === "number";
}
export interface Kerning {
    left: number;
    kerning: {right: number, kern: number}[];
}
export function isKerning(arg: any): arg is Kerning {
    return arg && 
        typeof(arg.left) === "number" &&
        Array.isArray(arg.kerning) && arg.kerning.every((k: any) => k && typeof(k.right) === "number" && typeof(k.kern) === "number");
}
export interface GlyphPage {
    name: string;
    start: number;
    end: number;
    glyphs: Glyph[];
}