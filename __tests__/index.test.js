let JsonSummary = require("../index");

let summarizerNoSample = new JsonSummary({arraySampleCount: 0});
let summarizerSampled = new JsonSummary({ arraySampleCount: 5 });

test("handles string", () => {
  let object = "Test";

  let summary = summarizerNoSample.summarize(object);

  expect(summary).toEqual({
    "example": "Test",
    "type": "string",
    "count": 1,
    "range": [4, 4]
  });
});

test("handles number", () => {
  let object = 20.2;

  let summary = summarizerNoSample.summarize(object);

  expect(summary).toEqual({
    example: 20.2,
    type: "number",
    "count": 1,
    "range": [20.2, 20.2]
  });
});

test("handles boolean", () => {
  let object = true;

  let summary = summarizerNoSample.summarize(object);

  expect(summary).toEqual({
    count: 1,
    example: true,
    type: "boolean"
  });
});

test("handles null", () => {
  let object = null;

  let summary = summarizerNoSample.summarize(object);

  expect(summary).toEqual({
    count: 1,
    example: null,
    type: "object"
  });
});

test("handles undefined", () => {
  let object = undefined;

  let summary = summarizerNoSample.summarize(object);

  expect(summary).toEqual({
    count: 1,
    example: undefined,
    type: "undefined"
  });
});

test("handles array", () => {
  let object = ["apple", "banana", "canteloupe"];

  let summary = summarizerNoSample.summarize(object);
  let summary2 = summarizerSampled.summarize(object);

  expect(summary).toEqual({
    count: 1,
    items: {
      0: {
        count: 1,
        example: "apple",
        type: "string",
        range: [5, 5]
      }
    },
    length: 3,
    type: "Array"
  });

  expect(summary2).toEqual({
    count: 1,
    items: {
      0: {
        count: 3,
        example: "apple",
        type: "string",
        range: [5, 10]
      }
    },
    length: 3,
    type: "Array"
  });
});

test('handles object', () => {
  let object = { a: 1 };

  let summary = summarizerNoSample.summarize(object);

  expect(summary).toEqual({
    "count": 1,
    "items": {a: {count: 1, type: "number", range: [1, 1], example: 1}},
    "keys": ["a"],
    "type": "Object"
  });
});

test("handles circular reference", () => {
  let object = {"x": 1};
  object.y = object;

  let summary = summarizerNoSample.summarize(object);

  expect(summary).toEqual({
    count: 1,
    items: {
      "x": {
        count: 1,
        example: 1,
        type: "number",
        range: [1, 1]
      },
      "y": {
        circular: true,
        type: "Object"
      }
    },
    keys: ["x", "y"],
    type: "Object"
  });
});

test("handles empty array", () => {
  let object = {
    a: []
  };

  let summary = summarizerNoSample.summarize(object);

  expect(summary).toEqual({
    count: 1,
    items: {
      a: {
        count: 1,
        length: 0,
        type: "Array"
      }
    },
    keys: ["a"],
    type: "Object"
  });
});

// does sampling using length 5 array so it is consistent

test("handles sampling string", () => {
  let object = ["apple", "orange", "pear", "kiwi", "canteloupe"];

  let summary = summarizerSampled.summarize(object);

  let expected = {
    count: 1,
    type: "Array",
    length: 5,
    items: {
      0: {
        count: 5,
        example: expect.any(String),
        type: "string",
        range: [4, 10]
      }
    }
  };

  expect(summary).toMatchObject(expected);
});

test("handles sampling number", () => {
  let object = [18.5, 26.9, 69.69, 80.1, 99.9];

  let summary = summarizerSampled.summarize(object);

  let expected = {
    count: 1,
    type: "Array",
    length: 5,
    items: {
      0: {
        example: expect.any(Number),
        type: "number",
        count: 5,
        range: [18.5, 99.9]
      }
    }
  };

  expect(summary).toMatchObject(expected);
});

test("handles sampling boolean", () => {
  let object = [true, false, false, true, true];

  let summary = summarizerSampled.summarize(object);

  let expected = {
    count: 1,
    type: "Array",
    length: 5,
    items: {
      0: {
        count: 5,
        example: expect.any(Boolean),
        type: "boolean"
      }
    }
  };

  expect(summary).toMatchObject(expected);
});