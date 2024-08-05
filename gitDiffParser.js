"use strict";

// @ts-ignore
function _createForOfIteratorHelper(o, allowArrayLike) {
    var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
    if (!it) {
        if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
            if (it) o = it;
            var i = 0;
            var F = function F() {};
            return {
                s: F,
                n: function n() {
                    if (i >= o.length) return {
                        done: true
                    };
                    return {
                        done: false,
                        value: o[i++]
                    }
                },
                // @ts-ignore
                e: function e(_e2) {
                    throw _e2
                },
                f: F
            }
        }
        throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")
    }
    var normalCompletion = true,
        didErr = false,
        // @ts-ignore
        err;
    return {
        s: function s() {
            it = it.call(o)
        },
        n: function n() {
            var step = it.next();
            normalCompletion = step.done;
            return step
        },
        // @ts-ignore
        e: function e(_e3) {
            didErr = true;
            err = _e3
        },
        f: function f() {
            try {
                if (!normalCompletion && it["return"] != null) it["return"]()
            } finally {
                // @ts-ignore
                if (didErr) throw err
            }
        }
    }
}

// @ts-ignore
function _defineProperty(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        })
    } else {
        obj[key] = value
    }
    return obj
}

// @ts-ignore
function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest()
}

function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")
}

// @ts-ignore
function _unsupportedIterableToArray(o, minLen) {
    // @ts-ignore
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen)
}

// @ts-ignore
function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for (var i = 0, arr2 = new Array(len); i < len; i++) {
        arr2[i] = arr[i]
    }
    return arr2
}

// @ts-ignore
function _iterableToArrayLimit(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
    // @ts-ignore
    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _s, _e;
    try {
        for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
            _arr.push(_s.value);
            if (i && _arr.length === i) break
        }
    } catch (err) {
        _d = true;
        _e = err
    } finally {
        try {
            if (!_n && _i["return"] != null) _i["return"]()
        } finally {
            if (_d) throw _e
        }
    }
    return _arr
}

