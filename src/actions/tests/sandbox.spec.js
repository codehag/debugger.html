function init(text) {
  return text.split("\n");
}

const text = "1 + 1;\nvar x = 1 + 1;\nx + 2";
describe("Sandbox", () => {
  describe("initialization", () => {
    it("creates an array for each line", () => {
      expect(Array.isArray(init(text))).toBe(true);
    });
  });
});
