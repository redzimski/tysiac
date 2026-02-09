"use strict";

function makeElement(tag, f = () => {}) {
    const elem = document.createElement(tag);
    f(elem);
    return elem;
}

function makeHtmlTable(array, f = (td, cell) => { td.innerText = String(cell); }) {
    return makeElement("table", table => {
        for(const row of array) {
            table.appendChild(makeElement("tr", tr => {
                for(const cell of row) {
                    tr.appendChild(makeElement("td", td => {
                        f(td, cell);
                    }));
                }
            }));
        }
    });
}

function makeHtmlTableSized(width, height, f) {
    return makeElement("table", table => {
        for(let y = 0; y < height; y++) {
            table.appendChild(makeElement("tr", tr => {
                for(let x = 0; x < width; x++) {
                    const td = makeElement("td");
                    tr.appendChild(td);
                    f(td, x, y);
                }
            }));
        }
    });
}

function assert(cond, msg = "assertion failed") {
    if(!cond) {
        throw new Error(msg);
    }
}

function zip(a, b) {
    return a.map((e, i) => [e, b[i]]);
}

function sendStringToDownload(filename, string, mimetype = "text/plain") {
    const link = document.createElement("a");
    const blob = new Blob([string], { type: mimetype });
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

function toB64(string) {
    let bytes = new Uint8Array(string.length * 2);
    for(let i = 0; i < string.length; i++) {
        let c = string.charCodeAt(i);
        bytes[2*i] = (c & 0xff);
        bytes[2*i+1] = ((c >> 8) & 0xff);
    }
    return bytes.toBase64();
}

function fromB64(b64) {
    let bytes = Uint8Array.fromBase64(b64);
    let string = "";
    for(let i = 0; i+1 < bytes.length; i += 2) {
        let cc = bytes[i] | (bytes[i+1] << 8);
        string += String.fromCharCode(cc);
    }
    return string;
}

Array.prototype.containsAllOf = function(subarray) {
    for(const v of subarray)
        if(!this.includes(v))
            return false;
    return true;
};

Array.prototype.unique = function(equals = (a,b) => a === b) {
    let ret = [];
    for(const e of this)
        if(!ret.some(a => equals(a, e)))
            ret.push(e);
    return ret;
};

Array.prototype.copy = function() {
    return this.slice();
}

Array.prototype.equals = function(other) {
    if(this.length !== other.length)
        return false;
    return this.every((x, i) => x === other[i]);
}

Array.prototype.zipWith = function(a) {
    return zip(this, a);
};

Array.prototype.removeAt = function(index) {
    return this.splice(index, 1)[0];
};

Array.prototype.insertAt = function(index, v) {
    this.splice(index, 0, v);
    return index;
};

Array.prototype.max = function(cb = null) {
    if(this.length === 0)
        return undefined;

    if(!cb)
        return Math.max.apply(null, this);

    let maxi = 0;
    let maxv = cb(this[0]);
    for(let i = 1; i < this.length; i++) {
        let v = cb(this[i]);
        if(v > maxv) {
            maxi = i;
            maxv = v;
        }
    }
    return this[maxi];
};

Array.prototype.min = function() {
    return Math.min.apply(null, this);
};

Array.prototype.mapIntoObject = function(f) {
    let ret = {};
    for(let i = 0; i < this.length; i++) {
        let [key, val] = f(this[i], i);
        ret[key] = val;
    }
    return ret;
};

Set.fromArray = function(a) {
    let s = new Set();
    a.forEach(e => s.add(e));
    return s;
};

Set.of = function(...args) {
    return Set.fromArray(args);
};

HTMLCollection.prototype.slice = function(index = 0) {
    let ret = [];
    for(; index < this.length; index++)
        ret.push(this[index]);
    return ret;
};

HTMLElement.prototype.show = function() {
    this.style.display = "revert-layer";
};

HTMLElement.prototype.hide = function() {
    this.style.display = "none";
};

function add(a, b) { return a + b; }
function isNull(x) { return !x; }
function isntNull(x) { return !!x; }

function isDigit(ch) { return "0123456789".includes(ch); }

function isNumeric(str) {
    if(str.length === 0)
        return false;
    if(str[0] === "-")
        str = str.substr(1);
    return Array.from(str).every(isDigit);
}
