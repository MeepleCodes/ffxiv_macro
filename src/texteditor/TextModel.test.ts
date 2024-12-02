import { Position, TextDirection, TextModel } from './TextModel';
import { Font, RawFont } from './Font';
import fontfile from './../res/axis-12-lobby.json';
// import {expect} from '@jest/globals';
// import type {MatcherFunction} from 'expect';
import {describe, expect, test, vi } from 'vitest';
expect.extend({
    toBeSane(received: Position, expected: TextModel) {
        const cursor = received as Position;
        // This will have clamped to bounds, so we must also check cursor.c is in
        // range
        const inModel = expected.cursorFromC(cursor.c);
        const pass = cursor.c >=0 && cursor.c < expected.text.length &&
            inModel.row === cursor.row && inModel.col === cursor.col &&
            inModel.x === cursor.x && inModel.y === cursor.y;
        return {
            message: () => `expected cursor ${this.utils.printReceived(cursor)} to ${pass ? 'not ':''}have c within range ${this.utils.printExpected(`0-${expected.text.length}`)} and match model cursor ${this.utils.printExpected(inModel)}`,
            pass
        }
    }
});
declare module 'vitest' {
    interface Assertion<T = any> {
        toBeSane(model: TextModel): T;
    }
}
const modelTest = test.extend({
    model: new TextModel(new Font(fontfile as RawFont), "")
})
describe("text editing", () => {
    // const font = new Font(fontfile as RawFont);
    // let model = new TextModel(font, "");
    // beforeEach(() => {
    //     model = new TextModel(font, "");
    // })
    modelTest("simple insert", ({model}) => {
        model.reset("123");
        model.setCaretToC(1);
        model.insert("a");
        expect(model.text).toBe("1a23");
        expect(model.cursor.c).toBe(2);
        expect(model.cursor).toBeSane(model);
    });
    modelTest("insert replacing selection", ({model}) => {
        model.reset("123");
        model.setCaretToC(1, true);
        model.insert("a");
        expect(model.text).toBe("a23");
        expect(model.cursor.c).toBe(1);
        expect(model.cursor).toBeSane(model);
    });
    modelTest("simple backspace", ({model}) => {
        model.reset("123");
        model.setCaretToC(2);
        const selchange = vi.fn();
        model.addEventListener("selectionchange", selchange);
        model.delete(TextDirection.Backward);
        expect(selchange).toHaveBeenCalled();
        expect(model.text).toBe("13");
        expect(model.cursor).toBeSane(model);
        expect(model.cursor.c).toBe(1);
    });
});