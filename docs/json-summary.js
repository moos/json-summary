// https://andrewtburks.dev/json-summary v0.1.5 Copyright 2019 Andrew Burks
(function (global, factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
typeof define === 'function' && define.amd ? define(factory) :
(global = global || self, global.jsonSummary = factory());
}(this, function () { 'use strict';

const summarizer = (function() {
  let defaultOptions = {
    arraySampleCount: 10,
    indentation:  " ", // or "\t"
    indentCount: 2,
    showExampleValue: true,
    startExpanded: false
  };

  // summarizer utility class
  return function({
      arraySampleCount = 10,
      indentation =  " ", // or "\t"
      indentCount = 2,
      showExampleValue = true,
      startExpanded = false
    } = defaultOptions) {

    let options = {
      arraySampleCount,
      indentation,
      indentCount,
      showExampleValue,
      startExpanded
    };
  
    // utility function to extract overall json structure without printing entire data object
    function summarizeJSON(data) {
      let summary = summarizeItem(data);
  
      // clean up the marking
      unmarkObject(data);
  
      return summary;
    }
  
    function summarizeItem(item) {
      let summarize = {
        Array: arr => {
          let summarized = {};
  
          summarized.type = "Array";
          summarized.length = arr.length;

          // recurse to items in the array
          if (arr.length) {
            let numToSample = Math.min(arraySampleCount, arr.length);
            let sampledItems = {};
  
            while (numToSample > 0) {
              let sampleIndex = Math.floor(Math.random() * arr.length);
  
              if (!sampledItems[sampleIndex]) {
                sampledItems[sampleIndex] = arr[sampleIndex];
                numToSample--;
              }
            }
  
            let summarizedSamples = [];
  
            for (let [idx, item] of Object.entries(sampledItems)) {
              summarizedSamples.push(summarizeItem(item));
            }
  
            let joinedSample = joinSampledArray(summarizedSamples);

            console.log(joinedSample);

            summarized.items = {
              0: joinedSample
            };
          }
  
          return summarized;
        },
        Object: obj => {
          let summarized = {};
  
          summarized.type = "Object";
          summarized.keys = Object.keys(obj);
  
          summarized.items = {};
  
          for (let key of summarized.keys) {
            summarized.items[key] = summarizeItem(obj[key]);
          }
  
          return summarized;
        },
        Other: data => {
          let range;

          if (typeof data === "string") {
            range = [data.length, data.length];
          } else if (typeof data === "number") {
            range = [data, data];
          }

          return {
            type: typeof data,
            example: data,
            count: 1,
            range
          };
        }
      };
  
      let type = "Other";
  
      if (item instanceof Array) {
        type = "Array";
      } else if (item instanceof Object) {
        type = "Object";
      }
  
      if (item && item["*snippets_mark*"]) {
        return {
          type: type,
          circular: true
        };
      } else {
        // marked as visited to make sure it doesn't hit a circular structure
        if (type !== "Other") {
          Object.defineProperty(item, "*snippets_mark*", {
            enumerable: false,
            writable: true,
            configurable: true
          });
          item["*snippets_mark*"] = true;
        }
  
        return summarize[type](item);
      }
    }
  
    function joinSampledArray(itemset) {
      console.log("joinSampledArray", itemset);

      // let type = itemset.map(d => d.type)
      //   .reduce((a, type) => {
      //     a[type] = [];
      //     return a;
      //   }, {});

      // for (let item of itemset) {
      //   type[item.type].push(item);
      // }

      // let joins = {};

      // for (let [t, itemset] of Object.entries(type)) {
      //   joins[t] = joinItems(itemset, t);
      // }

      // console.log(joins);

      // return 

      // assume theyre all a matching type
      let type = itemset[0].type;

      return joinItems(itemset, type);
    }

    function joinItems(itemArr, type) {
      console.log("joinItems", itemArr, type);

      let joiner = {
        string: function(items) {
          // string length range
          let min = items.reduce((acc, item) => {
            return Math.min(acc, item.range[0]);
          }, Infinity);

          let max = items.reduce((acc, item) => {
            return Math.max(acc, item.range[1]);
          }, -Infinity);

          let joinedString = {
            type: "string",
            example: items[0].example,
            range: [min, max],
            count: items.reduce((a, i) => a + i.count, 0)
          };

          console.log(joinedString);

          return joinedString;
        },
        number: function(items) {
          let min = items.reduce((acc, item) => {
            return Math.min(acc, item.range[0]);
          }, Infinity);

          let max = items.reduce((acc, item) => {
            return Math.max(acc, item.range[1]);
          }, -Infinity);

          let joinedNumber = {
            type: "number",
            example: items[0].example,
            range: [min, max],
            count: items.reduce((a, i) => a + i.count, 0)
          };

          console.log(joinedNumber);

          return joinedNumber;
        },
        boolean: function(items) {
          return {
            type: "number",
            example: items[0].example,
            count: items.reduce((a, i) => a + i.count, 0)
          };
        },
        Object: function(items) {
          let masterKeys = {};
          console.log("join objects", items);

          for (let obj of items) {
            for (let key of obj.keys) {
              !masterKeys[key] && (masterKeys[key] = []);

              masterKeys[key].push(obj.items[key]);
            }
          }

          let joinedObject = { type: "Object", keys: [], items: {}, count: items.length };

          for (let key of Object.keys(masterKeys)) {
            joinedObject.keys.push(key);

            joinedObject.items[key] = joinSampledArray(masterKeys[key]);
          }

          return joinedObject;
        },
        Array: function(items) {
          console.log("join arrays", items);

          let joinedArrays = joinSampledArray(items.map(i => i.items[0]));

          console.log(joinedArrays);

          return joinedArrays;
        }
      };

      return joiner[type](itemArr);
    }

    function unmarkObject(obj) {
      if (obj && obj["*snippets_mark*"]) {
        delete obj["*snippets_mark*"];
  
        // recurse to the next level
        if (obj instanceof Array && obj.length) {
          unmarkObject(obj[0]);
        } else if (obj instanceof Object) {
          for (let key of Object.keys(obj)) {
            unmarkObject(obj[key]);
          }
        }
      }
    }

    // utility function to stringify the summary output from summarizeJSON
    function printSummarizedJSON(summary) {
      // start at 0 indentation
      return printSummaryLevel(summary, 0);
    }
  
    function printSummaryLevel(data, l) {
      let string = "";
  
      if (data.circular) {
        string += wrapInHTML("(circular reference)", "circular");
      } else if (data.type === "Object") {
        string += "{";
  
        let keys = data.keys.map(k => `'${k}'`).join(", ");
  
        string += wrapInHTML(keys, "keys");
  
        let childStrings = data.keys.map(key => {
          return printSummaryLevel(data.items[key], l + 1);
        });
  
        if (childStrings.length) {
          let childStringCombined = "\n";
  
          for (let i = 0; i < data.keys.length; i++) {
            childStringCombined += options.indentation.repeat(
              (l + 1) * options.indentCount
            );
  
            childStringCombined += wrapInHTML(data.keys[i], "name") + ": ";
  
            childStringCombined += childStrings[i];
  
            if (i < data.keys.length - 1) {
              childStringCombined += ",";
            }
  
            childStringCombined += "\n";
          }
  
          childStringCombined += options.indentation.repeat(l * options.indentCount);
  
          string += wrapInHTML(childStringCombined, "child");
        }
  
        string += "}";
  
        string = wrapInHTML(string, "layer");
      } else if (data.type === "Array") {
        // string += "[]";
        // string += `[ ${data.length ? `(${data.length}×)` : "∅"} `;
        string += wrapInHTML(`(${data.length})`, "length") + ` [`;
  
        if (data.length) {
          let needsNewlines =
            data.items["0"].type === "Object" || data.items["0"].type === "Array";
  
          if (needsNewlines) {
            string += "\n" + options.indentation.repeat((l + 1) * options.indentCount);
          }
  
          string += printSummaryLevel(data.items["0"], l + 1);
  
          if (needsNewlines) {
            string += "\n" + options.indentation.repeat(l * options.indentCount);
          }
        }
  
        string += "]";
  
        // string = wrapInHTML(string, "layer");
      } else {
        if (data.example == null || data.example == undefined) {
          string += wrapInHTML("?", "type");
        } else {
          string += wrapInHTML(data.type, "type");
        }
  
        if (options.showExampleValue) {
          string += wrapInHTML(data.example, "value", data.type);
        }
      }
  
      return string;
    }
  
    function wrapInHTML(value, role, type) {
      let tags = {
        type: `<span class="json-summary json-summary-type json-summary-type-${value}">&lt;${value}&gt;</span>`,
        value: `<span class="json-summary json-summary-value json-summary-value-${type}">${value}</span>`,
        name: `<span class="json-summary json-summary-name">${value}</span>`,
        length: `<span class="json-summary json-summary-length">${value}</span>`,
        circular: `<span class="json-summary json-summary-circular">${value}</span>`,
        layer: `<span class="json-summary json-summary-checkbox ${options.startExpanded ? "checked" : ""}">
              <input type="checkbox" ${options.startExpanded ? "checked" : ""}>
              <span class="json-summary-checkboxmarker" onclick="(function(me){
                me.parentNode.classList.toggle('checked');
              })(this)"></span>
            </span><div class="json-summary json-summary-layer">${value}</div>`,
        child: `<div class="json-summary json-summary-child">${value}</div>`,
        keys: `<span class="json-summary json-summary-keys">${value}</span>`
      };
  
      return tags[role];
    }
  
    return {
      summarize: summarizeJSON,
      printSummary: printSummarizedJSON
    };
  }
}());

return summarizer;

}));