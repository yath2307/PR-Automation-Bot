"use strict";

const fs = require("fs");
var xml2js = require("xml2js");
var traverse = require('traverse');

// xmljs options https://github.com/Leonidas-from-XIV/node-xml2js#options
var XML2JS_OPTS = {
  trim: true,
  normalizeTags: true,
  normalize: true,
  mergeAttrs: true
};

// @ts-ignore
module.exports.parse = async function(xmlData, callback) {
  if (!xmlData) {
    throw new Error("You must provide the xml data");
  }

  // @ts-ignore
  // parse the xml provided by the api client.
  // @ts-ignore
  _parseWithXml2js(xmlData).then(function(result) {
    delete result.xmlContent;
    callback(null, result);

  }).catch(function (e) {
    callback(e);
  });
};

/**
 * @param {xml2js.convertableToString} xmlContent
 */
function _parseWithXml2js(xmlContent) {
  return new Promise(function(resolve, reject) {
    // parse the pom, erasing all
    xml2js.parseString(xmlContent, XML2JS_OPTS, function(err, pomObject) {
      if (err) {
        // Reject with the error
        reject(err);
      }

      // Replace the arrays with single elements with strings
      removeSingleArrays(pomObject);

      // Response to the call
      resolve({
        pomXml: xmlContent, // Only add the pomXml when loaded from the file-system.
        pomObject: pomObject // Always add the object
      });
    });
  });
}

/**
 * Removes all the arrays with single elements with a string value.
 * @param {object} obj is the object to be traversed.
 */
// @ts-ignore
function removeSingleArrays(obj) {
  // Traverse all the elements of the object
  traverse(obj).forEach(function traversing(value) {
    // As the XML parser returns single fields as arrays.
    if (value instanceof Array && value.length === 1) {
      this.update(value[0]);
    }
  });
}

// @ts-ignore
function readFileAsync(path, encoding) {
  return new Promise((resolve, reject) => fs.readFile(path, {encoding}, (err, data) => {
    if (err) {
      reject(err);
    } else {
      resolve(data);
    }
  }));
}
