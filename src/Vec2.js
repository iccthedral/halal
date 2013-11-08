define(
    function() {
        var Vec2 = {};

        Vec2.create = function() {
            var out = []; //or Int32Array
            out[0] = 0;
            out[1] = 0;
            return out;
        };

        Vec2.clone = function(a) {
            var out = [];
            out[0] = a[0];
            out[1] = a[1];
            return out;
        };

        Vec2.fromValues = function(x, y) {
            var out = [];
            out[0] = x;
            out[1] = y;
            return out;
        };

        Vec2.copy = function(out, a) {
            out[0] = a[0];
            out[1] = a[1];
            return out;
        };

        Vec2.set = function(out, x, y) {
            out[0] = x;
            out[1] = y;
            return out;
        };

        Vec2.add = function(out, a, b) {
            out[0] = a[0] + b[0];
            out[1] = a[1] + b[1];
            return out;
        };

        Vec2.subtract = function(out, a, b) {
            out[0] = a[0] - b[0];
            out[1] = a[1] - b[1];
            return out;
        };
        Vec2.sub = Vec2.subtract;

        Vec2.multiply = function(out, a, b) {
            out[0] = a[0] * b[0];
            out[1] = a[1] * b[1];
            return out;
        };
        Vec2.mul = Vec2.multiply;

        Vec2.divide = function(out, a, b) {
            out[0] = a[0] / b[0];
            out[1] = a[1] / b[1];
            return out;
        };
        Vec2.div = Vec2.divide;

        Vec2.min = function(out, a, b) {
            out[0] = Math.min(a[0], b[0]);
            out[1] = Math.min(a[1], b[1]);
            return out;
        };

        Vec2.max = function(out, a, b) {
            out[0] = Math.max(a[0], b[0]);
            out[1] = Math.max(a[1], b[1]);
            return out;
        };

        Vec2.scale = function(out, a, sc) {
            out[0] = a[0] * sc;
            out[1] = a[1] * sc;
            return out;
        };

        Vec2.scaleAndAdd = function(out, a, b, sc) {
            out[0] = a[0] + (b[0] * sc);
            out[1] = a[1] + (b[1] * sc);
            return out;
        };

        Vec2.distance = function(a, b) {
            var x = a[0] - b[0],
                y = a[1] - b[1];
            return Math.sqrt(x*x + y*y);
        };
        Vec2.dist = Vec2.distance;

        Vec2.sqDistance = function(a, b) {
            var x = a[0] - b[0],
                y = a[1] - b[1];
            return x*x + y*y;
        };
        Vec2.sqDist = Vec2.sqDistance;

        Vec2.length = function(a) {
            /*
             * Koliko bi ovo bilo brzo
             * kada ne bih kopirao vrednosti?
             */
            var x = a[0],
                y = a[1];
            return Math.sqrt(x*x + y*y);
        };
        Vec2.len = Vec2.length;

        Vec2.sqLength = function(a) {
            var x = a[0],
                y = a[1];
            return x*x + y*y;
        };
        Vec2.sqLen = Vec2.sqLength;

        Vec2.negate = function(out, a) {
            out[0] = -a[0];
            out[1] = -a[1];
            return out;
        };

        Vec2.normalize = function(out, a) {
            var x = a[0],
                y = a[1];
            var len = x*x + y*y;
            if(len > 0) {
                len = 1 / Math.sqrt(len);
                out[0] = a[0] * len;
                out[1] = a[1] * len;
            }
            return out;
        };

        Vec2.dot = function(a, b) {
            return a[0]*b[0] + a[1]*b[1];
        };

        Vec2.perp = function(a) {
            return Vec2.fromValues(a[1], -a[0]);
        };

        Vec2.clerp = function(out, a, b, t) {
            var ax = a[0],
                ay = a[1];
            out[0] = ax + t * (b[0] - ax);
            out[1] = ay + t * (b[1] - ay);
            return out;
        };
        
        Vec2.cross = function(a, b) {
            var z = a[0] * b[1] - a[1] * b[0];
            out[0] = out[1] = 0;
            out[2] = z;
            return out;
        };

        Vec2.lerp = function(out, a, b, t) {
            var ax = a[0],
                ay = a[1];
            out[0] = ax + t * (b[0] - ax);
            out[1] = ay + t * (b[1] - ay);
            return out;
        };

        Vec2.lerpInt = function(out, a, b, t) {
            var ax = a[0],
                ay = a[1];
            out[0] = Math.floor(ax + t * (b[0] - ax));
            out[1] = Math.floor(ay + t * (b[1] - ay));
            return out;
        };

        Vec2.random = function(out, sc) {
            sc = sc || 1;
            var r = Math.random() * 2 * Math.PI;
            out[0] = Math.cos(r) * sc;
            out[1] = Math.sin(r) * sc;
            return out;
        };

        Vec2.transformMat2 = function(out, a, m) {
            var x = a[0],
                y = a[1];
            out[0] = m[0] * x + m[2] * y;
            out[1] = m[1] * x + m[3] * y;
            return out;
        };

        Vec2.transformMat2d = function(out, a, m) {
            var x = a[0],
                y = a[1];
            out[0] = m[0] * x + m[2] * y + m[4];
            out[1] = m[1] * x + m[3] * y + m[5];
            return out;
        };

        /*
        [x] * [m11 m12 m13]
        [y]   [m21 m22 m23]
        [1]   [m31 m32 m33] = 
        x*m[0] + y*m[3] + z*m[6];
        x*m[1] + y*m[4] + z*m[7];
        x*m[2] + y*m[5] + z*m[8];
        */
        Vec2.transformMat3 = function(out, a, m) {
            var x = a[0],
                y = a[1];
            out[0] = x*m[0] + y*m[3] + m[6];
            out[1] = x*m[1] + y*m[4] + m[7];
            return out;
        };

        /*
        treca komponenta je implicitno 0
        [x] * [m11 m12 m13 m14]
        [y]   [m21 m22 m23 m24]
        [0]   [m31 m32 m33 m34]
        [1]   [m41 m42 m44 m44] = 
        x*m[0] + y*m[4] + z*m[8] + z'*m[12];
        x*m[1] + y*m[5] + z*m[9] + z'*m[13];
        x*m[2] + y*m[6] + z*m[10] + z'*m[14];
        x*m[3] + y*m[7] + z*m[11] + z'*m[15];
        */
        Vec2.transformMat4 = function(out, a, m) {
            var x = a[0],
                y = a[1];
            out[0] = x*m[0] + y*m[4] + m[12];
            out[1] = x*m[1] + y*m[5] + m[13];
            return out;
        };

        /* 
         * ova ideja mi se bas svidja, toji je zamislio da napravi
         * closure nad promenljivom koju ce da koristi u inner funkciji
         * @param {Array} a The array of vectors to iterate over
         * @param {Number} stride Number of elements between the start of 
         * of each Vec2. If 0 assumes tightly packed
         * @param {Number} offset Number of elements to skip at the 
         * beginning of the array
         * @param {Number} count Number of Vec2s to iterate over. If 0
         * iterates over the entire array
         * @param {Function} fn Function to call for each vector in the array
         * @param {Object} [arg] Additional arguments to pass to fn
         * @returns {Array} a
         * @function
         */
        Vec2.forEach = (function() {
            var vec = Vec2.create();
            return function(a, stride, offset, count, fn, arg) {
                var i, l;
                if(!stride) {
                    stride = 2; //we assume it's vec2
                }
                
                if(!offset) {
                    offset = 0;
                }

                if(count) {
                    l = Math.min((count * stride) + offset, a.length);
                } else {
                    l = a.length;
                }

                for(i = offset; i < l; i += stride) {
                    vec[0] = a[i];
                    vec[1] = a[i+1];
                    fn(vec, vec, arg);
                    a[i] = vec[0];
                    a[i+1] = vec[1];
                }

                return a;
            };
        }());

        Vec2.str = function(a) {
            return 'vec2(' + a[0] + ', ' + a[1] + ')';
        };
        /*
        Vec2.prototype = {
            clone: function() {
                return new Vec2(this.x, this.y);
            },
            add: function (v) {
                    this.x += v.x;
                    this.y += v.y;
                    return this;
            },
            sub: function(v) {
                this.x -= v.x;
                this.y -= v.y;
                return this;
            },
            normalize: function() {
                var len = 1 / this.length();
                this.x *= len;
                this.y *= len;
            },
            mul: function(sc) {
                this.x *= sc;
                this.y *= sc;
                return this;
            },
            dot: function(v) {
                return (this.x * this.x + v.y * v.y) / (this.length() * v.length());
            },
            angle: function(v, todeg) {
                var angrad = Math.acos(this.dot(v));
                return todeg ? angrad * 180/Math.PI : angrad;
            },
            length: function() {
                return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2)); //+ mathbox.epsilon?
            },
            equals: function(v) {
                //rounds to two decimal places
                return (Math.round((this.length() - v.length()) * 100) / 100) === 0;
            }
        }
        */
        return Vec2;
    }
);