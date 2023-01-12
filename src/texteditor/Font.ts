export interface RawFont {
    lineHeight: number;
    maxWidth: number;
    defaultGlyph: Glyph;
    glyphs: Glyph[];
    kerning: Kerning[];
    src: string;
    blocks: CodeBlock[];
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
export class Font {
    glyphMap: GlyphMap;
    kerningMap: KerningMap;
    lineHeight: number;
    maxWidth: number;
    defaultGlyph: Glyph;
    glyphs: Glyph[];
    kerning: Kerning[];
    src: string;
    blocks: CodeBlock[]; 
    constructor(raw: RawFont) {
        this.lineHeight = raw.lineHeight;
        this.maxWidth = raw.maxWidth;
        this.defaultGlyph = raw.defaultGlyph;
        this.glyphs = raw.glyphs;
        this.kerning = raw.kerning;
        this.src = raw.src;
        this.glyphMap = Object.fromEntries(raw.glyphs.map(glyph => [glyph.codepoint, glyph]));
        this.kerningMap = Object.fromEntries(
            raw.kerning.map(group => [group.left, Object.fromEntries(
                group.kerning.map(row => [row.right, row.kern])
            )])
        );
        this.blocks = raw.blocks;
    }

    public glyph(codepoint?: number) {
        if(codepoint === undefined || !(codepoint in this.glyphMap)) return this.defaultGlyph;
        else return this.glyphMap[codepoint];
    }

    public getKerning(left: Glyph, right: Glyph) {
        return this.kerningMap[left.kerningClass]?.[right.kerningClass] || 0;
    }
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
export interface CodeBlock {
    name: string;
    start: number;
    end: number;
}
