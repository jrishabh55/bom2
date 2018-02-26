Array.prototype.last = function(n = 1) {
    return this.slice(Math.max(this.length - n, 0));
}
