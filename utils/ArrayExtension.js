Array.remove = function(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}

Array.removeAll = function(arr, otherArray) {
    for (var i in otherArray) {
        Array.remove(arr, otherArray[i]);
    }
};

module.exports = Array;
