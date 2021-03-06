/*
 * blz模块声明
 */
;
(function (fn) {
	'use strict';
	/* jshint ignore:start */
	if (typeof define === 'function' && define.amd) {
		define(['jQuery'], function () {
			return fn(window.jQuery || window.Zepto);
		});
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = fn(window.jQuery || window.Zepto);
	} else {
		fn(window.jQuery || window.Zepto);
	}
	/* jshint ignore:end */
}(function ($) {
	'use strict';

	var w = window,
		d = document;

	// 初始化requestAnimationFrame接口；
	(function () {
		if (!w.requestAnimationFrame) {
			w.requestAnimationFrame = w.webkitRequestAnimationFrame || w.mozRequestAnimationFrame || w.oRequestAnimationFrame || w.msRequestAnimationFrame || function (callback) {
				w.setTimeout(callback, 1000 / 60);
			};
			return w.requestAnimationFrame;
		} else {
			return w.requestAnimationFrame;
		}
	})();

	// init shaders
	function initShaders(gl, vshader, fshader) {
		var program = createProgram(gl, vshader, fshader);
		if (!program) {
			console.log('Failed to create program');
			return false;
		}

		gl.useProgram(program);
		gl.program = program;

		return true;
	}

	function createProgram(gl, vshader, fshader) {
		// Create shader object
		var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
		var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);
		if (!vertexShader || !fragmentShader) {
			return null;
		}

		// Create a program object
		var program = gl.createProgram();
		if (!program) {
			return null;
		}

		// Attach the shader objects
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);

		// Link the program object
		gl.linkProgram(program);

		// Check the result of linking
		var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
		if (!linked) {
			var error = gl.getProgramInfoLog(program);
			console.log('Failed to link program: ' + error);
			gl.deleteProgram(program);
			gl.deleteShader(fragmentShader);
			gl.deleteShader(vertexShader);
			return null;
		}
		return program;
	}

	function loadShader(gl, type, source) {
		// Create shader object
		var shader = gl.createShader(type);
		if (shader == null) {
			console.log('unable to create shader');
			return null;
		}

		// Set the shader program
		gl.shaderSource(shader, source);

		// Compile the shader
		gl.compileShader(shader);

		// Check the result of compilation
		var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
		if (!compiled) {
			var error = gl.getShaderInfoLog(shader);
			console.log('Failed to compile shader: ' + error);
			gl.deleteShader(shader);
			return null;
		}

		return shader;
	}

	/*
	 * Matrix4
	 */

	var Matrix4 = function (opt_src) {
		var i, s, d;
		if (opt_src && typeof opt_src === 'object' && opt_src.hasOwnProperty('elements')) {
			s = opt_src.elements;
			d = new Float32Array(16);
			for (i = 0; i < 16; ++i) {
				d[i] = s[i];
			}
			this.elements = d;
		} else {
			this.elements = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
		}
	};

	/**
	 * Set the identity matrix.
	 * @return this
	 */
	Matrix4.prototype.setIdentity = function () {
		var e = this.elements;
		e[0] = 1;
		e[4] = 0;
		e[8] = 0;
		e[12] = 0;
		e[1] = 0;
		e[5] = 1;
		e[9] = 0;
		e[13] = 0;
		e[2] = 0;
		e[6] = 0;
		e[10] = 1;
		e[14] = 0;
		e[3] = 0;
		e[7] = 0;
		e[11] = 0;
		e[15] = 1;
		return this;
	};

	/**
	 * Copy matrix.
	 * @param src source matrix
	 * @return this
	 */
	Matrix4.prototype.set = function (src) {
		var i, s, d;

		s = src.elements;
		d = this.elements;

		if (s === d) {
			return;
		}

		for (i = 0; i < 16; ++i) {
			d[i] = s[i];
		}

		return this;
	};

	/**
	 * Multiply the matrix from the right.
	 * @param other The multiply matrix
	 * @return this
	 */
	Matrix4.prototype.concat = function (other) {
		var i, e, a, b, ai0, ai1, ai2, ai3;

		// Calculate e = a * b
		e = this.elements;
		a = this.elements;
		b = other.elements;

		// If e equals b, copy b to temporary matrix.
		if (e === b) {
			b = new Float32Array(16);
			for (i = 0; i < 16; ++i) {
				b[i] = e[i];
			}
		}

		for (i = 0; i < 4; i++) {
			ai0 = a[i];
			ai1 = a[i + 4];
			ai2 = a[i + 8];
			ai3 = a[i + 12];
			e[i] = ai0 * b[0] + ai1 * b[1] + ai2 * b[2] + ai3 * b[3];
			e[i + 4] = ai0 * b[4] + ai1 * b[5] + ai2 * b[6] + ai3 * b[7];
			e[i + 8] = ai0 * b[8] + ai1 * b[9] + ai2 * b[10] + ai3 * b[11];
			e[i + 12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];
		}

		return this;
	};
	Matrix4.prototype.multiply = Matrix4.prototype.concat;

	/**
	 * Multiply the three-dimensional vector.
	 * @param pos  The multiply vector
	 * @return The result of multiplication(Float32Array)
	 */
	Matrix4.prototype.multiplyVector3 = function (pos) {
		var e = this.elements;
		var p = pos.elements;
		var v = new Vector3();
		var result = v.elements;

		result[0] = p[0] * e[0] + p[1] * e[4] + p[2] * e[8] + e[11];
		result[1] = p[0] * e[1] + p[1] * e[5] + p[2] * e[9] + e[12];
		result[2] = p[0] * e[2] + p[1] * e[6] + p[2] * e[10] + e[13];

		return v;
	};

	/**
	 * Multiply the four-dimensional vector.
	 * @param pos  The multiply vector
	 * @return The result of multiplication(Float32Array)
	 */
	Matrix4.prototype.multiplyVector4 = function (pos) {
		var e = this.elements;
		var p = pos.elements;
		var v = new Vector4();
		var result = v.elements;

		result[0] = p[0] * e[0] + p[1] * e[4] + p[2] * e[8] + p[3] * e[12];
		result[1] = p[0] * e[1] + p[1] * e[5] + p[2] * e[9] + p[3] * e[13];
		result[2] = p[0] * e[2] + p[1] * e[6] + p[2] * e[10] + p[3] * e[14];
		result[3] = p[0] * e[3] + p[1] * e[7] + p[2] * e[11] + p[3] * e[15];

		return v;
	};

	/**
	 * Transpose the matrix.
	 * @return this
	 */
	Matrix4.prototype.transpose = function () {
		var e, t;

		e = this.elements;

		t = e[1];
		e[1] = e[4];
		e[4] = t;
		t = e[2];
		e[2] = e[8];
		e[8] = t;
		t = e[3];
		e[3] = e[12];
		e[12] = t;
		t = e[6];
		e[6] = e[9];
		e[9] = t;
		t = e[7];
		e[7] = e[13];
		e[13] = t;
		t = e[11];
		e[11] = e[14];
		e[14] = t;

		return this;
	};

	/**
	 * Calculate the inverse matrix of specified matrix, and set to this.
	 * @param other The source matrix
	 * @return this
	 */
	Matrix4.prototype.setInverseOf = function (other) {
		var i, s, d, inv, det;

		s = other.elements;
		d = this.elements;
		inv = new Float32Array(16);

		inv[0] = s[5] * s[10] * s[15] - s[5] * s[11] * s[14] - s[9] * s[6] * s[15] +
			s[9] * s[7] * s[14] + s[13] * s[6] * s[11] - s[13] * s[7] * s[10];
		inv[4] = -s[4] * s[10] * s[15] + s[4] * s[11] * s[14] + s[8] * s[6] * s[15] -
			s[8] * s[7] * s[14] - s[12] * s[6] * s[11] + s[12] * s[7] * s[10];
		inv[8] = s[4] * s[9] * s[15] - s[4] * s[11] * s[13] - s[8] * s[5] * s[15] +
			s[8] * s[7] * s[13] + s[12] * s[5] * s[11] - s[12] * s[7] * s[9];
		inv[12] = -s[4] * s[9] * s[14] + s[4] * s[10] * s[13] + s[8] * s[5] * s[14] -
			s[8] * s[6] * s[13] - s[12] * s[5] * s[10] + s[12] * s[6] * s[9];

		inv[1] = -s[1] * s[10] * s[15] + s[1] * s[11] * s[14] + s[9] * s[2] * s[15] -
			s[9] * s[3] * s[14] - s[13] * s[2] * s[11] + s[13] * s[3] * s[10];
		inv[5] = s[0] * s[10] * s[15] - s[0] * s[11] * s[14] - s[8] * s[2] * s[15] +
			s[8] * s[3] * s[14] + s[12] * s[2] * s[11] - s[12] * s[3] * s[10];
		inv[9] = -s[0] * s[9] * s[15] + s[0] * s[11] * s[13] + s[8] * s[1] * s[15] -
			s[8] * s[3] * s[13] - s[12] * s[1] * s[11] + s[12] * s[3] * s[9];
		inv[13] = s[0] * s[9] * s[14] - s[0] * s[10] * s[13] - s[8] * s[1] * s[14] +
			s[8] * s[2] * s[13] + s[12] * s[1] * s[10] - s[12] * s[2] * s[9];

		inv[2] = s[1] * s[6] * s[15] - s[1] * s[7] * s[14] - s[5] * s[2] * s[15] +
			s[5] * s[3] * s[14] + s[13] * s[2] * s[7] - s[13] * s[3] * s[6];
		inv[6] = -s[0] * s[6] * s[15] + s[0] * s[7] * s[14] + s[4] * s[2] * s[15] -
			s[4] * s[3] * s[14] - s[12] * s[2] * s[7] + s[12] * s[3] * s[6];
		inv[10] = s[0] * s[5] * s[15] - s[0] * s[7] * s[13] - s[4] * s[1] * s[15] +
			s[4] * s[3] * s[13] + s[12] * s[1] * s[7] - s[12] * s[3] * s[5];
		inv[14] = -s[0] * s[5] * s[14] + s[0] * s[6] * s[13] + s[4] * s[1] * s[14] -
			s[4] * s[2] * s[13] - s[12] * s[1] * s[6] + s[12] * s[2] * s[5];

		inv[3] = -s[1] * s[6] * s[11] + s[1] * s[7] * s[10] + s[5] * s[2] * s[11] -
			s[5] * s[3] * s[10] - s[9] * s[2] * s[7] + s[9] * s[3] * s[6];
		inv[7] = s[0] * s[6] * s[11] - s[0] * s[7] * s[10] - s[4] * s[2] * s[11] +
			s[4] * s[3] * s[10] + s[8] * s[2] * s[7] - s[8] * s[3] * s[6];
		inv[11] = -s[0] * s[5] * s[11] + s[0] * s[7] * s[9] + s[4] * s[1] * s[11] -
			s[4] * s[3] * s[9] - s[8] * s[1] * s[7] + s[8] * s[3] * s[5];
		inv[15] = s[0] * s[5] * s[10] - s[0] * s[6] * s[9] - s[4] * s[1] * s[10] +
			s[4] * s[2] * s[9] + s[8] * s[1] * s[6] - s[8] * s[2] * s[5];

		det = s[0] * inv[0] + s[1] * inv[4] + s[2] * inv[8] + s[3] * inv[12];
		if (det === 0) {
			return this;
		}

		det = 1 / det;
		for (i = 0; i < 16; i++) {
			d[i] = inv[i] * det;
		}

		return this;
	};

	/**
	 * Calculate the inverse matrix of this, and set to this.
	 * @return this
	 */
	Matrix4.prototype.invert = function () {
		return this.setInverseOf(this);
	};

	/**
	 * Set the orthographic projection matrix.
	 * @param left The coordinate of the left of clipping plane.
	 * @param right The coordinate of the right of clipping plane.
	 * @param bottom The coordinate of the bottom of clipping plane.
	 * @param top The coordinate of the top top clipping plane.
	 * @param near The distances to the nearer depth clipping plane. This value is minus if the plane is to be behind the viewer.
	 * @param far The distances to the farther depth clipping plane. This value is minus if the plane is to be behind the viewer.
	 * @return this
	 */
	Matrix4.prototype.setOrtho = function (left, right, bottom, top, near, far) {
		var e, rw, rh, rd;

		if (left === right || bottom === top || near === far) {
			throw 'null frustum';
		}

		rw = 1 / (right - left);
		rh = 1 / (top - bottom);
		rd = 1 / (far - near);

		e = this.elements;

		e[0] = 2 * rw;
		e[1] = 0;
		e[2] = 0;
		e[3] = 0;

		e[4] = 0;
		e[5] = 2 * rh;
		e[6] = 0;
		e[7] = 0;

		e[8] = 0;
		e[9] = 0;
		e[10] = -2 * rd;
		e[11] = 0;

		e[12] = -(right + left) * rw;
		e[13] = -(top + bottom) * rh;
		e[14] = -(far + near) * rd;
		e[15] = 1;

		return this;
	};

	/**
	 * Multiply the orthographic projection matrix from the right.
	 * @param left The coordinate of the left of clipping plane.
	 * @param right The coordinate of the right of clipping plane.
	 * @param bottom The coordinate of the bottom of clipping plane.
	 * @param top The coordinate of the top top clipping plane.
	 * @param near The distances to the nearer depth clipping plane. This value is minus if the plane is to be behind the viewer.
	 * @param far The distances to the farther depth clipping plane. This value is minus if the plane is to be behind the viewer.
	 * @return this
	 */
	Matrix4.prototype.ortho = function (left, right, bottom, top, near, far) {
		return this.concat(new Matrix4().setOrtho(left, right, bottom, top, near, far));
	};

	/**
	 * Set the perspective projection matrix.
	 * @param left The coordinate of the left of clipping plane.
	 * @param right The coordinate of the right of clipping plane.
	 * @param bottom The coordinate of the bottom of clipping plane.
	 * @param top The coordinate of the top top clipping plane.
	 * @param near The distances to the nearer depth clipping plane. This value must be plus value.
	 * @param far The distances to the farther depth clipping plane. This value must be plus value.
	 * @return this
	 */
	Matrix4.prototype.setFrustum = function (left, right, bottom, top, near, far) {
		var e, rw, rh, rd;

		if (left === right || top === bottom || near === far) {
			throw 'null frustum';
		}
		if (near <= 0) {
			throw 'near <= 0';
		}
		if (far <= 0) {
			throw 'far <= 0';
		}

		rw = 1 / (right - left);
		rh = 1 / (top - bottom);
		rd = 1 / (far - near);

		e = this.elements;

		e[0] = 2 * near * rw;
		e[1] = 0;
		e[2] = 0;
		e[3] = 0;

		e[4] = 0;
		e[5] = 2 * near * rh;
		e[6] = 0;
		e[7] = 0;

		e[8] = (right + left) * rw;
		e[9] = (top + bottom) * rh;
		e[10] = -(far + near) * rd;
		e[11] = -1;

		e[12] = 0;
		e[13] = 0;
		e[14] = -2 * near * far * rd;
		e[15] = 0;

		return this;
	};

	/**
	 * Multiply the perspective projection matrix from the right.
	 * @param left The coordinate of the left of clipping plane.
	 * @param right The coordinate of the right of clipping plane.
	 * @param bottom The coordinate of the bottom of clipping plane.
	 * @param top The coordinate of the top top clipping plane.
	 * @param near The distances to the nearer depth clipping plane. This value must be plus value.
	 * @param far The distances to the farther depth clipping plane. This value must be plus value.
	 * @return this
	 */
	Matrix4.prototype.frustum = function (left, right, bottom, top, near, far) {
		return this.concat(new Matrix4().setFrustum(left, right, bottom, top, near, far));
	};

	/**
	 * Set the perspective projection matrix by fovy and aspect.
	 * @param fovy The angle between the upper and lower sides of the frustum.
	 * @param aspect The aspect ratio of the frustum. (width/height)
	 * @param near The distances to the nearer depth clipping plane. This value must be plus value.
	 * @param far The distances to the farther depth clipping plane. This value must be plus value.
	 * @return this
	 */
	Matrix4.prototype.setPerspective = function (fovy, aspect, near, far) {
		var e, rd, s, ct;

		if (near === far || aspect === 0) {
			throw 'null frustum';
		}
		if (near <= 0) {
			throw 'near <= 0';
		}
		if (far <= 0) {
			throw 'far <= 0';
		}

		fovy = Math.PI * fovy / 180 / 2;
		s = Math.sin(fovy);
		if (s === 0) {
			throw 'null frustum';
		}

		rd = 1 / (far - near);
		ct = Math.cos(fovy) / s;

		e = this.elements;

		e[0] = ct / aspect;
		e[1] = 0;
		e[2] = 0;
		e[3] = 0;

		e[4] = 0;
		e[5] = ct;
		e[6] = 0;
		e[7] = 0;

		e[8] = 0;
		e[9] = 0;
		e[10] = -(far + near) * rd;
		e[11] = -1;

		e[12] = 0;
		e[13] = 0;
		e[14] = -2 * near * far * rd;
		e[15] = 0;

		return this;
	};

	/**
	 * Multiply the perspective projection matrix from the right.
	 * @param fovy The angle between the upper and lower sides of the frustum.
	 * @param aspect The aspect ratio of the frustum. (width/height)
	 * @param near The distances to the nearer depth clipping plane. This value must be plus value.
	 * @param far The distances to the farther depth clipping plane. This value must be plus value.
	 * @return this
	 */
	Matrix4.prototype.perspective = function (fovy, aspect, near, far) {
		return this.concat(new Matrix4().setPerspective(fovy, aspect, near, far));
	};

	/**
	 * Set the matrix for scaling.
	 * @param x The scale factor along the X axis
	 * @param y The scale factor along the Y axis
	 * @param z The scale factor along the Z axis
	 * @return this
	 */
	Matrix4.prototype.setScale = function (x, y, z) {
		var e = this.elements;
		e[0] = x;
		e[4] = 0;
		e[8] = 0;
		e[12] = 0;
		e[1] = 0;
		e[5] = y;
		e[9] = 0;
		e[13] = 0;
		e[2] = 0;
		e[6] = 0;
		e[10] = z;
		e[14] = 0;
		e[3] = 0;
		e[7] = 0;
		e[11] = 0;
		e[15] = 1;
		return this;
	};

	/**
	 * Multiply the matrix for scaling from the right.
	 * @param x The scale factor along the X axis
	 * @param y The scale factor along the Y axis
	 * @param z The scale factor along the Z axis
	 * @return this
	 */
	Matrix4.prototype.scale = function (x, y, z) {
		var e = this.elements;
		e[0] *= x;
		e[4] *= y;
		e[8] *= z;
		e[1] *= x;
		e[5] *= y;
		e[9] *= z;
		e[2] *= x;
		e[6] *= y;
		e[10] *= z;
		e[3] *= x;
		e[7] *= y;
		e[11] *= z;
		return this;
	};

	/**
	 * Set the matrix for translation.
	 * @param x The X value of a translation.
	 * @param y The Y value of a translation.
	 * @param z The Z value of a translation.
	 * @return this
	 */
	Matrix4.prototype.setTranslate = function (x, y, z) {
		var e = this.elements;
		e[0] = 1;
		e[4] = 0;
		e[8] = 0;
		e[12] = x;
		e[1] = 0;
		e[5] = 1;
		e[9] = 0;
		e[13] = y;
		e[2] = 0;
		e[6] = 0;
		e[10] = 1;
		e[14] = z;
		e[3] = 0;
		e[7] = 0;
		e[11] = 0;
		e[15] = 1;
		return this;
	};

	/**
	 * Multiply the matrix for translation from the right.
	 * @param x The X value of a translation.
	 * @param y The Y value of a translation.
	 * @param z The Z value of a translation.
	 * @return this
	 */
	Matrix4.prototype.translate = function (x, y, z) {
		var e = this.elements;
		e[12] += e[0] * x + e[4] * y + e[8] * z;
		e[13] += e[1] * x + e[5] * y + e[9] * z;
		e[14] += e[2] * x + e[6] * y + e[10] * z;
		e[15] += e[3] * x + e[7] * y + e[11] * z;
		return this;
	};

	/**
	 * Set the matrix for rotation.
	 * The vector of rotation axis may not be normalized.
	 * @param angle The angle of rotation (degrees)
	 * @param x The X coordinate of vector of rotation axis.
	 * @param y The Y coordinate of vector of rotation axis.
	 * @param z The Z coordinate of vector of rotation axis.
	 * @return this
	 */
	Matrix4.prototype.setRotate = function (angle, x, y, z) {
		var e, s, c, len, rlen, nc, xy, yz, zx, xs, ys, zs;

		angle = Math.PI * angle / 180;
		e = this.elements;

		s = Math.sin(angle);
		c = Math.cos(angle);

		if (0 !== x && 0 === y && 0 === z) {
			// Rotation around X axis
			if (x < 0) {
				s = -s;
			}
			e[0] = 1;
			e[4] = 0;
			e[8] = 0;
			e[12] = 0;
			e[1] = 0;
			e[5] = c;
			e[9] = -s;
			e[13] = 0;
			e[2] = 0;
			e[6] = s;
			e[10] = c;
			e[14] = 0;
			e[3] = 0;
			e[7] = 0;
			e[11] = 0;
			e[15] = 1;
		} else if (0 === x && 0 !== y && 0 === z) {
			// Rotation around Y axis
			if (y < 0) {
				s = -s;
			}
			e[0] = c;
			e[4] = 0;
			e[8] = s;
			e[12] = 0;
			e[1] = 0;
			e[5] = 1;
			e[9] = 0;
			e[13] = 0;
			e[2] = -s;
			e[6] = 0;
			e[10] = c;
			e[14] = 0;
			e[3] = 0;
			e[7] = 0;
			e[11] = 0;
			e[15] = 1;
		} else if (0 === x && 0 === y && 0 !== z) {
			// Rotation around Z axis
			if (z < 0) {
				s = -s;
			}
			e[0] = c;
			e[4] = -s;
			e[8] = 0;
			e[12] = 0;
			e[1] = s;
			e[5] = c;
			e[9] = 0;
			e[13] = 0;
			e[2] = 0;
			e[6] = 0;
			e[10] = 1;
			e[14] = 0;
			e[3] = 0;
			e[7] = 0;
			e[11] = 0;
			e[15] = 1;
		} else {
			// Rotation around another axis
			len = Math.sqrt(x * x + y * y + z * z);
			if (len !== 1) {
				rlen = 1 / len;
				x *= rlen;
				y *= rlen;
				z *= rlen;
			}
			nc = 1 - c;
			xy = x * y;
			yz = y * z;
			zx = z * x;
			xs = x * s;
			ys = y * s;
			zs = z * s;

			e[0] = x * x * nc + c;
			e[1] = xy * nc + zs;
			e[2] = zx * nc - ys;
			e[3] = 0;

			e[4] = xy * nc - zs;
			e[5] = y * y * nc + c;
			e[6] = yz * nc + xs;
			e[7] = 0;

			e[8] = zx * nc + ys;
			e[9] = yz * nc - xs;
			e[10] = z * z * nc + c;
			e[11] = 0;

			e[12] = 0;
			e[13] = 0;
			e[14] = 0;
			e[15] = 1;
		}

		return this;
	};

	/**
	 * Multiply the matrix for rotation from the right.
	 * The vector of rotation axis may not be normalized.
	 * @param angle The angle of rotation (degrees)
	 * @param x The X coordinate of vector of rotation axis.
	 * @param y The Y coordinate of vector of rotation axis.
	 * @param z The Z coordinate of vector of rotation axis.
	 * @return this
	 */
	Matrix4.prototype.rotate = function (angle, x, y, z) {
		return this.concat(new Matrix4().setRotate(angle, x, y, z));
	};

	/**
	 * Set the viewing matrix.
	 * @param eyeX, eyeY, eyeZ The position of the eye point.
	 * @param centerX, centerY, centerZ The position of the reference point.
	 * @param upX, upY, upZ The direction of the up vector.
	 * @return this
	 */
	Matrix4.prototype.setLookAt = function (eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ) {
		var e, fx, fy, fz, rlf, sx, sy, sz, rls, ux, uy, uz;

		fx = centerX - eyeX;
		fy = centerY - eyeY;
		fz = centerZ - eyeZ;

		// Normalize f.
		rlf = 1 / Math.sqrt(fx * fx + fy * fy + fz * fz);
		fx *= rlf;
		fy *= rlf;
		fz *= rlf;

		// Calculate cross product of f and up.
		sx = fy * upZ - fz * upY;
		sy = fz * upX - fx * upZ;
		sz = fx * upY - fy * upX;

		// Normalize s.
		rls = 1 / Math.sqrt(sx * sx + sy * sy + sz * sz);
		sx *= rls;
		sy *= rls;
		sz *= rls;

		// Calculate cross product of s and f.
		ux = sy * fz - sz * fy;
		uy = sz * fx - sx * fz;
		uz = sx * fy - sy * fx;

		// Set to this.
		e = this.elements;
		e[0] = sx;
		e[1] = ux;
		e[2] = -fx;
		e[3] = 0;

		e[4] = sy;
		e[5] = uy;
		e[6] = -fy;
		e[7] = 0;

		e[8] = sz;
		e[9] = uz;
		e[10] = -fz;
		e[11] = 0;

		e[12] = 0;
		e[13] = 0;
		e[14] = 0;
		e[15] = 1;

		// Translate.
		return this.translate(-eyeX, -eyeY, -eyeZ);
	};

	/**
	 * Multiply the viewing matrix from the right.
	 * @param eyeX, eyeY, eyeZ The position of the eye point.
	 * @param centerX, centerY, centerZ The position of the reference point.
	 * @param upX, upY, upZ The direction of the up vector.
	 * @return this
	 */
	Matrix4.prototype.lookAt = function (eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ) {
		return this.concat(new Matrix4().setLookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ));
	};

	/**
	 * Multiply the matrix for project vertex to plane from the right.
	 * @param plane The array[A, B, C, D] of the equation of plane "Ax + By + Cz + D = 0".
	 * @param light The array which stored coordinates of the light. if light[3]=0, treated as parallel light.
	 * @return this
	 */
	Matrix4.prototype.dropShadow = function (plane, light) {
		var mat = new Matrix4();
		var e = mat.elements;

		var dot = plane[0] * light[0] + plane[1] * light[1] + plane[2] * light[2] + plane[3] * light[3];

		e[0] = dot - light[0] * plane[0];
		e[1] = -light[1] * plane[0];
		e[2] = -light[2] * plane[0];
		e[3] = -light[3] * plane[0];

		e[4] = -light[0] * plane[1];
		e[5] = dot - light[1] * plane[1];
		e[6] = -light[2] * plane[1];
		e[7] = -light[3] * plane[1];

		e[8] = -light[0] * plane[2];
		e[9] = -light[1] * plane[2];
		e[10] = dot - light[2] * plane[2];
		e[11] = -light[3] * plane[2];

		e[12] = -light[0] * plane[3];
		e[13] = -light[1] * plane[3];
		e[14] = -light[2] * plane[3];
		e[15] = dot - light[3] * plane[3];

		return this.concat(mat);
	};

	/**
	 * Multiply the matrix for project vertex to plane from the right.(Projected by parallel light.)
	 * @param normX, normY, normZ The normal vector of the plane.(Not necessary to be normalized.)
	 * @param planeX, planeY, planeZ The coordinate of arbitrary points on a plane.
	 * @param lightX, lightY, lightZ The vector of the direction of light.(Not necessary to be normalized.)
	 * @return this
	 */
	Matrix4.prototype.dropShadowDirectionally = function (normX, normY, normZ, planeX, planeY, planeZ, lightX, lightY, lightZ) {
		var a = planeX * normX + planeY * normY + planeZ * normZ;
		return this.dropShadow([normX, normY, normZ, -a], [lightX, lightY, lightZ, 0]);
	};

	/**
	 * Constructor of Vector3
	 * If opt_src is specified, new vector is initialized by opt_src.
	 * @param opt_src source vector(option)
	 */
	var Vector3 = function (opt_src) {
		var v = new Float32Array(3);
		if (opt_src && typeof opt_src === 'object') {
			v[0] = opt_src[0];
			v[1] = opt_src[1];
			v[2] = opt_src[2];
		}
		this.elements = v;
	};

	/**
	 * Normalize.
	 * @return this
	 */
	Vector3.prototype.normalize = function () {
		var v = this.elements;
		var c = v[0],
			d = v[1],
			e = v[2],
			g = Math.sqrt(c * c + d * d + e * e);
		if (g) {
			if (g === 1) {
				return this;
			}
		} else {
			v[0] = 0;
			v[1] = 0;
			v[2] = 0;
			return this;
		}
		g = 1 / g;
		v[0] = c * g;
		v[1] = d * g;
		v[2] = e * g;
		return this;
	};

	/**
	 * Constructor of Vector4
	 * If opt_src is specified, new vector is initialized by opt_src.
	 * @param opt_src source vector(option)
	 */
	var Vector4 = function (opt_src) {
		var v = new Float32Array(4);
		if (opt_src && typeof opt_src === 'object') {
			v[0] = opt_src[0];
			v[1] = opt_src[1];
			v[2] = opt_src[2];
			v[3] = opt_src[3];
		}
		this.elements = v;
	};

	//
	var glBuffer = {
		verticesBuffer: null,
		indicesBuffer: null
	};

	// cube data
	//    v6----- v5
	//   /|      /|
	//  v1------v0|
	//  | |     | |
	//  | |v7---|-|v4
	//  |/      |/
	//  v2------v3
	var cubeVertices = [ // Vertex coordinates
		0.5, 0.5, 0.5, 1.0, 1.0, 0.0, 0.0, 0.0, 1.0, -0.5, 0.5, 0.5, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, -0.5, -0.5, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0,
		0.5, -0.5, 0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, // v0-v1-v2-v3 front

		0.5, 0.5, 0.5, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,
		0.5, -0.5, 0.5, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0,
		0.5, -0.5, -0.5, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0,
		0.5, 0.5, -0.5, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // v0-v3-v4-v5 right

		0.5, 0.5, 0.5, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0,
		0.5, 0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, -0.5, 0.5, -0.5, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, -0.5, 0.5, 0.5, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, // v0-v5-v6-v1 up

		-0.5, 0.5, 0.5, 1.0, 1.0, 0.0, -1.0, 0.0, 0.0, -0.5, 0.5, -0.5, 0.0, 1.0, 0.0, -1.0, 0.0, 0.0, -0.5, -0.5, -0.5, 0.0, 0.0, 0.0, -1.0, 0.0, 0.0, -0.5, -0.5, 0.5, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left

		-0.5, -0.5, -0.5, 1.0, 1.0, 0.0, 0.0, -1.0, 0.0,
		0.5, -0.5, -0.5, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0,
		0.5, -0.5, 0.5, 0.0, 0.0, 0.0, 0.0, -1.0, 0.0, -0.5, -0.5, 0.5, 1.0, 0.0, 0.0, 0.0, -1.0, 0.0, // v7-v4-v3-v2 down

		0.5, -0.5, -0.5, 1.0, 1.0, 0.0, 0.0, 0.0, -1.0, -0.5, -0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 0.0, -1.0, -0.5, 0.5, -0.5, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0,
		0.5, 0.5, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, -1.0 // v4-v7-v6-v5 back
	];

	var cubeIndices = new Uint8Array([ // Indices of the vertices
		0, 1, 2, 0, 2, 3, // front
		4, 5, 6, 4, 6, 7, // right
		8, 9, 10, 8, 10, 11, // up
		12, 13, 14, 12, 14, 15, // left
		16, 17, 18, 16, 18, 19, // down
		20, 21, 22, 20, 22, 23 // back
	]);

	// plane data
	var planeVertices = [
		1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, -1.0, -1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0,
		1.0, -1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0 // v0-v1-v2-v3
	];

	var planeIndices = new Uint8Array([0, 1, 2, 0, 2, 3]);

	// create cube Buffer
	function createCubeBuffers(obj) {
		var gl = obj.gl,
			vertices = cubeVertices.slice(),
			indexBuffer = gl.createBuffer(),
			verticesBuffer = gl.createBuffer(),
			w = obj.width || 1,
			h = obj.height || 1,
			l = obj.length || 1,
			length = cubeVertices.length,
			i = 0,
			drawMethod = obj.drawMethod || gl.STATIC_DRAW;

		if (!indexBuffer) {
			console.log('Failed to create the buffer object');
			return -1;
		}
		if (!verticesBuffer) {
			console.log('Failed to create the buffer object');
			return -1;
		}

		if (w !== 1) {
			for (i = 0; i < length; i += 9) {
				vertices[i] *= w;
			}
		}
		if (h !== 1) {
			for (i = 1; i < length; i += 9) {
				vertices[i] *= h;
			}
		}
		if (l !== 1) {
			for (i = 2; i < length; i += 9) {
				vertices[i] *= l;
			}
		}
		vertices = new Float32Array(vertices);

		// Bind the buffer object to target
		gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
		// Write date into the buffer object
		gl.bufferData(gl.ARRAY_BUFFER, vertices, drawMethod);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeIndices, gl.STATIC_DRAW);

		// unbind the buffer object
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

		return {
			indexBuffer: indexBuffer,
			verticesBuffer: verticesBuffer,
			indicesLength: cubeIndices.length,
			size: vertices.BYTES_PER_ELEMENT,
			attributeName: obj.attributeName,
			gl: gl,
			dataLength: obj.dataLength || [3, 2, 3],
			stride: obj.stride || 9,
			offset: obj.offset || [0, 3, 6]

		};
	}

	// create plane buffer
	function createPlaneBuffers(obj) {
		var gl = obj.gl,
			vertices = planeVertices.slice(),
			indexBuffer = gl.createBuffer(),
			verticesBuffer = gl.createBuffer(),
			w = obj.width || 1,
			h = obj.height || 1,
			length = planeVertices.length,
			i = 0,
			drawMethod = obj.drawMethod || gl.STATIC_DRAW;

		if (!indexBuffer) {
			console.log('Failed to create the buffer object');
			return -1;
		}
		if (!verticesBuffer) {
			console.log('Failed to create the buffer object');
			return -1;
		}

		if (w !== 1) {
			for (i = 0; i < length; i += 9) {
				vertices[i] *= w;
			}
		}
		if (h !== 1) {
			for (i = 1; i < length; i += 9) {
				vertices[i] *= h;
			}
		}
		vertices = new Float32Array(vertices);

		// Bind the buffer object to target
		gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
		// Write date into the buffer object
		gl.bufferData(gl.ARRAY_BUFFER, vertices, drawMethod);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, planeIndices, gl.STATIC_DRAW);

		// unbind the buffer object
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

		return {
			indexBuffer: indexBuffer,
			verticesBuffer: verticesBuffer,
			indicesLength: planeIndices.length,
			size: vertices.BYTES_PER_ELEMENT,
			attributeName: obj.attributeName,
			gl: gl,
			dataLength: obj.dataLength || [3, 2, 3],
			stride: obj.stride || 9,
			offset: obj.offset || [0, 3, 6]
		};
	}

	function linkBuffers(obj) {
		var gl = obj.gl,
			a_Position = null,
			i = 0,
			l = 0,
			size = obj.size;

		// Bind the buffer object to target
		gl.bindBuffer(gl.ARRAY_BUFFER, obj.verticesBuffer);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);

		l = obj.attributeName.length;
		for (i = 0; i < l; i++) {
			a_Position = gl.getAttribLocation(gl.program, obj.attributeName[i]);
			if (a_Position < 0) {
				console.log('Failed to get the ' + obj.attributeName[i] + ' location');
			} else {
				// Assign the buffer object to a_Position variable
				gl.vertexAttribPointer(a_Position, obj.dataLength[i], obj.dataType || gl.FLOAT, false, size * obj.stride, size * obj.offset[i]);

				// Enable the assignment to a_Position variable
				gl.enableVertexAttribArray(a_Position);
			}
		}
		return obj.indicesLength;
	}

	// creat texture
	function loadImage(gl, texture, u_Sampler, image, fn, count, i) {

		// Flip the image's y axis
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

		// Bind the texture object to the target
		gl.bindTexture(gl.TEXTURE_2D, texture);

		// Set the texture parameters
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

		// Set the texture image
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_SHORT_5_5_5_1, image);

		// Set the texture unit 0 to the sampler
		gl.uniform1i(u_Sampler, i);

		// unbind the texture object
		gl.bindTexture(gl.TEXTURE_2D, null);
		if (count <= 0) {
			fn();
		}

	}

	function createTextures(obj, loadImage) {
		var gl = obj.gl,
			textureName = obj.textureName,
			count = textureName.length,
			url = obj.textureUrl,
			l = count,
			i = 0,
			a = [];
		for (; i < l; i++) {
			(function (i) {
				// Create a texture object
				a[i] = gl.createTexture();

				// Get the storage location of u_Sampler
				var u_Sampler = gl.getUniformLocation(gl.program, textureName[i]);

				// Create the image object
				var image = new Image();
				image.onload = function () {
					count--;
					loadImage(gl, a[i], u_Sampler, image, obj.fn, count, i);
				};
				image.src = url[i];
			})(i);
		}

		return a;
	}

	// creat FramebufferObject
	function createFramebuffer(obj) {
		var gl = obj.gl,
			offScreenWidth = obj.offScreenWidth,
			offScreenHeight = obj.offScreenHeight;
		var framebuffer, texture, depthBuffer;

		// Define the error handling function
		var error = function () {
			if (framebuffer) {
				gl.deleteFramebuffer(framebuffer);
			}
			if (texture) {
				gl.deleteTexture(texture);
			}
			if (depthBuffer) {
				gl.deleteRenderbuffer(depthBuffer);
			}
			return null;
		};

		// Create a frame buffer object (FBO)
		framebuffer = gl.createFramebuffer();
		if (!framebuffer) {
			console.log('Failed to create frame buffer object');
			return error();
		}

		// Create a texture object and set its size and parameters
		texture = gl.createTexture(); // Create a texture object
		if (!texture) {
			console.log('Failed to create texture object');
			return error();
		}
		gl.bindTexture(gl.TEXTURE_2D, texture); // Bind the object to target
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, offScreenWidth, offScreenHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		framebuffer.texture = texture; // Store the texture object

		// Create a renderbuffer object and Set its size and parameters
		depthBuffer = gl.createRenderbuffer(); // Create a renderbuffer object
		if (!depthBuffer) {
			console.log('Failed to create renderbuffer object');
			return error();
		}
		gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer); // Bind the object to target
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, offScreenWidth, offScreenHeight);

		// Attach the texture and the renderbuffer object to the FBO
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

		// Check if FBO is configured correctly
		var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
		if (gl.FRAMEBUFFER_COMPLETE !== e) {
			console.log('Frame buffer object is incomplete: ' + e.toString());
			return error();
		}

		// Unbind the buffer object
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);


		return framebuffer;
	}

	// load texture
	function loadTexture(gl, texture, u_Sampler, image, fn, count, i) {

		// Flip the image's y axis
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

		// Enable texture unit0
		gl.activeTexture(gl['TEXTURE' + i]);

		// Bind the texture object to the target
		gl.bindTexture(gl.TEXTURE_2D, texture);

		// Set the texture parameters
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

		// Set the texture image
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_SHORT_5_5_5_1, image);

		// Set the texture unit 0 to the sampler
		gl.uniform1i(u_Sampler, i);

		if (count <= 0) {
			fn();
		}

	}

	function initTextures(obj, fn) {
		var gl = obj.gl,
			textureName = obj.textureName,
			count = textureName.length,
			url = obj.textureUrl,
			l = count,
			i = 0;
		for (; i < l; i++) {
			(function (i) {
				// Create a texture object
				var texture = gl.createTexture();

				// Get the storage location of u_Sampler
				var u_Sampler = gl.getUniformLocation(gl.program, textureName[i]);

				// Create the image object
				var image = new Image();
				image.onload = function () {
					count--;
					fn(gl, texture, u_Sampler, this, obj.fn, count, i);
				};
				image.src = url[i];
			})(i);
		}

		return true;
	}

	// create points data
	function createPointsData(obj) {
		var data = obj.data,
			gl = obj.gl,
			drawMethod = obj.drawMethod || gl.STATIC_DRAW;

		// Create a buffer object
		var buffer,
			a_Position = null,
			i = 0,
			l = 0,
			size = data.BYTES_PER_ELEMENT;
		if (glBuffer.verticesBuffer) {
			buffer = glBuffer.verticesBuffer;
		} else {
			buffer = glBuffer.verticesBuffer = gl.createBuffer();
		}
		if (!buffer) {
			console.log('Failed to create the buffer object');
			return -1;
		}

		// Bind the buffer object to target
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		// Write date into the buffer object
		gl.bufferData(gl.ARRAY_BUFFER, data, drawMethod);
		if (typeof obj.dataLength === 'number') {
			a_Position = gl.getAttribLocation(gl.program, obj.positionName);
			if (a_Position<0) {
				console.log('Failed to get the ' + obj.positionName + ' location');
				return;
			}
			// Assign the buffer object to a_Position variable
			gl.vertexAttribPointer(a_Position, obj.dataLength, obj.dataType || gl.FLOAT, false, size * (obj.stride || 0), size * (obj.offset || 0));

			// Enable the assignment to a_Position variable
			gl.enableVertexAttribArray(a_Position);	

		} else {
			l = obj.positionName.length;
			for (i = 0; i < l; i++) {
				a_Position = gl.getAttribLocation(gl.program, obj.positionName[i]);
				if (a_Position < 0) {
					console.log('Failed to get the ' + obj.positionName[i] + ' location');
				} else {
					// Assign the buffer object to a_Position variable
					gl.vertexAttribPointer(a_Position, obj.dataLength[i], obj.dataType || gl.FLOAT, false, size * obj.stride, size * obj.offset[i]);

					// Enable the assignment to a_Position variable
					gl.enableVertexAttribArray(a_Position);
				}
			}
		}

		// unbind the buffer object
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}

	function createCube(obj, fn) {
		var gl = obj.gl,
			vertices = cubeVertices.slice(),
			indexBuffer,
			w = obj.width || 1,
			h = obj.height || 1,
			l = obj.length || 1,
			length = cubeVertices.length,
			i = 0;

		if (glBuffer.verticesBuffer) {
			indexBuffer = glBuffer.indexBuffer;
		} else {
			indexBuffer = glBuffer.indexBuffer = gl.createBuffer();
		}
		if (w !== 1) {
			for (i = 0; i < length; i += 9) {
				vertices[i] *= w;
			}
		}
		if (h !== 1) {
			for (i = 1; i < length; i += 9) {
				vertices[i] *= h;
			}
		}
		if (l !== 1) {
			for (i = 2; i < length; i += 9) {
				vertices[i] *= l;
			}
		}
		vertices = new Float32Array(vertices);

		fn({
			gl: gl,
			data: vertices,
			dataLength: obj.dataLength || [3, 2, 3],
			positionName: obj.positionName,
			stride: obj.stride || 9,
			offset: obj.offset || [0, 3, 6]
		});
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeIndices, gl.STATIC_DRAW);

		if (obj.viewMatrixLocation) {
			gl.uniformMatrix4fv(obj.viewMatrixLocation, false, obj.viewMatrix.elements);
			gl.uniformMatrix4fv(obj.normalMatrixLocation, false, obj.normalMatrix.elements);

			gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_BYTE, 0);
		}
		return cubeIndices.length;
	}

	function drawCube(obj) {
		var gl = obj.gl;

		gl.uniformMatrix4fv(obj.viewMatrixLocation, false, obj.viewMatrix.elements);
		gl.uniformMatrix4fv(obj.normalMatrixLocation, false, obj.normalMatrix.elements);

		gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_BYTE, 0);
	}

	// sphere data
	function sphereData(n) {
		var i, ai, si, ci;
		var j, aj, sj, cj;
		var p1, p2;

		var positions = [];
		var indices = [];

		// Generate coordinates
		for (j = 0; j <= n; j++) {
			aj = j * Math.PI / n;
			sj = Math.sin(aj);
			cj = Math.cos(aj);
			for (i = 0; i <= n; i++) {
				ai = i * 2 * Math.PI / n;
				si = Math.sin(ai);
				ci = Math.cos(ai);

				positions.push(si * sj); // X
				positions.push(cj); // Y
				positions.push(ci * sj); // Z

				// texture
				positions.push(i / n); // x
				positions.push(n - j / n); // y
				positions.push(1.0); // z

				// normal
				positions.push(si * sj); // X
				positions.push(cj); // Y
				positions.push(ci * sj); // Z
			}
		}

		// Generate indices
		for (j = 0; j < n; j++) {
			for (i = 0; i < n; i++) {
				p1 = j * (n + 1) + i;
				p2 = p1 + (n + 1);

				indices.push(p1);
				indices.push(p2);
				indices.push(p1 + 1);

				indices.push(p1 + 1);
				indices.push(p2);
				indices.push(p2 + 1);
			}
		}
		return {
			positions: positions,
			indices: indices
		};
	}

	function createSphere(obj, sphereData, createPointsData) {

		var gl = obj.gl,
			data = sphereData(obj.length),
			indexBuffer = gl.createBuffer();
		createPointsData({
			gl: gl,
			data: new Float32Array(data.positions),
			dataLength: obj.dataLength || [3, 2, 3],
			positionName: obj.positionName,
			stride: obj.stride || 9,
			offset: obj.offset || [0, 3, 6]
		});
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.indices), gl.STATIC_DRAW);

		return data.indices.length;
	}

	/*
	 * analysis obj file
	 */
	var analysisObjConfig={
		data:'',
		scale:1,
		reverse:true,
		fn:function(){}
	};
	function AnalysisObj(obj) {
		this.config=$.extend(analysisObjConfig,obj);
		this.fileName=this.config.fileName||'no name';
		this.mtls = new Array(0); // Initialize the property for MTL
		this.objects = new Array(0); // Initialize the property for Object
		this.vertices = new Array(0); // Initialize the property for Vertex
		this.normals = new Array(0); // Initialize the property for Normal
		this.parse(this.config);
	}

	// Parsing the OBJ file
	AnalysisObj.prototype.parse = function (obj) {
		var fileString=obj.data,
			scale=obj.scale,
			reverse=obj.reverse;
		obj.data='';
		var lines = fileString.split('\n'); // Break up into lines and store them as array
		lines.push(null); // Append null
		var index = 0; // Initialize index of line

		var currentObject = null;
		var currentMaterialName = "";

		// Parse line by line
		var line; // A string in the line to be parsed
		var sp = new StringParser(); // Create StringParser
		while ((line = lines[index++]) !== null) {
			sp.init(line); // init StringParser
			var command = sp.getWord(); // Get command
			if (command === null){continue;} // check null command

			switch (command) {
				case '#':
					continue; // Skip comments
				case 'mtllib': // Read Material chunk
					var path = this.parseMtllib(sp, this.fileName);
					var mtl = new MTLDoc(); // Create MTL instance
					this.mtls.push(mtl);
					var request = new XMLHttpRequest();
					request.onreadystatechange = function () {
						if (request.readyState === 4) {
							if (request.status !== 404) {
								onReadMTLFile(request.responseText, mtl,obj.fn);
							} else {
								mtl.complete = true;
							}
						}
					};
					request.open('GET', obj.mtlPathFn(path), true); // Create a request to acquire the file
					request.send(null); // Send the request
					continue; // Go to the next line
				case 'o':
				case 'g': // Read Object name
					var object = this.parseObjectName(sp);
					this.objects.push(object);
					currentObject = object;
					continue; // Go to the next line
				case 'v': // Read vertex
					var vertex = this.parseVertex(sp, scale);
					this.vertices.push(vertex);
					continue; // Go to the next line
				case 'vn': // Read normal
					var normal = this.parseNormal(sp);
					this.normals.push(normal);
					continue; // Go to the next line
				case 'usemtl': // Read Material name
					currentMaterialName = this.parseUsemtl(sp);
					continue; // Go to the next line
				case 'f': // Read face
					var face = this.parseFace(sp, currentMaterialName, this.vertices, reverse);
					currentObject.addFace(face);
					continue; // Go to the next line
			}
		}

		return true;
	};

	AnalysisObj.prototype.parseMtllib = function (sp, fileName) {
		// Get directory path
		var i = fileName.lastIndexOf("/");
		var dirPath ='';
		if (i > 0){
			dirPath = fileName.substr(0, i + 1);
		}

		return dirPath + sp.getWord(); // Get path
	};

	AnalysisObj.prototype.parseObjectName = function (sp) {
		var name = sp.getWord();
		return (new OBJObject(name));
	};

	AnalysisObj.prototype.parseVertex = function (sp, scale) {
		var x = sp.getFloat() * scale;
		var y = sp.getFloat() * scale;
		var z = sp.getFloat() * scale;
		return (new Vertex(x, y, z));
	};

	AnalysisObj.prototype.parseNormal = function (sp) {
		var x = sp.getFloat();
		var y = sp.getFloat();
		var z = sp.getFloat();
		return (new Normal(x, y, z));
	};

	AnalysisObj.prototype.parseUsemtl = function (sp) {
		return sp.getWord();
	};

	AnalysisObj.prototype.parseFace = function (sp, materialName, vertices, reverse) {
		var face = new Face(materialName);
		// get indices
		for (;;) {
			var word = sp.getWord();
			if (word === null){
				break;	
			}
			var subWords = word.split('/');
			if (subWords.length >= 1) {
				var vi = parseInt(subWords[0]) - 1;
				face.vIndices.push(vi);
			}
			if (subWords.length >= 3) {
				var ni = parseInt(subWords[2]) - 1;
				face.nIndices.push(ni);
			} else {
				face.nIndices.push(-1);
			}
		}

		// calc normal
		var v0 = [
			vertices[face.vIndices[0]].x,
			vertices[face.vIndices[0]].y,
			vertices[face.vIndices[0]].z
		];
		var v1 = [
			vertices[face.vIndices[1]].x,
			vertices[face.vIndices[1]].y,
			vertices[face.vIndices[1]].z
		];
		var v2 = [
			vertices[face.vIndices[2]].x,
			vertices[face.vIndices[2]].y,
			vertices[face.vIndices[2]].z
		];

		// 面の法線を計算してnormalに設定
		var normal = calcNormal(v0, v1, v2);
		// 法線が正しく求められたか調べる
		if (normal === null) {
			if (face.vIndices.length >= 4) { // 面が四角形なら別の3点の組み合わせで法線計算
				var v3 = [
					vertices[face.vIndices[3]].x,
					vertices[face.vIndices[3]].y,
					vertices[face.vIndices[3]].z
				];
				normal = calcNormal(v1, v2, v3);
			}
			if (normal === null) { // 法線が求められなかったのでY軸方向の法線とする
				normal = [0.0, 1.0, 0.0];
			}
		}
		if (reverse) {
			normal[0] = -normal[0];
			normal[1] = -normal[1];
			normal[2] = -normal[2];
		}
		face.normal = new Normal(normal[0], normal[1], normal[2]);

		// Devide to triangles if face contains over 3 points.
		if (face.vIndices.length > 3) {
			var n = face.vIndices.length - 2;
			var newVIndices = new Array(n * 3);
			var newNIndices = new Array(n * 3);
			for (var i = 0; i < n; i++) {
				newVIndices[i * 3 + 0] = face.vIndices[0];
				newVIndices[i * 3 + 1] = face.vIndices[i + 1];
				newVIndices[i * 3 + 2] = face.vIndices[i + 2];
				newNIndices[i * 3 + 0] = face.nIndices[0];
				newNIndices[i * 3 + 1] = face.nIndices[i + 1];
				newNIndices[i * 3 + 2] = face.nIndices[i + 2];
			}
			face.vIndices = newVIndices;
			face.nIndices = newNIndices;
		}
		face.numIndices = face.vIndices.length;

		return face;
	};

	// Analyze the material file
	function onReadMTLFile(fileString, mtl,fn) {
		var lines = fileString.split('\n'); // Break up into lines and store them as array
		lines.push(null); // Append null
		var index = 0; // Initialize index of line

		// Parse line by line
		var line; // A string in the line to be parsed
		var name = ""; // Material name
		var sp = new StringParser(); // Create StringParser
		while ((line = lines[index++]) !== null) {
			sp.init(line); // init StringParser
			var command = sp.getWord(); // Get command
			if (command === null){
				continue;
			} // check null command

			switch (command) {
				case '#':
					continue; // Skip comments
				case 'newmtl': // Read Material chunk
					name = mtl.parseNewmtl(sp); // Get name
					continue; // Go to the next line
				case 'Kd': // Read normal
					if (name === ''){
						continue;
					}  // Go to the next line because of Error
					var material = mtl.parseRGB(sp, name);
					mtl.materials.push(material);
					name = "";
					continue; // Go to the next line
			}
		}
		mtl.complete = true;
		fn();
	}

	// Check Materials
	AnalysisObj.prototype.isMTLComplete = function () {
		if (this.mtls.length === 0){
			return true;	
		}
		for (var i = 0; i < this.mtls.length; i++) {
			if (!this.mtls[i].complete){
				return false;	
			} 
		}
		return true;
	};

	// Find color by material name
	AnalysisObj.prototype.findColor = function (name) {
		for (var i = 0; i < this.mtls.length; i++) {
			for (var j = 0; j < this.mtls[i].materials.length; j++) {
				if (this.mtls[i].materials[j].name === name) {
					return (this.mtls[i].materials[j].color);
				}
			}
		}
		return (new Color(0.8, 0.8, 0.8, 1));
	};

	//------------------------------------------------------------------------------
	// Retrieve the information for drawing 3D model
	AnalysisObj.prototype.getDrawingInfo = function () {
		// Create an arrays for vertex coordinates, normals, colors, and indices
		var numIndices = 0;
		for (var i = 0; i < this.objects.length; i++) {
			numIndices += this.objects[i].numIndices;
		}
		var numVertices = numIndices;
		var vertices = new Float32Array(numVertices * 3);
		var normals = new Float32Array(numVertices * 3);
		var colors = new Float32Array(numVertices * 4);
		var indices = new Uint16Array(numIndices);

		// Set vertex, normal and color
		var index_indices = 0;
		for (i = 0; i < this.objects.length; i++) {
			var object = this.objects[i];
			for (var j = 0; j < object.faces.length; j++) {
				var face = object.faces[j];
				var color = this.findColor(face.materialName);
				var faceNormal = face.normal;
				for (var k = 0; k < face.vIndices.length; k++) {
					// Set index
					indices[index_indices] = index_indices;
					// Copy vertex
					var vIdx = face.vIndices[k];
					var vertex = this.vertices[vIdx];
					vertices[index_indices * 3 + 0] = vertex.x;
					vertices[index_indices * 3 + 1] = vertex.y;
					vertices[index_indices * 3 + 2] = vertex.z;	
					// Copy color
					colors[index_indices * 4 + 0] = color.r;
					colors[index_indices * 4 + 1] = color.g;
					colors[index_indices * 4 + 2] = color.b;
					colors[index_indices * 4 + 3] = color.a;
					// Copy normal
					var nIdx = face.nIndices[k];
					if (nIdx >= 0) {
						var normal = this.normals[nIdx];
						normals[index_indices * 3 + 0] = normal.x;
						normals[index_indices * 3 + 1] = normal.y;
						normals[index_indices * 3 + 2] = normal.z;
					} else {
						normals[index_indices * 3 + 0] = faceNormal.x;
						normals[index_indices * 3 + 1] = faceNormal.y;
						normals[index_indices * 3 + 2] = faceNormal.z;
					}
					index_indices++;
				}
			}
		}

		return new DrawingInfo(vertices, normals, colors, indices);
	};

	//------------------------------------------------------------------------------
	// MTLDoc Object
	//------------------------------------------------------------------------------
	var MTLDoc = function () {
		this.complete = false; // MTL is configured correctly
		this.materials = new Array(0);
	};

	MTLDoc.prototype.parseNewmtl = function (sp) {
		return sp.getWord(); // Get name
	};

	MTLDoc.prototype.parseRGB = function (sp, name) {
		var r = sp.getFloat();
		var g = sp.getFloat();
		var b = sp.getFloat();
		return (new Material(name, r, g, b, 1));
	};

	//------------------------------------------------------------------------------
	// Material Object
	//------------------------------------------------------------------------------
	var Material = function (name, r, g, b, a) {
		this.name = name;
		this.color = new Color(r, g, b, a);
	};

	//------------------------------------------------------------------------------
	// Vertex Object
	//------------------------------------------------------------------------------
	var Vertex = function (x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
	};

	//------------------------------------------------------------------------------
	// Normal Object
	//------------------------------------------------------------------------------
	var Normal = function (x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
	};

	//------------------------------------------------------------------------------
	// Color Object
	//------------------------------------------------------------------------------
	var Color = function (r, g, b, a) {
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
	};

	//------------------------------------------------------------------------------
	// OBJObject Object
	//------------------------------------------------------------------------------
	var OBJObject = function (name) {
		this.name = name;
		this.faces = new Array(0);
		this.numIndices = 0;
	};

	OBJObject.prototype.addFace = function (face) {
		this.faces.push(face);
		this.numIndices += face.numIndices;
	};

	//------------------------------------------------------------------------------
	// Face Object
	//------------------------------------------------------------------------------
	var Face = function (materialName) {
		this.materialName = materialName;
		if (materialName === null){
			this.materialName = "";	
		}
		this.vIndices = new Array(0);
		this.nIndices = new Array(0);
	};

	//------------------------------------------------------------------------------
	// DrawInfo Object
	//------------------------------------------------------------------------------
	var DrawingInfo = function (vertices, normals, colors, indices) {
		this.vertices = vertices;
		this.normals = normals;
		this.colors = colors;
		this.indices = indices;
	};

	//------------------------------------------------------------------------------
	// Constructor
	function StringParser (str) {
		this.init(str);
	}
	// Initialize StringParser object
	StringParser.prototype.init = function (str) {
		this.str = str;
		this.index = 0;
	};

	// Skip delimiters
	StringParser.prototype.skipDelimiters = function () {
		for (var i = this.index, len = this.str.length; i < len; i++) {
			var c = this.str.charAt(i);
			// Skip TAB, Space, '(', ')
			if (c === '\t' || c === ' ' || c === '(' || c === ')' || c === '"'){
				continue;	
			}
			break;
		}
		this.index = i;
	};

	// Skip to the next word
	StringParser.prototype.skipToNextWord = function () {
		this.skipDelimiters();
		var n = getWordLength(this.str, this.index);
		this.index += (n + 1);
	};

	// Get word
	StringParser.prototype.getWord = function () {
		this.skipDelimiters();
		var n = getWordLength(this.str, this.index);
		if (n === 0){
			return null;	
		} 
		var word = this.str.substr(this.index, n);
		this.index += (n + 1);

		return word;
	};

	// Get integer
	StringParser.prototype.getInt = function () {
		return parseInt(this.getWord());
	};

	// Get floating number
	StringParser.prototype.getFloat = function () {
		return parseFloat(this.getWord());
	};

	// Get the length of word
	function getWordLength(str, start) {
		for (var i = start, len = str.length; i < len; i++) {
			var c = str.charAt(i);
			if (c === '\t' || c === ' ' || c === '(' || c === ')' || c === '"'){
				break;	
			}
		}
		return i - start;
	}

	//------------------------------------------------------------------------------
	// Common function
	//------------------------------------------------------------------------------
	function calcNormal(p0, p1, p2) {
		// v0: a vector from p1 to p0, v1; a vector from p1 to p2
		var v0 = new Float32Array(3);
		var v1 = new Float32Array(3);
		for (var i = 0; i < 3; i++) {
			v0[i] = p0[i] - p1[i];
			v1[i] = p2[i] - p1[i];
		}

		// The cross product of v0 and v1
		var c = new Float32Array(3);
		c[0] = v0[1] * v1[2] - v0[2] * v1[1];
		c[1] = v0[2] * v1[0] - v0[0] * v1[2];
		c[2] = v0[0] * v1[1] - v0[1] * v1[0];

		// Normalize the result
		var v = new Vector3(c);
		v.normalize();
		return v.elements;
	}

	$.blz = {
		// webGl初始化
		initWebGl: function (canvas) {
			var context3d = null;
			try {
				context3d = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
			} catch (e) {
				throw new Error('你的浏览器不支持WebGl');
			}
			return context3d;
		},
		initShaders: initShaders,
		Matrix4: Matrix4,
		Vector3: Vector3,
		Vector4: Vector4,
		createCubeBuffers: createCubeBuffers,
		createPlaneBuffers: createPlaneBuffers,
		createTextures: function (obj) {
			return createTextures(obj, loadImage);
		},
		createFramebuffer: createFramebuffer,
		linkBuffers: linkBuffers,
		createPointsData: createPointsData,
		createCube: function (obj) {
			return createCube(obj, createPointsData);
		},
		drawCube: drawCube,
		createSphere: function (obj) {
			return createSphere(obj, sphereData, createPointsData);
		},
		initTextures: function (obj) {
			initTextures(obj, loadTexture);
		},
		createProgram: function (gl, vshader, fshader, tip) {
			var program = createProgram(gl, vshader, fshader);
			if (!program) {
				console.log('Failed to create program');
				return false;
			}

			if (tip) {
				gl.useProgram(program);
			}

			return program;
		},
		createShaders: function () {
			return {
				shape: '' +
					'attribute vec4 a_position;\n' +
					'attribute float a_size;\n' +
					'attribute vec4 a_color;\n' +
					'varying vec4 v_color;\n' +
					'uniform mat4 u_matrix;\n' +
					'void main(){\n' +
					'gl_Position=u_matrix*position;\n' +
					'gl_PointSize=a_size;\n' +
					'v_color=a_color;\n' +
					'}\n',
				color: '' +
					'#ifdef GL_ES\n' +
					'precision mediump float;\n' +
					'#endif\n' +
					'varying vec4 v_color;\n' +
					'void main(){\n' +
					'gl_FragColor=v_color;\n' +
					'}\n'
			};
		},
		AnalysisObj: AnalysisObj
	};
	return $;
}));
