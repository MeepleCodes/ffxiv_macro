import { Glyph } from '../../texteditor/Font';
// Import *a* font just to get the glyph list from it
import font from '../../axis-12-lobby.json';


export interface GlyphPage {
    name: string;
    ranges: ([number, number] | [number])[];
    glyphs: Glyph[];
}

export const glyphPages: GlyphPage[] = [
    {
        name: 'Useful', ranges: [
            [0x20], [0xAD], [0x3000], // 3px, 7px, 12px spaces
            [0x2010, 0x277E], // Punctuation off the latin/western pages
            [0x3001, 0x301f], // CJK punctuation, brackets and such
            [0xe000, 0xffff] // Private range (all the cool stuff)
        ], glyphs: []
    },
    { name: 'Latin etc', ranges: [[0, 0x2FFF]], glyphs: [] },
    { name: "CJK", ranges: [[0x3000, 0xDFFF]], glyphs: [] },
    { name: "Private", ranges: [[0xE000, 0xFFFF]], glyphs: [] },
];


// For each page, for each range within that page, make an array of glyphs in that range
// Later we'll flatten those back down again
export const pageRangeGlyphs: Glyph[][][] = glyphPages.map((page) => page.ranges.map(() => []));


// Skipping the weird duplicate space glyph at the start of the font data,
// iterate over each glyph and put it in the bucket for every range in every
// page that wants it We do it this way around because the glyphs are sparse
// within the total codepoint range so a range might specify [0xe000, 0xffff]
// but only contain a few dozen glyphs. This is much easier than trying to
// work out from the range which glyphs it should include
for(let glyph of font.glyphs.slice(1)) {
	for(const [p, page] of glyphPages.entries()) {
        for(const [r, [start, end]] of page.ranges.entries()) {
            if(end === undefined ? glyph.codepoint === start : (glyph.codepoint >= start && glyph.codepoint <= end)) {
                pageRangeGlyphs[p][r].push(glyph);
            }
        }
	}
}
// Collapse the buckets for each page's ranges down to a single array, but keep the order
for(const [p, page] of glyphPages.entries()) {
    page.glyphs = pageRangeGlyphs[p].flat();
}
