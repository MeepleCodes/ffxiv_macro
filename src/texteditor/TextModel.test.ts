import { Position, TextDirection, TextModel } from './TextModel';
import { Font, RawFont } from './Font';
import fontfile from './../res/axis-12-lobby.json';
import {expect} from '@jest/globals';
import type {MatcherFunction} from 'expect';
const toBeSane: MatcherFunction<[model: TextModel]> = function(actual: unknown, model: TextModel) {
    const cursor = actual as Position;
    // This will have clamped to bounds, so we must also check cursor.c is in
    // range
    const inModel = model.cursorFromC(cursor.c);
    const pass = cursor.c >=0 && cursor.c < model.text.length &&
        inModel.row === cursor.row && inModel.col === cursor.col &&
        inModel.x === cursor.x && inModel.y === cursor.y;
    return {
        message: () => `expected cursor ${this.utils.printReceived(cursor)} to ${pass ? 'not ':''}have c within range ${this.utils.printExpected(`0-${model.text.length}`)} and match model cursor ${this.utils.printExpected(inModel)}`,
        pass
    }
}
expect.extend({toBeSane});
declare module 'expect' {
    interface AsymmetricMatchers {
        toBeSane(model: TextModel): void;
    }
    interface Matchers<R> {
        toBeSane(model: TextModel): R;
    }
  }
describe("text editing", () => {
    const font = new Font(fontfile as RawFont);
    let model = new TextModel(font, "");
    beforeEach(() => {
        model = new TextModel(font, "");
    })
    test("simple insert", () => {
        model.reset("123");
        model.setCaretToC(1);
        model.insert("a");
        expect(model.text).toBe("1a23");
        expect(model.cursor.c).toBe(2);
        expect(model.cursor).toBeSane(model);
    });
    test("insert replacing selection", () => {
        model.reset("123");
        model.setCaretToC(1, true);
        model.insert("a");
        expect(model.text).toBe("a23");
        expect(model.cursor.c).toBe(1);
        expect(model.cursor).toBeSane(model);
    });
    test("simple backspace", () => {
        model.reset("123");
        model.setCaretToC(2);
        const selchange = jest.fn();
        model.addEventListener("selectionchange", selchange);
        model.delete(TextDirection.Backward);
        expect(selchange).toHaveBeenCalled();
        expect(model.text).toBe("13");
        expect(model.cursor).toBeSane(model);
        expect(model.cursor.c).toBe(1);
    });
});