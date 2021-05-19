import { sanitizeFileName } from "./strings";

describe("strings", () => {
  describe("fileNameSanitizer", () => {
    it("works", () => {
      expect(sanitizeFileName("That's All, Folks! - stay tuned")).toBe(
        "Thats All Folks - stay tuned"
      );
    });
  });
});
