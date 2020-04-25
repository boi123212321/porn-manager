import "../src/index";
import {
  isSingleWord,
  ignoreSingleNames,
  isMatchingItem,
  stripStr,
} from "../src/extractor";
import { expect } from "chai";
import { removeExtension } from "../src/types/utility";

describe("String functions", () => {
  describe("removeExtension", () => {
    const tests = require("./remove_extension.fixture").default;
    for (const test of tests)
      it("Should work as expected", () => {
        expect(removeExtension(test[0])).equals(test[1]);
      });
  });

  describe("isSingleWord", () => {
    for (const word of ["test", "", "1234", "numbermix1234"])
      it("Should be a seen as a single word", () => {
        expect(isSingleWord(word)).to.be.true;
      });

    for (const word of [
      "avi love",
      "some fairly long sentence",
      "even works with 124124 numbers",
    ])
      it("Should not be a seen as a single word", () => {
        expect(isSingleWord(word)).to.be.false;
      });
  });

  describe("ignoreSingleNames", () => {
    it("Should ignore single names", () => {
      expect(
        ignoreSingleNames(["", "name", "avi love", "kali roses"])
      ).deep.equals(["avi love", "kali roses"]);
    });

    it("Should not ignore regex", () => {
      expect(
        ignoreSingleNames(["(avi love)|(avi looove)", "[a-z]+"])
      ).deep.equals(["(avi love)|(avi looove)", "[a-z]+"]);
    });
  });

  describe("Strip string", () => {
    const tests = require("./strip_string.fixture").default;
    for (const test of tests)
      it("Should work as expected", () => {
        expect(stripStr(test[0])).equals(test[1]);
      });
  });

  describe("isMatchingItem", () => {
    const tests = require("./matching_actor.fixture").default;
    for (const test of tests)
      it("Should work as expected", () => {
        expect(isMatchingItem(test[0], test[1])).equals(test[2]);
      });
  });
});
