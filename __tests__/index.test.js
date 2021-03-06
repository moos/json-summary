// let JsonSummary = require("../index");

import JsonSummary from "../index";

import { JSDOM } from "jsdom";

import testData from "./testdata.json";

// let summarizerNoSample = new JsonSummary({arraySampleCount: 0});
// let summarizerSampled = new JsonSummary({ arraySampleCount: 5 });

test("handles string", () => {
  let object = "Test";

  let summary = JsonSummary.summarize(object, { arraySampleCount: 0 });

  expect(summary).toEqual({
    example: "Test",
    type: "string",
    count: 1,
    range: [4, 4],
  });
});

test("handles number", () => {
  let object = 20.2;

  let summary = JsonSummary.summarize(object, { arraySampleCount: 0 });

  expect(summary).toEqual({
    example: 20.2,
    type: "number",
    count: 1,
    range: [20.2, 20.2],
  });
});

test("handles boolean", () => {
  let object = true;

  let summary = JsonSummary.summarize(object, { arraySampleCount: 0 });

  expect(summary).toEqual({
    count: 1,
    example: true,
    type: "boolean",
  });
});

test("handles null", () => {
  let object = null;

  let summary = JsonSummary.summarize(object, { arraySampleCount: 0 });

  expect(summary).toEqual({
    count: 1,
    example: null,
    type: "object",
  });
});

test("handles undefined", () => {
  let object = undefined;

  let summary = JsonSummary.summarize(object, { arraySampleCount: 0 });

  expect(summary).toEqual({
    count: 1,
    example: undefined,
    type: "undefined",
  });
});

test("handles array", () => {
  let object = ["apple", "banana", "canteloupe"];

  let summary = JsonSummary.summarize(object, { arraySampleCount: 0 });
  let summary2 = JsonSummary.summarize(object, { arraySampleCount: 5 });

  expect(summary).toEqual({
    count: 1,
    items: {
      0: {
        count: 1,
        example: "apple",
        type: "string",
        range: [5, 5],
      },
    },
    length: 3,
    type: "Array",
  });

  expect(summary2).toEqual({
    count: 1,
    items: {
      0: {
        count: 3,
        example: "apple",
        type: "string",
        range: [5, 10],
      },
    },
    length: 3,
    type: "Array",
  });
});

test("handles object", () => {
  let object = { a: 1 };

  let summary = JsonSummary.summarize(object, { arraySampleCount: 0 });

  expect(summary).toEqual({
    count: 1,
    items: { a: { count: 1, type: "number", range: [1, 1], example: 1 } },
    keys: ["a"],
    type: "Object",
  });
});

test("handles circular reference", () => {
  let object = { x: 1 };
  object.y = object;

  let summary = JsonSummary.summarize(object, { arraySampleCount: 0 });

  expect(summary).toEqual({
    count: 1,
    items: {
      x: {
        count: 1,
        example: 1,
        type: "number",
        range: [1, 1],
      },
      y: {
        circular: true,
        type: "Object",
      },
    },
    keys: ["x", "y"],
    type: "Object",
  });
});

test("handles empty array", () => {
  let object = {
    a: [],
  };

  let summary = JsonSummary.summarize(object, { arraySampleCount: 0 });

  expect(summary).toEqual({
    count: 1,
    items: {
      a: {
        count: 1,
        length: 0,
        items: {
          0: undefined,
        },
        type: "Array",
      },
    },
    keys: ["a"],
    type: "Object",
  });
});

// does sampling using length 5 array so it is consistent

test("handles sampling string", () => {
  let object = ["apple", "orange", "pear", "kiwi", "canteloupe"];

  let summary = JsonSummary.summarize(object, { arraySampleCount: 5 });

  let expected = {
    count: 1,
    type: "Array",
    length: 5,
    items: {
      0: {
        count: 5,
        example: expect.any(String),
        type: "string",
        range: [4, 10],
      },
    },
  };

  expect(summary).toMatchObject(expected);
});

test("handles sampling number", () => {
  let object = [18.5, 26.9, 69.69, 80.1, 99.9];

  let summary = JsonSummary.summarize(object, { arraySampleCount: 5 });

  let expected = {
    count: 1,
    type: "Array",
    length: 5,
    items: {
      0: {
        example: expect.any(Number),
        type: "number",
        count: 5,
        range: [18.5, 99.9],
      },
    },
  };

  expect(summary).toMatchObject(expected);
});

test("handles sampling boolean", () => {
  let object = [true, false, false, true, true];

  let summary = JsonSummary.summarize(object, { arraySampleCount: 5 });

  let expected = {
    count: 1,
    type: "Array",
    length: 5,
    items: {
      0: {
        count: 5,
        example: expect.any(Boolean),
        type: "boolean",
      },
    },
  };

  expect(summary).toMatchObject(expected);
});

test("handles sampling array", () => {
  let object = [[], [2, 3], [4, 5, 6], [7, 8], [1]];

  let summary = JsonSummary.summarize(object, { arraySampleCount: 5 });

  let expected = {
    count: 1,
    type: "Array",
    length: 5,
    items: {
      0: {
        count: 5,
        type: "Array",
        length: 1.6,
        items: {
          0: {
            type: "number",
            count: 8,
            range: [1, 8],
            example: expect.any(Number),
          },
        },
      },
    },
  };

  expect(summary).toMatchObject(expected);
});

test("handles sampling object", () => {
  let object = [
    { a: 1 },
    { b: 2, c: 3 },
    { a: 2, b: null, c: 6 },
    { a: 3, c: 9, d: 12 },
    { d: 2, e: 5 },
  ];

  let summary = JsonSummary.summarize(object, { arraySampleCount: 5 });

  let expected = {
    count: 1,
    items: {
      "0": {
        count: 5,
        items: {
          a: {
            count: 3,
            example: expect.any(Number),
            range: [1, 3],
            type: "number",
          },
          b: {
            count: 1,
            example: expect.any(Number),
            range: [2, 2],
            type: "number",
          },
          c: {
            count: 3,
            example: expect.any(Number),
            range: [3, 9],
            type: "number",
          },
          d: {
            count: 2,
            example: expect.any(Number),
            range: [2, 12],
            type: "number",
          },
          e: {
            count: 1,
            example: expect.any(Number),
            range: [5, 5],
            type: "number",
          },
        },
        keys: ["a", "b", "c", "d", "e"],
        type: "Object",
      },
    },
    length: 5,
    type: "Array",
  };

  expect(summary).toMatchObject(expected);
});

test("can output html string", () => {
  let object = testData;

  object.f.w = object;

  let summary = JsonSummary.summarize(object);

  let frag = JSDOM.fragment(JsonSummary.printSummary(summary));

  // has a theme
  expect(frag.querySelector(".theme")).not.toBeNull();

  // has a json-summary-wrapper
  expect(frag.querySelector(".json-summary-wrapper")).not.toBeNull();
});

test("can output text string", () => {
  let object = testData;

  object.f.w = object;

  let summary = JsonSummary.summarize(object);

  let text = JsonSummary.printSummary(summary, { asText: true });

  console.log(text);

  expect(text).not.toBeNull();
  expect(text).toBeDefined();
});