// @ts-ignore
function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr
}
// @ts-ignore
module.exports = function(input) {
    if (!input) return [];
    if (typeof input !== "string" || input.match(/^\s+$/)) return [];
    var lines = input.split("\n");
    if (lines.length === 0) return [];
    // @ts-ignore
    var files = [];
    // @ts-ignore
    var currentFile = null;
    // @ts-ignore
    var currentChunk = null;
    var deletedLineCounter = 0;
    var addedLineCounter = 0;
    // @ts-ignore
    var currentFileChanges = null;
    // @ts-ignore
    var normal = function normal(line) {
        var _currentChunk;
        // @ts-ignore
        (_currentChunk = currentChunk) === null || _currentChunk === void 0 ? void 0 : _currentChunk.changes.push({
            type: "normal",
            normal: true,
            ln1: deletedLineCounter++,
            ln2: addedLineCounter++,
            content: line
        });
        // @ts-ignore
        currentFileChanges.oldLines--;
        // @ts-ignore
        currentFileChanges.newLines--
    };
    // @ts-ignore
    var start = function start(line) {
        var _parseFiles;
        var _ref = (_parseFiles = parseFiles(line)) !== null && _parseFiles !== void 0 ? _parseFiles : [],
            _ref2 = _slicedToArray(_ref, 2),
            // @ts-ignore
            fromFileName = _ref2[0],
            // @ts-ignore
            toFileName = _ref2[1];
        currentFile = {
            chunks: [],
            deletions: 0,
            additions: 0,
            from: fromFileName,
            to: toFileName
        };
        files.push(currentFile)
    };
    var restart = function restart() {
        // @ts-ignore
        if (!currentFile || currentFile.chunks.length) start()
    };
    var newFile = function newFile() {
        restart();
        // @ts-ignore
        currentFile["new"] = true;
        // @ts-ignore
        currentFile.from = "/dev/null"
    };
    var deletedFile = function deletedFile() {
        restart();
        // @ts-ignore
        currentFile.deleted = true;
        // @ts-ignore
        currentFile.to = "/dev/null"
    };
    // @ts-ignore
    var index = function index(line) {
        restart();
        // @ts-ignore
        currentFile.index = line.split(" ").slice(1)
    };
    // @ts-ignore
    var fromFile = function fromFile(line) {
        restart();
        // @ts-ignore
        currentFile.from = parseOldOrNewFile(line)
    };
    // @ts-ignore
    var toFile = function toFile(line) {
        restart();
        // @ts-ignore
        currentFile.to = parseOldOrNewFile(line)
    };
    // @ts-ignore
    var toNumOfLines = function toNumOfLines(number) {
        return +(number || 1)
    };
    // @ts-ignore
    var chunk = function chunk(line, match) {
        // @ts-ignore
        if (!currentFile) return;
        var _match$slice = match.slice(1),
            _match$slice2 = _slicedToArray(_match$slice, 4),
            // @ts-ignore
            oldStart = _match$slice2[0],
            // @ts-ignore
            oldNumLines = _match$slice2[1],
            // @ts-ignore
            newStart = _match$slice2[2],
            // @ts-ignore
            newNumLines = _match$slice2[3];
        deletedLineCounter = +oldStart;
        addedLineCounter = +newStart;
        currentChunk = {
            content: line,
            changes: [],
            oldStart: +oldStart,
            oldLines: toNumOfLines(oldNumLines),
            newStart: +newStart,
            newLines: toNumOfLines(newNumLines)
        };
        currentFileChanges = {
            oldLines: toNumOfLines(oldNumLines),
            newLines: toNumOfLines(newNumLines)
        };
        // @ts-ignore
        currentFile.chunks.push(currentChunk)
    };
    // @ts-ignore
    var del = function del(line) {
        // @ts-ignore
        if (!currentChunk) return;
        // @ts-ignore
        currentChunk.changes.push({
            type: "del",
            del: true,
            ln: deletedLineCounter++,
            content: line
        });
        // @ts-ignore
        currentFile.deletions++;
        // @ts-ignore
        currentFileChanges.oldLines--
    };
    // @ts-ignore
    var add = function add(line) {
        // @ts-ignore
        if (!currentChunk) return;
        // @ts-ignore
        currentChunk.changes.push({
            type: "add",
            add: true,
            ln: addedLineCounter++,
            content: line
        });
        // @ts-ignore
        currentFile.additions++;
        // @ts-ignore
        currentFileChanges.newLines--
    };
    // @ts-ignore
    var eof = function eof(line) {
        var _currentChunk$changes3;
        // @ts-ignore
        if (!currentChunk) return;
        // @ts-ignore
        var _currentChunk$changes = currentChunk.changes.slice(-1),
            _currentChunk$changes2 = _slicedToArray(_currentChunk$changes, 1),
            // @ts-ignore
            mostRecentChange = _currentChunk$changes2[0];
        // @ts-ignore
        currentChunk.changes.push((_currentChunk$changes3 = {
            type: mostRecentChange.type
        }, _defineProperty(_currentChunk$changes3, mostRecentChange.type, true), _defineProperty(_currentChunk$changes3, "ln1", mostRecentChange.ln1), _defineProperty(_currentChunk$changes3, "ln2", mostRecentChange.ln2), _defineProperty(_currentChunk$changes3, "ln", mostRecentChange.ln), _defineProperty(_currentChunk$changes3, "content", line), _currentChunk$changes3))
    };
    var schemaHeaders = [
        [/^diff\s/, start],
        [/^new file mode \d+$/, newFile],
        [/^deleted file mode \d+$/, deletedFile],
        [/^index\s[\da-zA-Z]+\.\.[\da-zA-Z]+(\s(\d+))?$/, index],
        [/^---\s/, fromFile],
        [/^\+\+\+\s/, toFile],
        [/^@@\s+-(\d+),?(\d+)?\s+\+(\d+),?(\d+)?\s@@/, chunk],
        [/^\\ No newline at end of file$/, eof]
    ];
    var schemaContent = [
        [/^-/, del],
        [/^\+/, add],
        [/^\s+/, normal]
    ];
    // @ts-ignore
    var parseContentLine = function parseContentLine(line) {
        var _iterator = _createForOfIteratorHelper(schemaContent),
            _step;
        try {
            for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var _step$value = _slicedToArray(_step.value, 2),
                    // @ts-ignore
                    pattern = _step$value[0],
                    // @ts-ignore
                    handler = _step$value[1];
                var match = line.match(pattern);
                if (match) {
                    handler(line, match);
                    break
                }
            }
        } catch (err) {
            _iterator.e(err)
        } finally {
            _iterator.f()
        }
        // @ts-ignore
        if (currentFileChanges.oldLines === 0 && currentFileChanges.newLines === 0) {
            currentFileChanges = null
        }
    };
    // @ts-ignore
    var parseHeaderLine = function parseHeaderLine(line) {
        var _iterator2 = _createForOfIteratorHelper(schemaHeaders),
            _step2;
        try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var _step2$value = _slicedToArray(_step2.value, 2),
                    // @ts-ignore
                    pattern = _step2$value[0],
                    // @ts-ignore
                    handler = _step2$value[1];
                var match = line.match(pattern);
                if (match) {
                    handler(line, match);
                    break
                }
            }
        } catch (err) {
            _iterator2.e(err)
        } finally {
            _iterator2.f()
        }
    };
    // @ts-ignore
    var parseLine = function parseLine(line) {
        // @ts-ignore
        if (currentFileChanges) {
            parseContentLine(line)
        } else {
            parseHeaderLine(line)
        }
        return
    };
    var _iterator3 = _createForOfIteratorHelper(lines),
        _step3;
    try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var line = _step3.value;
            parseLine(line)
        }
    } catch (err) {
        _iterator3.e(err)
    } finally {
        _iterator3.f()
    }
    // @ts-ignore
    return files
};
var fileNameDiffRegex = /a\/.*(?=["']? ["']?b\/)|b\/.*$/g;
var gitFileHeaderRegex = /^(a|b)\//;
// @ts-ignore
var parseFiles = function parseFiles(line) {
    var fileNames = line === null || line === void 0 ? void 0 : line.match(fileNameDiffRegex);
    // @ts-ignore
    return fileNames === null || fileNames === void 0 ? void 0 : fileNames.map(function(fileName) {
        return fileName.replace(gitFileHeaderRegex, "").replace(/("|')$/, "")
    })
};
var qoutedFileNameRegex = /^\\?['"]|\\?['"]$/g;
// @ts-ignore
var parseOldOrNewFile = function parseOldOrNewFile(line) {
    var fileName = leftTrimChars(line, "-+").trim();
    fileName = removeTimeStamp(fileName);
    return fileName.replace(qoutedFileNameRegex, "").replace(gitFileHeaderRegex, "")
};
// @ts-ignore
var leftTrimChars = function leftTrimChars(string, trimmingChars) {
    string = makeString(string);
    // @ts-ignore
    if (!trimmingChars && String.prototype.trimLeft) return string.trimLeft();
    var trimmingString = formTrimmingString(trimmingChars);
    return string.replace(new RegExp("^".concat(trimmingString, "+")), "")
};
var timeStampRegex = /\t.*|\d{4}-\d\d-\d\d\s\d\d:\d\d:\d\d(.\d+)?\s(\+|-)\d\d\d\d/;
// @ts-ignore
var removeTimeStamp = function removeTimeStamp(string) {
    var timeStamp = timeStampRegex.exec(string);
    if (timeStamp) {
        string = string.substring(0, timeStamp.index).trim()
    }
    return string
};
// @ts-ignore
var formTrimmingString = function formTrimmingString(trimmingChars) {
    if (trimmingChars === null || trimmingChars === undefined) return "\\s";
    else if (trimmingChars instanceof RegExp) return trimmingChars.source;
    return "[".concat(makeString(trimmingChars).replace(/([.*+?^=!:${}()|[\]/\\])/g, "\\$1"), "]")
};
// @ts-ignore
var makeString = function makeString(itemToConvert) {
    return (itemToConvert !== null && itemToConvert !== void 0 ? itemToConvert : "") + ""
};