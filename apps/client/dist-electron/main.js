var Hd = Object.defineProperty;
var Gd = (e, t, r) => t in e ? Hd(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[t] = r;
var V = (e, t, r) => Gd(e, typeof t != "symbol" ? t + "" : t, r);
import pt, { app as xt, BrowserWindow as gc, protocol as Wd, net as Vd, ipcMain as rt } from "electron";
import { createRequire as zd } from "node:module";
import Yd, { fileURLToPath as Xd } from "node:url";
import xe from "node:path";
import Xt from "fs/promises";
import Le from "fs";
import Jd from "constants";
import Gr from "stream";
import zn from "util";
import yc from "assert";
import Q from "path";
import Wr from "child_process";
import Yn from "events";
import Vr from "crypto";
import Ec from "tty";
import wt from "os";
import ar from "url";
import Kd from "string_decoder";
import vc from "zlib";
import wc from "http";
import Qd from "https";
var Te = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Zd(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Me = {}, Ut = {}, Pe = {};
Pe.fromCallback = function(e) {
  return Object.defineProperty(function(...t) {
    if (typeof t[t.length - 1] == "function") e.apply(this, t);
    else
      return new Promise((r, n) => {
        t.push((i, o) => i != null ? n(i) : r(o)), e.apply(this, t);
      });
  }, "name", { value: e.name });
};
Pe.fromPromise = function(e) {
  return Object.defineProperty(function(...t) {
    const r = t[t.length - 1];
    if (typeof r != "function") return e.apply(this, t);
    t.pop(), e.apply(this, t).then((n) => r(null, n), r);
  }, "name", { value: e.name });
};
var lt = Jd, eh = process.cwd, In = null, th = process.env.GRACEFUL_FS_PLATFORM || process.platform;
process.cwd = function() {
  return In || (In = eh.call(process)), In;
};
try {
  process.cwd();
} catch {
}
if (typeof process.chdir == "function") {
  var Vs = process.chdir;
  process.chdir = function(e) {
    In = null, Vs.call(process, e);
  }, Object.setPrototypeOf && Object.setPrototypeOf(process.chdir, Vs);
}
var rh = nh;
function nh(e) {
  lt.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./) && t(e), e.lutimes || r(e), e.chown = o(e.chown), e.fchown = o(e.fchown), e.lchown = o(e.lchown), e.chmod = n(e.chmod), e.fchmod = n(e.fchmod), e.lchmod = n(e.lchmod), e.chownSync = s(e.chownSync), e.fchownSync = s(e.fchownSync), e.lchownSync = s(e.lchownSync), e.chmodSync = i(e.chmodSync), e.fchmodSync = i(e.fchmodSync), e.lchmodSync = i(e.lchmodSync), e.stat = a(e.stat), e.fstat = a(e.fstat), e.lstat = a(e.lstat), e.statSync = l(e.statSync), e.fstatSync = l(e.fstatSync), e.lstatSync = l(e.lstatSync), e.chmod && !e.lchmod && (e.lchmod = function(c, u, h) {
    h && process.nextTick(h);
  }, e.lchmodSync = function() {
  }), e.chown && !e.lchown && (e.lchown = function(c, u, h, m) {
    m && process.nextTick(m);
  }, e.lchownSync = function() {
  }), th === "win32" && (e.rename = typeof e.rename != "function" ? e.rename : function(c) {
    function u(h, m, v) {
      var E = Date.now(), S = 0;
      c(h, m, function A(b) {
        if (b && (b.code === "EACCES" || b.code === "EPERM" || b.code === "EBUSY") && Date.now() - E < 6e4) {
          setTimeout(function() {
            e.stat(m, function(N, x) {
              N && N.code === "ENOENT" ? c(h, m, A) : v(b);
            });
          }, S), S < 100 && (S += 10);
          return;
        }
        v && v(b);
      });
    }
    return Object.setPrototypeOf && Object.setPrototypeOf(u, c), u;
  }(e.rename)), e.read = typeof e.read != "function" ? e.read : function(c) {
    function u(h, m, v, E, S, A) {
      var b;
      if (A && typeof A == "function") {
        var N = 0;
        b = function(x, B, q) {
          if (x && x.code === "EAGAIN" && N < 10)
            return N++, c.call(e, h, m, v, E, S, b);
          A.apply(this, arguments);
        };
      }
      return c.call(e, h, m, v, E, S, b);
    }
    return Object.setPrototypeOf && Object.setPrototypeOf(u, c), u;
  }(e.read), e.readSync = typeof e.readSync != "function" ? e.readSync : /* @__PURE__ */ function(c) {
    return function(u, h, m, v, E) {
      for (var S = 0; ; )
        try {
          return c.call(e, u, h, m, v, E);
        } catch (A) {
          if (A.code === "EAGAIN" && S < 10) {
            S++;
            continue;
          }
          throw A;
        }
    };
  }(e.readSync);
  function t(c) {
    c.lchmod = function(u, h, m) {
      c.open(
        u,
        lt.O_WRONLY | lt.O_SYMLINK,
        h,
        function(v, E) {
          if (v) {
            m && m(v);
            return;
          }
          c.fchmod(E, h, function(S) {
            c.close(E, function(A) {
              m && m(S || A);
            });
          });
        }
      );
    }, c.lchmodSync = function(u, h) {
      var m = c.openSync(u, lt.O_WRONLY | lt.O_SYMLINK, h), v = !0, E;
      try {
        E = c.fchmodSync(m, h), v = !1;
      } finally {
        if (v)
          try {
            c.closeSync(m);
          } catch {
          }
        else
          c.closeSync(m);
      }
      return E;
    };
  }
  function r(c) {
    lt.hasOwnProperty("O_SYMLINK") && c.futimes ? (c.lutimes = function(u, h, m, v) {
      c.open(u, lt.O_SYMLINK, function(E, S) {
        if (E) {
          v && v(E);
          return;
        }
        c.futimes(S, h, m, function(A) {
          c.close(S, function(b) {
            v && v(A || b);
          });
        });
      });
    }, c.lutimesSync = function(u, h, m) {
      var v = c.openSync(u, lt.O_SYMLINK), E, S = !0;
      try {
        E = c.futimesSync(v, h, m), S = !1;
      } finally {
        if (S)
          try {
            c.closeSync(v);
          } catch {
          }
        else
          c.closeSync(v);
      }
      return E;
    }) : c.futimes && (c.lutimes = function(u, h, m, v) {
      v && process.nextTick(v);
    }, c.lutimesSync = function() {
    });
  }
  function n(c) {
    return c && function(u, h, m) {
      return c.call(e, u, h, function(v) {
        f(v) && (v = null), m && m.apply(this, arguments);
      });
    };
  }
  function i(c) {
    return c && function(u, h) {
      try {
        return c.call(e, u, h);
      } catch (m) {
        if (!f(m)) throw m;
      }
    };
  }
  function o(c) {
    return c && function(u, h, m, v) {
      return c.call(e, u, h, m, function(E) {
        f(E) && (E = null), v && v.apply(this, arguments);
      });
    };
  }
  function s(c) {
    return c && function(u, h, m) {
      try {
        return c.call(e, u, h, m);
      } catch (v) {
        if (!f(v)) throw v;
      }
    };
  }
  function a(c) {
    return c && function(u, h, m) {
      typeof h == "function" && (m = h, h = null);
      function v(E, S) {
        S && (S.uid < 0 && (S.uid += 4294967296), S.gid < 0 && (S.gid += 4294967296)), m && m.apply(this, arguments);
      }
      return h ? c.call(e, u, h, v) : c.call(e, u, v);
    };
  }
  function l(c) {
    return c && function(u, h) {
      var m = h ? c.call(e, u, h) : c.call(e, u);
      return m && (m.uid < 0 && (m.uid += 4294967296), m.gid < 0 && (m.gid += 4294967296)), m;
    };
  }
  function f(c) {
    if (!c || c.code === "ENOSYS")
      return !0;
    var u = !process.getuid || process.getuid() !== 0;
    return !!(u && (c.code === "EINVAL" || c.code === "EPERM"));
  }
}
var zs = Gr.Stream, ih = oh;
function oh(e) {
  return {
    ReadStream: t,
    WriteStream: r
  };
  function t(n, i) {
    if (!(this instanceof t)) return new t(n, i);
    zs.call(this);
    var o = this;
    this.path = n, this.fd = null, this.readable = !0, this.paused = !1, this.flags = "r", this.mode = 438, this.bufferSize = 64 * 1024, i = i || {};
    for (var s = Object.keys(i), a = 0, l = s.length; a < l; a++) {
      var f = s[a];
      this[f] = i[f];
    }
    if (this.encoding && this.setEncoding(this.encoding), this.start !== void 0) {
      if (typeof this.start != "number")
        throw TypeError("start must be a Number");
      if (this.end === void 0)
        this.end = 1 / 0;
      else if (typeof this.end != "number")
        throw TypeError("end must be a Number");
      if (this.start > this.end)
        throw new Error("start must be <= end");
      this.pos = this.start;
    }
    if (this.fd !== null) {
      process.nextTick(function() {
        o._read();
      });
      return;
    }
    e.open(this.path, this.flags, this.mode, function(c, u) {
      if (c) {
        o.emit("error", c), o.readable = !1;
        return;
      }
      o.fd = u, o.emit("open", u), o._read();
    });
  }
  function r(n, i) {
    if (!(this instanceof r)) return new r(n, i);
    zs.call(this), this.path = n, this.fd = null, this.writable = !0, this.flags = "w", this.encoding = "binary", this.mode = 438, this.bytesWritten = 0, i = i || {};
    for (var o = Object.keys(i), s = 0, a = o.length; s < a; s++) {
      var l = o[s];
      this[l] = i[l];
    }
    if (this.start !== void 0) {
      if (typeof this.start != "number")
        throw TypeError("start must be a Number");
      if (this.start < 0)
        throw new Error("start must be >= zero");
      this.pos = this.start;
    }
    this.busy = !1, this._queue = [], this.fd === null && (this._open = e.open, this._queue.push([this._open, this.path, this.flags, this.mode, void 0]), this.flush());
  }
}
var sh = lh, ah = Object.getPrototypeOf || function(e) {
  return e.__proto__;
};
function lh(e) {
  if (e === null || typeof e != "object")
    return e;
  if (e instanceof Object)
    var t = { __proto__: ah(e) };
  else
    var t = /* @__PURE__ */ Object.create(null);
  return Object.getOwnPropertyNames(e).forEach(function(r) {
    Object.defineProperty(t, r, Object.getOwnPropertyDescriptor(e, r));
  }), t;
}
var oe = Le, ch = rh, uh = ih, fh = sh, pn = zn, Ee, xn;
typeof Symbol == "function" && typeof Symbol.for == "function" ? (Ee = Symbol.for("graceful-fs.queue"), xn = Symbol.for("graceful-fs.previous")) : (Ee = "___graceful-fs.queue", xn = "___graceful-fs.previous");
function dh() {
}
function _c(e, t) {
  Object.defineProperty(e, Ee, {
    get: function() {
      return t;
    }
  });
}
var $t = dh;
pn.debuglog ? $t = pn.debuglog("gfs4") : /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && ($t = function() {
  var e = pn.format.apply(pn, arguments);
  e = "GFS4: " + e.split(/\n/).join(`
GFS4: `), console.error(e);
});
if (!oe[Ee]) {
  var hh = Te[Ee] || [];
  _c(oe, hh), oe.close = function(e) {
    function t(r, n) {
      return e.call(oe, r, function(i) {
        i || Ys(), typeof n == "function" && n.apply(this, arguments);
      });
    }
    return Object.defineProperty(t, xn, {
      value: e
    }), t;
  }(oe.close), oe.closeSync = function(e) {
    function t(r) {
      e.apply(oe, arguments), Ys();
    }
    return Object.defineProperty(t, xn, {
      value: e
    }), t;
  }(oe.closeSync), /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && process.on("exit", function() {
    $t(oe[Ee]), yc.equal(oe[Ee].length, 0);
  });
}
Te[Ee] || _c(Te, oe[Ee]);
var Re = Xo(fh(oe));
process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !oe.__patched && (Re = Xo(oe), oe.__patched = !0);
function Xo(e) {
  ch(e), e.gracefulify = Xo, e.createReadStream = B, e.createWriteStream = q;
  var t = e.readFile;
  e.readFile = r;
  function r(y, z, H) {
    return typeof z == "function" && (H = z, z = null), M(y, z, H);
    function M(Z, R, O, D) {
      return t(Z, R, function(C) {
        C && (C.code === "EMFILE" || C.code === "ENFILE") ? qt([M, [Z, R, O], C, D || Date.now(), Date.now()]) : typeof O == "function" && O.apply(this, arguments);
      });
    }
  }
  var n = e.writeFile;
  e.writeFile = i;
  function i(y, z, H, M) {
    return typeof H == "function" && (M = H, H = null), Z(y, z, H, M);
    function Z(R, O, D, C, $) {
      return n(R, O, D, function(I) {
        I && (I.code === "EMFILE" || I.code === "ENFILE") ? qt([Z, [R, O, D, C], I, $ || Date.now(), Date.now()]) : typeof C == "function" && C.apply(this, arguments);
      });
    }
  }
  var o = e.appendFile;
  o && (e.appendFile = s);
  function s(y, z, H, M) {
    return typeof H == "function" && (M = H, H = null), Z(y, z, H, M);
    function Z(R, O, D, C, $) {
      return o(R, O, D, function(I) {
        I && (I.code === "EMFILE" || I.code === "ENFILE") ? qt([Z, [R, O, D, C], I, $ || Date.now(), Date.now()]) : typeof C == "function" && C.apply(this, arguments);
      });
    }
  }
  var a = e.copyFile;
  a && (e.copyFile = l);
  function l(y, z, H, M) {
    return typeof H == "function" && (M = H, H = 0), Z(y, z, H, M);
    function Z(R, O, D, C, $) {
      return a(R, O, D, function(I) {
        I && (I.code === "EMFILE" || I.code === "ENFILE") ? qt([Z, [R, O, D, C], I, $ || Date.now(), Date.now()]) : typeof C == "function" && C.apply(this, arguments);
      });
    }
  }
  var f = e.readdir;
  e.readdir = u;
  var c = /^v[0-5]\./;
  function u(y, z, H) {
    typeof z == "function" && (H = z, z = null);
    var M = c.test(process.version) ? function(O, D, C, $) {
      return f(O, Z(
        O,
        D,
        C,
        $
      ));
    } : function(O, D, C, $) {
      return f(O, D, Z(
        O,
        D,
        C,
        $
      ));
    };
    return M(y, z, H);
    function Z(R, O, D, C) {
      return function($, I) {
        $ && ($.code === "EMFILE" || $.code === "ENFILE") ? qt([
          M,
          [R, O, D],
          $,
          C || Date.now(),
          Date.now()
        ]) : (I && I.sort && I.sort(), typeof D == "function" && D.call(this, $, I));
      };
    }
  }
  if (process.version.substr(0, 4) === "v0.8") {
    var h = uh(e);
    A = h.ReadStream, N = h.WriteStream;
  }
  var m = e.ReadStream;
  m && (A.prototype = Object.create(m.prototype), A.prototype.open = b);
  var v = e.WriteStream;
  v && (N.prototype = Object.create(v.prototype), N.prototype.open = x), Object.defineProperty(e, "ReadStream", {
    get: function() {
      return A;
    },
    set: function(y) {
      A = y;
    },
    enumerable: !0,
    configurable: !0
  }), Object.defineProperty(e, "WriteStream", {
    get: function() {
      return N;
    },
    set: function(y) {
      N = y;
    },
    enumerable: !0,
    configurable: !0
  });
  var E = A;
  Object.defineProperty(e, "FileReadStream", {
    get: function() {
      return E;
    },
    set: function(y) {
      E = y;
    },
    enumerable: !0,
    configurable: !0
  });
  var S = N;
  Object.defineProperty(e, "FileWriteStream", {
    get: function() {
      return S;
    },
    set: function(y) {
      S = y;
    },
    enumerable: !0,
    configurable: !0
  });
  function A(y, z) {
    return this instanceof A ? (m.apply(this, arguments), this) : A.apply(Object.create(A.prototype), arguments);
  }
  function b() {
    var y = this;
    le(y.path, y.flags, y.mode, function(z, H) {
      z ? (y.autoClose && y.destroy(), y.emit("error", z)) : (y.fd = H, y.emit("open", H), y.read());
    });
  }
  function N(y, z) {
    return this instanceof N ? (v.apply(this, arguments), this) : N.apply(Object.create(N.prototype), arguments);
  }
  function x() {
    var y = this;
    le(y.path, y.flags, y.mode, function(z, H) {
      z ? (y.destroy(), y.emit("error", z)) : (y.fd = H, y.emit("open", H));
    });
  }
  function B(y, z) {
    return new e.ReadStream(y, z);
  }
  function q(y, z) {
    return new e.WriteStream(y, z);
  }
  var j = e.open;
  e.open = le;
  function le(y, z, H, M) {
    return typeof H == "function" && (M = H, H = null), Z(y, z, H, M);
    function Z(R, O, D, C, $) {
      return j(R, O, D, function(I, k) {
        I && (I.code === "EMFILE" || I.code === "ENFILE") ? qt([Z, [R, O, D, C], I, $ || Date.now(), Date.now()]) : typeof C == "function" && C.apply(this, arguments);
      });
    }
  }
  return e;
}
function qt(e) {
  $t("ENQUEUE", e[0].name, e[1]), oe[Ee].push(e), Jo();
}
var mn;
function Ys() {
  for (var e = Date.now(), t = 0; t < oe[Ee].length; ++t)
    oe[Ee][t].length > 2 && (oe[Ee][t][3] = e, oe[Ee][t][4] = e);
  Jo();
}
function Jo() {
  if (clearTimeout(mn), mn = void 0, oe[Ee].length !== 0) {
    var e = oe[Ee].shift(), t = e[0], r = e[1], n = e[2], i = e[3], o = e[4];
    if (i === void 0)
      $t("RETRY", t.name, r), t.apply(null, r);
    else if (Date.now() - i >= 6e4) {
      $t("TIMEOUT", t.name, r);
      var s = r.pop();
      typeof s == "function" && s.call(null, n);
    } else {
      var a = Date.now() - o, l = Math.max(o - i, 1), f = Math.min(l * 1.2, 100);
      a >= f ? ($t("RETRY", t.name, r), t.apply(null, r.concat([i]))) : oe[Ee].push(e);
    }
    mn === void 0 && (mn = setTimeout(Jo, 0));
  }
}
(function(e) {
  const t = Pe.fromCallback, r = Re, n = [
    "access",
    "appendFile",
    "chmod",
    "chown",
    "close",
    "copyFile",
    "fchmod",
    "fchown",
    "fdatasync",
    "fstat",
    "fsync",
    "ftruncate",
    "futimes",
    "lchmod",
    "lchown",
    "link",
    "lstat",
    "mkdir",
    "mkdtemp",
    "open",
    "opendir",
    "readdir",
    "readFile",
    "readlink",
    "realpath",
    "rename",
    "rm",
    "rmdir",
    "stat",
    "symlink",
    "truncate",
    "unlink",
    "utimes",
    "writeFile"
  ].filter((i) => typeof r[i] == "function");
  Object.assign(e, r), n.forEach((i) => {
    e[i] = t(r[i]);
  }), e.exists = function(i, o) {
    return typeof o == "function" ? r.exists(i, o) : new Promise((s) => r.exists(i, s));
  }, e.read = function(i, o, s, a, l, f) {
    return typeof f == "function" ? r.read(i, o, s, a, l, f) : new Promise((c, u) => {
      r.read(i, o, s, a, l, (h, m, v) => {
        if (h) return u(h);
        c({ bytesRead: m, buffer: v });
      });
    });
  }, e.write = function(i, o, ...s) {
    return typeof s[s.length - 1] == "function" ? r.write(i, o, ...s) : new Promise((a, l) => {
      r.write(i, o, ...s, (f, c, u) => {
        if (f) return l(f);
        a({ bytesWritten: c, buffer: u });
      });
    });
  }, typeof r.writev == "function" && (e.writev = function(i, o, ...s) {
    return typeof s[s.length - 1] == "function" ? r.writev(i, o, ...s) : new Promise((a, l) => {
      r.writev(i, o, ...s, (f, c, u) => {
        if (f) return l(f);
        a({ bytesWritten: c, buffers: u });
      });
    });
  }), typeof r.realpath.native == "function" ? e.realpath.native = t(r.realpath.native) : process.emitWarning(
    "fs.realpath.native is not a function. Is fs being monkey-patched?",
    "Warning",
    "fs-extra-WARN0003"
  );
})(Ut);
var Ko = {}, Sc = {};
const ph = Q;
Sc.checkPath = function(t) {
  if (process.platform === "win32" && /[<>:"|?*]/.test(t.replace(ph.parse(t).root, ""))) {
    const n = new Error(`Path contains invalid characters: ${t}`);
    throw n.code = "EINVAL", n;
  }
};
const Ac = Ut, { checkPath: bc } = Sc, Tc = (e) => {
  const t = { mode: 511 };
  return typeof e == "number" ? e : { ...t, ...e }.mode;
};
Ko.makeDir = async (e, t) => (bc(e), Ac.mkdir(e, {
  mode: Tc(t),
  recursive: !0
}));
Ko.makeDirSync = (e, t) => (bc(e), Ac.mkdirSync(e, {
  mode: Tc(t),
  recursive: !0
}));
const mh = Pe.fromPromise, { makeDir: gh, makeDirSync: Ci } = Ko, Oi = mh(gh);
var Ke = {
  mkdirs: Oi,
  mkdirsSync: Ci,
  // alias
  mkdirp: Oi,
  mkdirpSync: Ci,
  ensureDir: Oi,
  ensureDirSync: Ci
};
const yh = Pe.fromPromise, Cc = Ut;
function Eh(e) {
  return Cc.access(e).then(() => !0).catch(() => !1);
}
var kt = {
  pathExists: yh(Eh),
  pathExistsSync: Cc.existsSync
};
const tr = Re;
function vh(e, t, r, n) {
  tr.open(e, "r+", (i, o) => {
    if (i) return n(i);
    tr.futimes(o, t, r, (s) => {
      tr.close(o, (a) => {
        n && n(s || a);
      });
    });
  });
}
function wh(e, t, r) {
  const n = tr.openSync(e, "r+");
  return tr.futimesSync(n, t, r), tr.closeSync(n);
}
var Oc = {
  utimesMillis: vh,
  utimesMillisSync: wh
};
const nr = Ut, pe = Q, _h = zn;
function Sh(e, t, r) {
  const n = r.dereference ? (i) => nr.stat(i, { bigint: !0 }) : (i) => nr.lstat(i, { bigint: !0 });
  return Promise.all([
    n(e),
    n(t).catch((i) => {
      if (i.code === "ENOENT") return null;
      throw i;
    })
  ]).then(([i, o]) => ({ srcStat: i, destStat: o }));
}
function Ah(e, t, r) {
  let n;
  const i = r.dereference ? (s) => nr.statSync(s, { bigint: !0 }) : (s) => nr.lstatSync(s, { bigint: !0 }), o = i(e);
  try {
    n = i(t);
  } catch (s) {
    if (s.code === "ENOENT") return { srcStat: o, destStat: null };
    throw s;
  }
  return { srcStat: o, destStat: n };
}
function bh(e, t, r, n, i) {
  _h.callbackify(Sh)(e, t, n, (o, s) => {
    if (o) return i(o);
    const { srcStat: a, destStat: l } = s;
    if (l) {
      if (zr(a, l)) {
        const f = pe.basename(e), c = pe.basename(t);
        return r === "move" && f !== c && f.toLowerCase() === c.toLowerCase() ? i(null, { srcStat: a, destStat: l, isChangingCase: !0 }) : i(new Error("Source and destination must not be the same."));
      }
      if (a.isDirectory() && !l.isDirectory())
        return i(new Error(`Cannot overwrite non-directory '${t}' with directory '${e}'.`));
      if (!a.isDirectory() && l.isDirectory())
        return i(new Error(`Cannot overwrite directory '${t}' with non-directory '${e}'.`));
    }
    return a.isDirectory() && Qo(e, t) ? i(new Error(Xn(e, t, r))) : i(null, { srcStat: a, destStat: l });
  });
}
function Th(e, t, r, n) {
  const { srcStat: i, destStat: o } = Ah(e, t, n);
  if (o) {
    if (zr(i, o)) {
      const s = pe.basename(e), a = pe.basename(t);
      if (r === "move" && s !== a && s.toLowerCase() === a.toLowerCase())
        return { srcStat: i, destStat: o, isChangingCase: !0 };
      throw new Error("Source and destination must not be the same.");
    }
    if (i.isDirectory() && !o.isDirectory())
      throw new Error(`Cannot overwrite non-directory '${t}' with directory '${e}'.`);
    if (!i.isDirectory() && o.isDirectory())
      throw new Error(`Cannot overwrite directory '${t}' with non-directory '${e}'.`);
  }
  if (i.isDirectory() && Qo(e, t))
    throw new Error(Xn(e, t, r));
  return { srcStat: i, destStat: o };
}
function Pc(e, t, r, n, i) {
  const o = pe.resolve(pe.dirname(e)), s = pe.resolve(pe.dirname(r));
  if (s === o || s === pe.parse(s).root) return i();
  nr.stat(s, { bigint: !0 }, (a, l) => a ? a.code === "ENOENT" ? i() : i(a) : zr(t, l) ? i(new Error(Xn(e, r, n))) : Pc(e, t, s, n, i));
}
function Rc(e, t, r, n) {
  const i = pe.resolve(pe.dirname(e)), o = pe.resolve(pe.dirname(r));
  if (o === i || o === pe.parse(o).root) return;
  let s;
  try {
    s = nr.statSync(o, { bigint: !0 });
  } catch (a) {
    if (a.code === "ENOENT") return;
    throw a;
  }
  if (zr(t, s))
    throw new Error(Xn(e, r, n));
  return Rc(e, t, o, n);
}
function zr(e, t) {
  return t.ino && t.dev && t.ino === e.ino && t.dev === e.dev;
}
function Qo(e, t) {
  const r = pe.resolve(e).split(pe.sep).filter((i) => i), n = pe.resolve(t).split(pe.sep).filter((i) => i);
  return r.reduce((i, o, s) => i && n[s] === o, !0);
}
function Xn(e, t, r) {
  return `Cannot ${r} '${e}' to a subdirectory of itself, '${t}'.`;
}
var lr = {
  checkPaths: bh,
  checkPathsSync: Th,
  checkParentPaths: Pc,
  checkParentPathsSync: Rc,
  isSrcSubdir: Qo,
  areIdentical: zr
};
const Ne = Re, Rr = Q, Ch = Ke.mkdirs, Oh = kt.pathExists, Ph = Oc.utimesMillis, Ir = lr;
function Rh(e, t, r, n) {
  typeof r == "function" && !n ? (n = r, r = {}) : typeof r == "function" && (r = { filter: r }), n = n || function() {
  }, r = r || {}, r.clobber = "clobber" in r ? !!r.clobber : !0, r.overwrite = "overwrite" in r ? !!r.overwrite : r.clobber, r.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
    `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
    "Warning",
    "fs-extra-WARN0001"
  ), Ir.checkPaths(e, t, "copy", r, (i, o) => {
    if (i) return n(i);
    const { srcStat: s, destStat: a } = o;
    Ir.checkParentPaths(e, s, t, "copy", (l) => l ? n(l) : r.filter ? Ic(Xs, a, e, t, r, n) : Xs(a, e, t, r, n));
  });
}
function Xs(e, t, r, n, i) {
  const o = Rr.dirname(r);
  Oh(o, (s, a) => {
    if (s) return i(s);
    if (a) return Ln(e, t, r, n, i);
    Ch(o, (l) => l ? i(l) : Ln(e, t, r, n, i));
  });
}
function Ic(e, t, r, n, i, o) {
  Promise.resolve(i.filter(r, n)).then((s) => s ? e(t, r, n, i, o) : o(), (s) => o(s));
}
function Ih(e, t, r, n, i) {
  return n.filter ? Ic(Ln, e, t, r, n, i) : Ln(e, t, r, n, i);
}
function Ln(e, t, r, n, i) {
  (n.dereference ? Ne.stat : Ne.lstat)(t, (s, a) => s ? i(s) : a.isDirectory() ? Uh(a, e, t, r, n, i) : a.isFile() || a.isCharacterDevice() || a.isBlockDevice() ? Dh(a, e, t, r, n, i) : a.isSymbolicLink() ? jh(e, t, r, n, i) : a.isSocket() ? i(new Error(`Cannot copy a socket file: ${t}`)) : a.isFIFO() ? i(new Error(`Cannot copy a FIFO pipe: ${t}`)) : i(new Error(`Unknown file: ${t}`)));
}
function Dh(e, t, r, n, i, o) {
  return t ? Nh(e, r, n, i, o) : Dc(e, r, n, i, o);
}
function Nh(e, t, r, n, i) {
  if (n.overwrite)
    Ne.unlink(r, (o) => o ? i(o) : Dc(e, t, r, n, i));
  else return n.errorOnExist ? i(new Error(`'${r}' already exists`)) : i();
}
function Dc(e, t, r, n, i) {
  Ne.copyFile(t, r, (o) => o ? i(o) : n.preserveTimestamps ? $h(e.mode, t, r, i) : Jn(r, e.mode, i));
}
function $h(e, t, r, n) {
  return Fh(e) ? xh(r, e, (i) => i ? n(i) : Js(e, t, r, n)) : Js(e, t, r, n);
}
function Fh(e) {
  return (e & 128) === 0;
}
function xh(e, t, r) {
  return Jn(e, t | 128, r);
}
function Js(e, t, r, n) {
  Lh(t, r, (i) => i ? n(i) : Jn(r, e, n));
}
function Jn(e, t, r) {
  return Ne.chmod(e, t, r);
}
function Lh(e, t, r) {
  Ne.stat(e, (n, i) => n ? r(n) : Ph(t, i.atime, i.mtime, r));
}
function Uh(e, t, r, n, i, o) {
  return t ? Nc(r, n, i, o) : kh(e.mode, r, n, i, o);
}
function kh(e, t, r, n, i) {
  Ne.mkdir(r, (o) => {
    if (o) return i(o);
    Nc(t, r, n, (s) => s ? i(s) : Jn(r, e, i));
  });
}
function Nc(e, t, r, n) {
  Ne.readdir(e, (i, o) => i ? n(i) : $c(o, e, t, r, n));
}
function $c(e, t, r, n, i) {
  const o = e.pop();
  return o ? Mh(e, o, t, r, n, i) : i();
}
function Mh(e, t, r, n, i, o) {
  const s = Rr.join(r, t), a = Rr.join(n, t);
  Ir.checkPaths(s, a, "copy", i, (l, f) => {
    if (l) return o(l);
    const { destStat: c } = f;
    Ih(c, s, a, i, (u) => u ? o(u) : $c(e, r, n, i, o));
  });
}
function jh(e, t, r, n, i) {
  Ne.readlink(t, (o, s) => {
    if (o) return i(o);
    if (n.dereference && (s = Rr.resolve(process.cwd(), s)), e)
      Ne.readlink(r, (a, l) => a ? a.code === "EINVAL" || a.code === "UNKNOWN" ? Ne.symlink(s, r, i) : i(a) : (n.dereference && (l = Rr.resolve(process.cwd(), l)), Ir.isSrcSubdir(s, l) ? i(new Error(`Cannot copy '${s}' to a subdirectory of itself, '${l}'.`)) : e.isDirectory() && Ir.isSrcSubdir(l, s) ? i(new Error(`Cannot overwrite '${l}' with '${s}'.`)) : Bh(s, r, i)));
    else
      return Ne.symlink(s, r, i);
  });
}
function Bh(e, t, r) {
  Ne.unlink(t, (n) => n ? r(n) : Ne.symlink(e, t, r));
}
var qh = Rh;
const Se = Re, Dr = Q, Hh = Ke.mkdirsSync, Gh = Oc.utimesMillisSync, Nr = lr;
function Wh(e, t, r) {
  typeof r == "function" && (r = { filter: r }), r = r || {}, r.clobber = "clobber" in r ? !!r.clobber : !0, r.overwrite = "overwrite" in r ? !!r.overwrite : r.clobber, r.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
    `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
    "Warning",
    "fs-extra-WARN0002"
  );
  const { srcStat: n, destStat: i } = Nr.checkPathsSync(e, t, "copy", r);
  return Nr.checkParentPathsSync(e, n, t, "copy"), Vh(i, e, t, r);
}
function Vh(e, t, r, n) {
  if (n.filter && !n.filter(t, r)) return;
  const i = Dr.dirname(r);
  return Se.existsSync(i) || Hh(i), Fc(e, t, r, n);
}
function zh(e, t, r, n) {
  if (!(n.filter && !n.filter(t, r)))
    return Fc(e, t, r, n);
}
function Fc(e, t, r, n) {
  const o = (n.dereference ? Se.statSync : Se.lstatSync)(t);
  if (o.isDirectory()) return ep(o, e, t, r, n);
  if (o.isFile() || o.isCharacterDevice() || o.isBlockDevice()) return Yh(o, e, t, r, n);
  if (o.isSymbolicLink()) return np(e, t, r, n);
  throw o.isSocket() ? new Error(`Cannot copy a socket file: ${t}`) : o.isFIFO() ? new Error(`Cannot copy a FIFO pipe: ${t}`) : new Error(`Unknown file: ${t}`);
}
function Yh(e, t, r, n, i) {
  return t ? Xh(e, r, n, i) : xc(e, r, n, i);
}
function Xh(e, t, r, n) {
  if (n.overwrite)
    return Se.unlinkSync(r), xc(e, t, r, n);
  if (n.errorOnExist)
    throw new Error(`'${r}' already exists`);
}
function xc(e, t, r, n) {
  return Se.copyFileSync(t, r), n.preserveTimestamps && Jh(e.mode, t, r), Zo(r, e.mode);
}
function Jh(e, t, r) {
  return Kh(e) && Qh(r, e), Zh(t, r);
}
function Kh(e) {
  return (e & 128) === 0;
}
function Qh(e, t) {
  return Zo(e, t | 128);
}
function Zo(e, t) {
  return Se.chmodSync(e, t);
}
function Zh(e, t) {
  const r = Se.statSync(e);
  return Gh(t, r.atime, r.mtime);
}
function ep(e, t, r, n, i) {
  return t ? Lc(r, n, i) : tp(e.mode, r, n, i);
}
function tp(e, t, r, n) {
  return Se.mkdirSync(r), Lc(t, r, n), Zo(r, e);
}
function Lc(e, t, r) {
  Se.readdirSync(e).forEach((n) => rp(n, e, t, r));
}
function rp(e, t, r, n) {
  const i = Dr.join(t, e), o = Dr.join(r, e), { destStat: s } = Nr.checkPathsSync(i, o, "copy", n);
  return zh(s, i, o, n);
}
function np(e, t, r, n) {
  let i = Se.readlinkSync(t);
  if (n.dereference && (i = Dr.resolve(process.cwd(), i)), e) {
    let o;
    try {
      o = Se.readlinkSync(r);
    } catch (s) {
      if (s.code === "EINVAL" || s.code === "UNKNOWN") return Se.symlinkSync(i, r);
      throw s;
    }
    if (n.dereference && (o = Dr.resolve(process.cwd(), o)), Nr.isSrcSubdir(i, o))
      throw new Error(`Cannot copy '${i}' to a subdirectory of itself, '${o}'.`);
    if (Se.statSync(r).isDirectory() && Nr.isSrcSubdir(o, i))
      throw new Error(`Cannot overwrite '${o}' with '${i}'.`);
    return ip(i, r);
  } else
    return Se.symlinkSync(i, r);
}
function ip(e, t) {
  return Se.unlinkSync(t), Se.symlinkSync(e, t);
}
var op = Wh;
const sp = Pe.fromCallback;
var es = {
  copy: sp(qh),
  copySync: op
};
const Ks = Re, Uc = Q, te = yc, $r = process.platform === "win32";
function kc(e) {
  [
    "unlink",
    "chmod",
    "stat",
    "lstat",
    "rmdir",
    "readdir"
  ].forEach((r) => {
    e[r] = e[r] || Ks[r], r = r + "Sync", e[r] = e[r] || Ks[r];
  }), e.maxBusyTries = e.maxBusyTries || 3;
}
function ts(e, t, r) {
  let n = 0;
  typeof t == "function" && (r = t, t = {}), te(e, "rimraf: missing path"), te.strictEqual(typeof e, "string", "rimraf: path should be a string"), te.strictEqual(typeof r, "function", "rimraf: callback function required"), te(t, "rimraf: invalid options argument provided"), te.strictEqual(typeof t, "object", "rimraf: options should be object"), kc(t), Qs(e, t, function i(o) {
    if (o) {
      if ((o.code === "EBUSY" || o.code === "ENOTEMPTY" || o.code === "EPERM") && n < t.maxBusyTries) {
        n++;
        const s = n * 100;
        return setTimeout(() => Qs(e, t, i), s);
      }
      o.code === "ENOENT" && (o = null);
    }
    r(o);
  });
}
function Qs(e, t, r) {
  te(e), te(t), te(typeof r == "function"), t.lstat(e, (n, i) => {
    if (n && n.code === "ENOENT")
      return r(null);
    if (n && n.code === "EPERM" && $r)
      return Zs(e, t, n, r);
    if (i && i.isDirectory())
      return Dn(e, t, n, r);
    t.unlink(e, (o) => {
      if (o) {
        if (o.code === "ENOENT")
          return r(null);
        if (o.code === "EPERM")
          return $r ? Zs(e, t, o, r) : Dn(e, t, o, r);
        if (o.code === "EISDIR")
          return Dn(e, t, o, r);
      }
      return r(o);
    });
  });
}
function Zs(e, t, r, n) {
  te(e), te(t), te(typeof n == "function"), t.chmod(e, 438, (i) => {
    i ? n(i.code === "ENOENT" ? null : r) : t.stat(e, (o, s) => {
      o ? n(o.code === "ENOENT" ? null : r) : s.isDirectory() ? Dn(e, t, r, n) : t.unlink(e, n);
    });
  });
}
function ea(e, t, r) {
  let n;
  te(e), te(t);
  try {
    t.chmodSync(e, 438);
  } catch (i) {
    if (i.code === "ENOENT")
      return;
    throw r;
  }
  try {
    n = t.statSync(e);
  } catch (i) {
    if (i.code === "ENOENT")
      return;
    throw r;
  }
  n.isDirectory() ? Nn(e, t, r) : t.unlinkSync(e);
}
function Dn(e, t, r, n) {
  te(e), te(t), te(typeof n == "function"), t.rmdir(e, (i) => {
    i && (i.code === "ENOTEMPTY" || i.code === "EEXIST" || i.code === "EPERM") ? ap(e, t, n) : i && i.code === "ENOTDIR" ? n(r) : n(i);
  });
}
function ap(e, t, r) {
  te(e), te(t), te(typeof r == "function"), t.readdir(e, (n, i) => {
    if (n) return r(n);
    let o = i.length, s;
    if (o === 0) return t.rmdir(e, r);
    i.forEach((a) => {
      ts(Uc.join(e, a), t, (l) => {
        if (!s) {
          if (l) return r(s = l);
          --o === 0 && t.rmdir(e, r);
        }
      });
    });
  });
}
function Mc(e, t) {
  let r;
  t = t || {}, kc(t), te(e, "rimraf: missing path"), te.strictEqual(typeof e, "string", "rimraf: path should be a string"), te(t, "rimraf: missing options"), te.strictEqual(typeof t, "object", "rimraf: options should be object");
  try {
    r = t.lstatSync(e);
  } catch (n) {
    if (n.code === "ENOENT")
      return;
    n.code === "EPERM" && $r && ea(e, t, n);
  }
  try {
    r && r.isDirectory() ? Nn(e, t, null) : t.unlinkSync(e);
  } catch (n) {
    if (n.code === "ENOENT")
      return;
    if (n.code === "EPERM")
      return $r ? ea(e, t, n) : Nn(e, t, n);
    if (n.code !== "EISDIR")
      throw n;
    Nn(e, t, n);
  }
}
function Nn(e, t, r) {
  te(e), te(t);
  try {
    t.rmdirSync(e);
  } catch (n) {
    if (n.code === "ENOTDIR")
      throw r;
    if (n.code === "ENOTEMPTY" || n.code === "EEXIST" || n.code === "EPERM")
      lp(e, t);
    else if (n.code !== "ENOENT")
      throw n;
  }
}
function lp(e, t) {
  if (te(e), te(t), t.readdirSync(e).forEach((r) => Mc(Uc.join(e, r), t)), $r) {
    const r = Date.now();
    do
      try {
        return t.rmdirSync(e, t);
      } catch {
      }
    while (Date.now() - r < 500);
  } else
    return t.rmdirSync(e, t);
}
var cp = ts;
ts.sync = Mc;
const Un = Re, up = Pe.fromCallback, jc = cp;
function fp(e, t) {
  if (Un.rm) return Un.rm(e, { recursive: !0, force: !0 }, t);
  jc(e, t);
}
function dp(e) {
  if (Un.rmSync) return Un.rmSync(e, { recursive: !0, force: !0 });
  jc.sync(e);
}
var Kn = {
  remove: up(fp),
  removeSync: dp
};
const hp = Pe.fromPromise, Bc = Ut, qc = Q, Hc = Ke, Gc = Kn, ta = hp(async function(t) {
  let r;
  try {
    r = await Bc.readdir(t);
  } catch {
    return Hc.mkdirs(t);
  }
  return Promise.all(r.map((n) => Gc.remove(qc.join(t, n))));
});
function ra(e) {
  let t;
  try {
    t = Bc.readdirSync(e);
  } catch {
    return Hc.mkdirsSync(e);
  }
  t.forEach((r) => {
    r = qc.join(e, r), Gc.removeSync(r);
  });
}
var pp = {
  emptyDirSync: ra,
  emptydirSync: ra,
  emptyDir: ta,
  emptydir: ta
};
const mp = Pe.fromCallback, Wc = Q, ft = Re, Vc = Ke;
function gp(e, t) {
  function r() {
    ft.writeFile(e, "", (n) => {
      if (n) return t(n);
      t();
    });
  }
  ft.stat(e, (n, i) => {
    if (!n && i.isFile()) return t();
    const o = Wc.dirname(e);
    ft.stat(o, (s, a) => {
      if (s)
        return s.code === "ENOENT" ? Vc.mkdirs(o, (l) => {
          if (l) return t(l);
          r();
        }) : t(s);
      a.isDirectory() ? r() : ft.readdir(o, (l) => {
        if (l) return t(l);
      });
    });
  });
}
function yp(e) {
  let t;
  try {
    t = ft.statSync(e);
  } catch {
  }
  if (t && t.isFile()) return;
  const r = Wc.dirname(e);
  try {
    ft.statSync(r).isDirectory() || ft.readdirSync(r);
  } catch (n) {
    if (n && n.code === "ENOENT") Vc.mkdirsSync(r);
    else throw n;
  }
  ft.writeFileSync(e, "");
}
var Ep = {
  createFile: mp(gp),
  createFileSync: yp
};
const vp = Pe.fromCallback, zc = Q, ut = Re, Yc = Ke, wp = kt.pathExists, { areIdentical: Xc } = lr;
function _p(e, t, r) {
  function n(i, o) {
    ut.link(i, o, (s) => {
      if (s) return r(s);
      r(null);
    });
  }
  ut.lstat(t, (i, o) => {
    ut.lstat(e, (s, a) => {
      if (s)
        return s.message = s.message.replace("lstat", "ensureLink"), r(s);
      if (o && Xc(a, o)) return r(null);
      const l = zc.dirname(t);
      wp(l, (f, c) => {
        if (f) return r(f);
        if (c) return n(e, t);
        Yc.mkdirs(l, (u) => {
          if (u) return r(u);
          n(e, t);
        });
      });
    });
  });
}
function Sp(e, t) {
  let r;
  try {
    r = ut.lstatSync(t);
  } catch {
  }
  try {
    const o = ut.lstatSync(e);
    if (r && Xc(o, r)) return;
  } catch (o) {
    throw o.message = o.message.replace("lstat", "ensureLink"), o;
  }
  const n = zc.dirname(t);
  return ut.existsSync(n) || Yc.mkdirsSync(n), ut.linkSync(e, t);
}
var Ap = {
  createLink: vp(_p),
  createLinkSync: Sp
};
const dt = Q, br = Re, bp = kt.pathExists;
function Tp(e, t, r) {
  if (dt.isAbsolute(e))
    return br.lstat(e, (n) => n ? (n.message = n.message.replace("lstat", "ensureSymlink"), r(n)) : r(null, {
      toCwd: e,
      toDst: e
    }));
  {
    const n = dt.dirname(t), i = dt.join(n, e);
    return bp(i, (o, s) => o ? r(o) : s ? r(null, {
      toCwd: i,
      toDst: e
    }) : br.lstat(e, (a) => a ? (a.message = a.message.replace("lstat", "ensureSymlink"), r(a)) : r(null, {
      toCwd: e,
      toDst: dt.relative(n, e)
    })));
  }
}
function Cp(e, t) {
  let r;
  if (dt.isAbsolute(e)) {
    if (r = br.existsSync(e), !r) throw new Error("absolute srcpath does not exist");
    return {
      toCwd: e,
      toDst: e
    };
  } else {
    const n = dt.dirname(t), i = dt.join(n, e);
    if (r = br.existsSync(i), r)
      return {
        toCwd: i,
        toDst: e
      };
    if (r = br.existsSync(e), !r) throw new Error("relative srcpath does not exist");
    return {
      toCwd: e,
      toDst: dt.relative(n, e)
    };
  }
}
var Op = {
  symlinkPaths: Tp,
  symlinkPathsSync: Cp
};
const Jc = Re;
function Pp(e, t, r) {
  if (r = typeof t == "function" ? t : r, t = typeof t == "function" ? !1 : t, t) return r(null, t);
  Jc.lstat(e, (n, i) => {
    if (n) return r(null, "file");
    t = i && i.isDirectory() ? "dir" : "file", r(null, t);
  });
}
function Rp(e, t) {
  let r;
  if (t) return t;
  try {
    r = Jc.lstatSync(e);
  } catch {
    return "file";
  }
  return r && r.isDirectory() ? "dir" : "file";
}
var Ip = {
  symlinkType: Pp,
  symlinkTypeSync: Rp
};
const Dp = Pe.fromCallback, Kc = Q, He = Ut, Qc = Ke, Np = Qc.mkdirs, $p = Qc.mkdirsSync, Zc = Op, Fp = Zc.symlinkPaths, xp = Zc.symlinkPathsSync, eu = Ip, Lp = eu.symlinkType, Up = eu.symlinkTypeSync, kp = kt.pathExists, { areIdentical: tu } = lr;
function Mp(e, t, r, n) {
  n = typeof r == "function" ? r : n, r = typeof r == "function" ? !1 : r, He.lstat(t, (i, o) => {
    !i && o.isSymbolicLink() ? Promise.all([
      He.stat(e),
      He.stat(t)
    ]).then(([s, a]) => {
      if (tu(s, a)) return n(null);
      na(e, t, r, n);
    }) : na(e, t, r, n);
  });
}
function na(e, t, r, n) {
  Fp(e, t, (i, o) => {
    if (i) return n(i);
    e = o.toDst, Lp(o.toCwd, r, (s, a) => {
      if (s) return n(s);
      const l = Kc.dirname(t);
      kp(l, (f, c) => {
        if (f) return n(f);
        if (c) return He.symlink(e, t, a, n);
        Np(l, (u) => {
          if (u) return n(u);
          He.symlink(e, t, a, n);
        });
      });
    });
  });
}
function jp(e, t, r) {
  let n;
  try {
    n = He.lstatSync(t);
  } catch {
  }
  if (n && n.isSymbolicLink()) {
    const a = He.statSync(e), l = He.statSync(t);
    if (tu(a, l)) return;
  }
  const i = xp(e, t);
  e = i.toDst, r = Up(i.toCwd, r);
  const o = Kc.dirname(t);
  return He.existsSync(o) || $p(o), He.symlinkSync(e, t, r);
}
var Bp = {
  createSymlink: Dp(Mp),
  createSymlinkSync: jp
};
const { createFile: ia, createFileSync: oa } = Ep, { createLink: sa, createLinkSync: aa } = Ap, { createSymlink: la, createSymlinkSync: ca } = Bp;
var qp = {
  // file
  createFile: ia,
  createFileSync: oa,
  ensureFile: ia,
  ensureFileSync: oa,
  // link
  createLink: sa,
  createLinkSync: aa,
  ensureLink: sa,
  ensureLinkSync: aa,
  // symlink
  createSymlink: la,
  createSymlinkSync: ca,
  ensureSymlink: la,
  ensureSymlinkSync: ca
};
function Hp(e, { EOL: t = `
`, finalEOL: r = !0, replacer: n = null, spaces: i } = {}) {
  const o = r ? t : "";
  return JSON.stringify(e, n, i).replace(/\n/g, t) + o;
}
function Gp(e) {
  return Buffer.isBuffer(e) && (e = e.toString("utf8")), e.replace(/^\uFEFF/, "");
}
var rs = { stringify: Hp, stripBom: Gp };
let ir;
try {
  ir = Re;
} catch {
  ir = Le;
}
const Qn = Pe, { stringify: ru, stripBom: nu } = rs;
async function Wp(e, t = {}) {
  typeof t == "string" && (t = { encoding: t });
  const r = t.fs || ir, n = "throws" in t ? t.throws : !0;
  let i = await Qn.fromCallback(r.readFile)(e, t);
  i = nu(i);
  let o;
  try {
    o = JSON.parse(i, t ? t.reviver : null);
  } catch (s) {
    if (n)
      throw s.message = `${e}: ${s.message}`, s;
    return null;
  }
  return o;
}
const Vp = Qn.fromPromise(Wp);
function zp(e, t = {}) {
  typeof t == "string" && (t = { encoding: t });
  const r = t.fs || ir, n = "throws" in t ? t.throws : !0;
  try {
    let i = r.readFileSync(e, t);
    return i = nu(i), JSON.parse(i, t.reviver);
  } catch (i) {
    if (n)
      throw i.message = `${e}: ${i.message}`, i;
    return null;
  }
}
async function Yp(e, t, r = {}) {
  const n = r.fs || ir, i = ru(t, r);
  await Qn.fromCallback(n.writeFile)(e, i, r);
}
const Xp = Qn.fromPromise(Yp);
function Jp(e, t, r = {}) {
  const n = r.fs || ir, i = ru(t, r);
  return n.writeFileSync(e, i, r);
}
var Kp = {
  readFile: Vp,
  readFileSync: zp,
  writeFile: Xp,
  writeFileSync: Jp
};
const gn = Kp;
var Qp = {
  // jsonfile exports
  readJson: gn.readFile,
  readJsonSync: gn.readFileSync,
  writeJson: gn.writeFile,
  writeJsonSync: gn.writeFileSync
};
const Zp = Pe.fromCallback, Tr = Re, iu = Q, ou = Ke, em = kt.pathExists;
function tm(e, t, r, n) {
  typeof r == "function" && (n = r, r = "utf8");
  const i = iu.dirname(e);
  em(i, (o, s) => {
    if (o) return n(o);
    if (s) return Tr.writeFile(e, t, r, n);
    ou.mkdirs(i, (a) => {
      if (a) return n(a);
      Tr.writeFile(e, t, r, n);
    });
  });
}
function rm(e, ...t) {
  const r = iu.dirname(e);
  if (Tr.existsSync(r))
    return Tr.writeFileSync(e, ...t);
  ou.mkdirsSync(r), Tr.writeFileSync(e, ...t);
}
var ns = {
  outputFile: Zp(tm),
  outputFileSync: rm
};
const { stringify: nm } = rs, { outputFile: im } = ns;
async function om(e, t, r = {}) {
  const n = nm(t, r);
  await im(e, n, r);
}
var sm = om;
const { stringify: am } = rs, { outputFileSync: lm } = ns;
function cm(e, t, r) {
  const n = am(t, r);
  lm(e, n, r);
}
var um = cm;
const fm = Pe.fromPromise, Oe = Qp;
Oe.outputJson = fm(sm);
Oe.outputJsonSync = um;
Oe.outputJSON = Oe.outputJson;
Oe.outputJSONSync = Oe.outputJsonSync;
Oe.writeJSON = Oe.writeJson;
Oe.writeJSONSync = Oe.writeJsonSync;
Oe.readJSON = Oe.readJson;
Oe.readJSONSync = Oe.readJsonSync;
var dm = Oe;
const hm = Re, No = Q, pm = es.copy, su = Kn.remove, mm = Ke.mkdirp, gm = kt.pathExists, ua = lr;
function ym(e, t, r, n) {
  typeof r == "function" && (n = r, r = {}), r = r || {};
  const i = r.overwrite || r.clobber || !1;
  ua.checkPaths(e, t, "move", r, (o, s) => {
    if (o) return n(o);
    const { srcStat: a, isChangingCase: l = !1 } = s;
    ua.checkParentPaths(e, a, t, "move", (f) => {
      if (f) return n(f);
      if (Em(t)) return fa(e, t, i, l, n);
      mm(No.dirname(t), (c) => c ? n(c) : fa(e, t, i, l, n));
    });
  });
}
function Em(e) {
  const t = No.dirname(e);
  return No.parse(t).root === t;
}
function fa(e, t, r, n, i) {
  if (n) return Pi(e, t, r, i);
  if (r)
    return su(t, (o) => o ? i(o) : Pi(e, t, r, i));
  gm(t, (o, s) => o ? i(o) : s ? i(new Error("dest already exists.")) : Pi(e, t, r, i));
}
function Pi(e, t, r, n) {
  hm.rename(e, t, (i) => i ? i.code !== "EXDEV" ? n(i) : vm(e, t, r, n) : n());
}
function vm(e, t, r, n) {
  pm(e, t, {
    overwrite: r,
    errorOnExist: !0
  }, (o) => o ? n(o) : su(e, n));
}
var wm = ym;
const au = Re, $o = Q, _m = es.copySync, lu = Kn.removeSync, Sm = Ke.mkdirpSync, da = lr;
function Am(e, t, r) {
  r = r || {};
  const n = r.overwrite || r.clobber || !1, { srcStat: i, isChangingCase: o = !1 } = da.checkPathsSync(e, t, "move", r);
  return da.checkParentPathsSync(e, i, t, "move"), bm(t) || Sm($o.dirname(t)), Tm(e, t, n, o);
}
function bm(e) {
  const t = $o.dirname(e);
  return $o.parse(t).root === t;
}
function Tm(e, t, r, n) {
  if (n) return Ri(e, t, r);
  if (r)
    return lu(t), Ri(e, t, r);
  if (au.existsSync(t)) throw new Error("dest already exists.");
  return Ri(e, t, r);
}
function Ri(e, t, r) {
  try {
    au.renameSync(e, t);
  } catch (n) {
    if (n.code !== "EXDEV") throw n;
    return Cm(e, t, r);
  }
}
function Cm(e, t, r) {
  return _m(e, t, {
    overwrite: r,
    errorOnExist: !0
  }), lu(e);
}
var Om = Am;
const Pm = Pe.fromCallback;
var Rm = {
  move: Pm(wm),
  moveSync: Om
}, _t = {
  // Export promiseified graceful-fs:
  ...Ut,
  // Export extra methods:
  ...es,
  ...pp,
  ...qp,
  ...dm,
  ...Ke,
  ...Rm,
  ...ns,
  ...kt,
  ...Kn
}, nt = {}, mt = {}, me = {}, gt = {};
Object.defineProperty(gt, "__esModule", { value: !0 });
gt.CancellationError = gt.CancellationToken = void 0;
const Im = Yn;
class Dm extends Im.EventEmitter {
  get cancelled() {
    return this._cancelled || this._parent != null && this._parent.cancelled;
  }
  set parent(t) {
    this.removeParentCancelHandler(), this._parent = t, this.parentCancelHandler = () => this.cancel(), this._parent.onCancel(this.parentCancelHandler);
  }
  // babel cannot compile ... correctly for super calls
  constructor(t) {
    super(), this.parentCancelHandler = null, this._parent = null, this._cancelled = !1, t != null && (this.parent = t);
  }
  cancel() {
    this._cancelled = !0, this.emit("cancel");
  }
  onCancel(t) {
    this.cancelled ? t() : this.once("cancel", t);
  }
  createPromise(t) {
    if (this.cancelled)
      return Promise.reject(new Fo());
    const r = () => {
      if (n != null)
        try {
          this.removeListener("cancel", n), n = null;
        } catch {
        }
    };
    let n = null;
    return new Promise((i, o) => {
      let s = null;
      if (n = () => {
        try {
          s != null && (s(), s = null);
        } finally {
          o(new Fo());
        }
      }, this.cancelled) {
        n();
        return;
      }
      this.onCancel(n), t(i, o, (a) => {
        s = a;
      });
    }).then((i) => (r(), i)).catch((i) => {
      throw r(), i;
    });
  }
  removeParentCancelHandler() {
    const t = this._parent;
    t != null && this.parentCancelHandler != null && (t.removeListener("cancel", this.parentCancelHandler), this.parentCancelHandler = null);
  }
  dispose() {
    try {
      this.removeParentCancelHandler();
    } finally {
      this.removeAllListeners(), this._parent = null;
    }
  }
}
gt.CancellationToken = Dm;
class Fo extends Error {
  constructor() {
    super("cancelled");
  }
}
gt.CancellationError = Fo;
var cr = {};
Object.defineProperty(cr, "__esModule", { value: !0 });
cr.newError = Nm;
function Nm(e, t) {
  const r = new Error(e);
  return r.code = t, r;
}
var Ce = {}, xo = { exports: {} }, yn = { exports: {} }, Ii, ha;
function $m() {
  if (ha) return Ii;
  ha = 1;
  var e = 1e3, t = e * 60, r = t * 60, n = r * 24, i = n * 7, o = n * 365.25;
  Ii = function(c, u) {
    u = u || {};
    var h = typeof c;
    if (h === "string" && c.length > 0)
      return s(c);
    if (h === "number" && isFinite(c))
      return u.long ? l(c) : a(c);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(c)
    );
  };
  function s(c) {
    if (c = String(c), !(c.length > 100)) {
      var u = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        c
      );
      if (u) {
        var h = parseFloat(u[1]), m = (u[2] || "ms").toLowerCase();
        switch (m) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return h * o;
          case "weeks":
          case "week":
          case "w":
            return h * i;
          case "days":
          case "day":
          case "d":
            return h * n;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return h * r;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return h * t;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return h * e;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return h;
          default:
            return;
        }
      }
    }
  }
  function a(c) {
    var u = Math.abs(c);
    return u >= n ? Math.round(c / n) + "d" : u >= r ? Math.round(c / r) + "h" : u >= t ? Math.round(c / t) + "m" : u >= e ? Math.round(c / e) + "s" : c + "ms";
  }
  function l(c) {
    var u = Math.abs(c);
    return u >= n ? f(c, u, n, "day") : u >= r ? f(c, u, r, "hour") : u >= t ? f(c, u, t, "minute") : u >= e ? f(c, u, e, "second") : c + " ms";
  }
  function f(c, u, h, m) {
    var v = u >= h * 1.5;
    return Math.round(c / h) + " " + m + (v ? "s" : "");
  }
  return Ii;
}
var Di, pa;
function cu() {
  if (pa) return Di;
  pa = 1;
  function e(t) {
    n.debug = n, n.default = n, n.coerce = f, n.disable = a, n.enable = o, n.enabled = l, n.humanize = $m(), n.destroy = c, Object.keys(t).forEach((u) => {
      n[u] = t[u];
    }), n.names = [], n.skips = [], n.formatters = {};
    function r(u) {
      let h = 0;
      for (let m = 0; m < u.length; m++)
        h = (h << 5) - h + u.charCodeAt(m), h |= 0;
      return n.colors[Math.abs(h) % n.colors.length];
    }
    n.selectColor = r;
    function n(u) {
      let h, m = null, v, E;
      function S(...A) {
        if (!S.enabled)
          return;
        const b = S, N = Number(/* @__PURE__ */ new Date()), x = N - (h || N);
        b.diff = x, b.prev = h, b.curr = N, h = N, A[0] = n.coerce(A[0]), typeof A[0] != "string" && A.unshift("%O");
        let B = 0;
        A[0] = A[0].replace(/%([a-zA-Z%])/g, (j, le) => {
          if (j === "%%")
            return "%";
          B++;
          const y = n.formatters[le];
          if (typeof y == "function") {
            const z = A[B];
            j = y.call(b, z), A.splice(B, 1), B--;
          }
          return j;
        }), n.formatArgs.call(b, A), (b.log || n.log).apply(b, A);
      }
      return S.namespace = u, S.useColors = n.useColors(), S.color = n.selectColor(u), S.extend = i, S.destroy = n.destroy, Object.defineProperty(S, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => m !== null ? m : (v !== n.namespaces && (v = n.namespaces, E = n.enabled(u)), E),
        set: (A) => {
          m = A;
        }
      }), typeof n.init == "function" && n.init(S), S;
    }
    function i(u, h) {
      const m = n(this.namespace + (typeof h > "u" ? ":" : h) + u);
      return m.log = this.log, m;
    }
    function o(u) {
      n.save(u), n.namespaces = u, n.names = [], n.skips = [];
      const h = (typeof u == "string" ? u : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const m of h)
        m[0] === "-" ? n.skips.push(m.slice(1)) : n.names.push(m);
    }
    function s(u, h) {
      let m = 0, v = 0, E = -1, S = 0;
      for (; m < u.length; )
        if (v < h.length && (h[v] === u[m] || h[v] === "*"))
          h[v] === "*" ? (E = v, S = m, v++) : (m++, v++);
        else if (E !== -1)
          v = E + 1, S++, m = S;
        else
          return !1;
      for (; v < h.length && h[v] === "*"; )
        v++;
      return v === h.length;
    }
    function a() {
      const u = [
        ...n.names,
        ...n.skips.map((h) => "-" + h)
      ].join(",");
      return n.enable(""), u;
    }
    function l(u) {
      for (const h of n.skips)
        if (s(u, h))
          return !1;
      for (const h of n.names)
        if (s(u, h))
          return !0;
      return !1;
    }
    function f(u) {
      return u instanceof Error ? u.stack || u.message : u;
    }
    function c() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    return n.enable(n.load()), n;
  }
  return Di = e, Di;
}
var ma;
function Fm() {
  return ma || (ma = 1, function(e, t) {
    t.formatArgs = n, t.save = i, t.load = o, t.useColors = r, t.storage = s(), t.destroy = /* @__PURE__ */ (() => {
      let l = !1;
      return () => {
        l || (l = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
      };
    })(), t.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function r() {
      if (typeof window < "u" && window.process && (window.process.type === "renderer" || window.process.__nwjs))
        return !0;
      if (typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))
        return !1;
      let l;
      return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator < "u" && navigator.userAgent && (l = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(l[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function n(l) {
      if (l[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + l[0] + (this.useColors ? "%c " : " ") + "+" + e.exports.humanize(this.diff), !this.useColors)
        return;
      const f = "color: " + this.color;
      l.splice(1, 0, f, "color: inherit");
      let c = 0, u = 0;
      l[0].replace(/%[a-zA-Z%]/g, (h) => {
        h !== "%%" && (c++, h === "%c" && (u = c));
      }), l.splice(u, 0, f);
    }
    t.log = console.debug || console.log || (() => {
    });
    function i(l) {
      try {
        l ? t.storage.setItem("debug", l) : t.storage.removeItem("debug");
      } catch {
      }
    }
    function o() {
      let l;
      try {
        l = t.storage.getItem("debug") || t.storage.getItem("DEBUG");
      } catch {
      }
      return !l && typeof process < "u" && "env" in process && (l = process.env.DEBUG), l;
    }
    function s() {
      try {
        return localStorage;
      } catch {
      }
    }
    e.exports = cu()(t);
    const { formatters: a } = e.exports;
    a.j = function(l) {
      try {
        return JSON.stringify(l);
      } catch (f) {
        return "[UnexpectedJSONParseError]: " + f.message;
      }
    };
  }(yn, yn.exports)), yn.exports;
}
var En = { exports: {} }, Ni, ga;
function xm() {
  return ga || (ga = 1, Ni = (e, t = process.argv) => {
    const r = e.startsWith("-") ? "" : e.length === 1 ? "-" : "--", n = t.indexOf(r + e), i = t.indexOf("--");
    return n !== -1 && (i === -1 || n < i);
  }), Ni;
}
var $i, ya;
function Lm() {
  if (ya) return $i;
  ya = 1;
  const e = wt, t = Ec, r = xm(), { env: n } = process;
  let i;
  r("no-color") || r("no-colors") || r("color=false") || r("color=never") ? i = 0 : (r("color") || r("colors") || r("color=true") || r("color=always")) && (i = 1), "FORCE_COLOR" in n && (n.FORCE_COLOR === "true" ? i = 1 : n.FORCE_COLOR === "false" ? i = 0 : i = n.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(n.FORCE_COLOR, 10), 3));
  function o(l) {
    return l === 0 ? !1 : {
      level: l,
      hasBasic: !0,
      has256: l >= 2,
      has16m: l >= 3
    };
  }
  function s(l, f) {
    if (i === 0)
      return 0;
    if (r("color=16m") || r("color=full") || r("color=truecolor"))
      return 3;
    if (r("color=256"))
      return 2;
    if (l && !f && i === void 0)
      return 0;
    const c = i || 0;
    if (n.TERM === "dumb")
      return c;
    if (process.platform === "win32") {
      const u = e.release().split(".");
      return Number(u[0]) >= 10 && Number(u[2]) >= 10586 ? Number(u[2]) >= 14931 ? 3 : 2 : 1;
    }
    if ("CI" in n)
      return ["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE"].some((u) => u in n) || n.CI_NAME === "codeship" ? 1 : c;
    if ("TEAMCITY_VERSION" in n)
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(n.TEAMCITY_VERSION) ? 1 : 0;
    if (n.COLORTERM === "truecolor")
      return 3;
    if ("TERM_PROGRAM" in n) {
      const u = parseInt((n.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (n.TERM_PROGRAM) {
        case "iTerm.app":
          return u >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    return /-256(color)?$/i.test(n.TERM) ? 2 : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(n.TERM) || "COLORTERM" in n ? 1 : c;
  }
  function a(l) {
    const f = s(l, l && l.isTTY);
    return o(f);
  }
  return $i = {
    supportsColor: a,
    stdout: o(s(!0, t.isatty(1))),
    stderr: o(s(!0, t.isatty(2)))
  }, $i;
}
var Ea;
function Um() {
  return Ea || (Ea = 1, function(e, t) {
    const r = Ec, n = zn;
    t.init = c, t.log = a, t.formatArgs = o, t.save = l, t.load = f, t.useColors = i, t.destroy = n.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    ), t.colors = [6, 2, 3, 4, 5, 1];
    try {
      const h = Lm();
      h && (h.stderr || h).level >= 2 && (t.colors = [
        20,
        21,
        26,
        27,
        32,
        33,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        56,
        57,
        62,
        63,
        68,
        69,
        74,
        75,
        76,
        77,
        78,
        79,
        80,
        81,
        92,
        93,
        98,
        99,
        112,
        113,
        128,
        129,
        134,
        135,
        148,
        149,
        160,
        161,
        162,
        163,
        164,
        165,
        166,
        167,
        168,
        169,
        170,
        171,
        172,
        173,
        178,
        179,
        184,
        185,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        214,
        215,
        220,
        221
      ]);
    } catch {
    }
    t.inspectOpts = Object.keys(process.env).filter((h) => /^debug_/i.test(h)).reduce((h, m) => {
      const v = m.substring(6).toLowerCase().replace(/_([a-z])/g, (S, A) => A.toUpperCase());
      let E = process.env[m];
      return /^(yes|on|true|enabled)$/i.test(E) ? E = !0 : /^(no|off|false|disabled)$/i.test(E) ? E = !1 : E === "null" ? E = null : E = Number(E), h[v] = E, h;
    }, {});
    function i() {
      return "colors" in t.inspectOpts ? !!t.inspectOpts.colors : r.isatty(process.stderr.fd);
    }
    function o(h) {
      const { namespace: m, useColors: v } = this;
      if (v) {
        const E = this.color, S = "\x1B[3" + (E < 8 ? E : "8;5;" + E), A = `  ${S};1m${m} \x1B[0m`;
        h[0] = A + h[0].split(`
`).join(`
` + A), h.push(S + "m+" + e.exports.humanize(this.diff) + "\x1B[0m");
      } else
        h[0] = s() + m + " " + h[0];
    }
    function s() {
      return t.inspectOpts.hideDate ? "" : (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function a(...h) {
      return process.stderr.write(n.formatWithOptions(t.inspectOpts, ...h) + `
`);
    }
    function l(h) {
      h ? process.env.DEBUG = h : delete process.env.DEBUG;
    }
    function f() {
      return process.env.DEBUG;
    }
    function c(h) {
      h.inspectOpts = {};
      const m = Object.keys(t.inspectOpts);
      for (let v = 0; v < m.length; v++)
        h.inspectOpts[m[v]] = t.inspectOpts[m[v]];
    }
    e.exports = cu()(t);
    const { formatters: u } = e.exports;
    u.o = function(h) {
      return this.inspectOpts.colors = this.useColors, n.inspect(h, this.inspectOpts).split(`
`).map((m) => m.trim()).join(" ");
    }, u.O = function(h) {
      return this.inspectOpts.colors = this.useColors, n.inspect(h, this.inspectOpts);
    };
  }(En, En.exports)), En.exports;
}
typeof process > "u" || process.type === "renderer" || process.browser === !0 || process.__nwjs ? xo.exports = Fm() : xo.exports = Um();
var km = xo.exports, Yr = {};
Object.defineProperty(Yr, "__esModule", { value: !0 });
Yr.ProgressCallbackTransform = void 0;
const Mm = Gr;
class jm extends Mm.Transform {
  constructor(t, r, n) {
    super(), this.total = t, this.cancellationToken = r, this.onProgress = n, this.start = Date.now(), this.transferred = 0, this.delta = 0, this.nextUpdate = this.start + 1e3;
  }
  _transform(t, r, n) {
    if (this.cancellationToken.cancelled) {
      n(new Error("cancelled"), null);
      return;
    }
    this.transferred += t.length, this.delta += t.length;
    const i = Date.now();
    i >= this.nextUpdate && this.transferred !== this.total && (this.nextUpdate = i + 1e3, this.onProgress({
      total: this.total,
      delta: this.delta,
      transferred: this.transferred,
      percent: this.transferred / this.total * 100,
      bytesPerSecond: Math.round(this.transferred / ((i - this.start) / 1e3))
    }), this.delta = 0), n(null, t);
  }
  _flush(t) {
    if (this.cancellationToken.cancelled) {
      t(new Error("cancelled"));
      return;
    }
    this.onProgress({
      total: this.total,
      delta: this.delta,
      transferred: this.total,
      percent: 100,
      bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
    }), this.delta = 0, t(null);
  }
}
Yr.ProgressCallbackTransform = jm;
Object.defineProperty(Ce, "__esModule", { value: !0 });
Ce.DigestTransform = Ce.HttpExecutor = Ce.HttpError = void 0;
Ce.createHttpError = Lo;
Ce.parseJson = Ym;
Ce.configureRequestOptionsFromUrl = fu;
Ce.configureRequestUrl = os;
Ce.safeGetHeader = rr;
Ce.configureRequestOptions = Mn;
Ce.safeStringifyJson = jn;
const Bm = Vr, qm = km, Hm = Le, Gm = Gr, uu = ar, Wm = gt, va = cr, Vm = Yr, yr = (0, qm.default)("electron-builder");
function Lo(e, t = null) {
  return new is(e.statusCode || -1, `${e.statusCode} ${e.statusMessage}` + (t == null ? "" : `
` + JSON.stringify(t, null, "  ")) + `
Headers: ` + jn(e.headers), t);
}
const zm = /* @__PURE__ */ new Map([
  [429, "Too many requests"],
  [400, "Bad request"],
  [403, "Forbidden"],
  [404, "Not found"],
  [405, "Method not allowed"],
  [406, "Not acceptable"],
  [408, "Request timeout"],
  [413, "Request entity too large"],
  [500, "Internal server error"],
  [502, "Bad gateway"],
  [503, "Service unavailable"],
  [504, "Gateway timeout"],
  [505, "HTTP version not supported"]
]);
class is extends Error {
  constructor(t, r = `HTTP error: ${zm.get(t) || t}`, n = null) {
    super(r), this.statusCode = t, this.description = n, this.name = "HttpError", this.code = `HTTP_ERROR_${t}`;
  }
  isServerError() {
    return this.statusCode >= 500 && this.statusCode <= 599;
  }
}
Ce.HttpError = is;
function Ym(e) {
  return e.then((t) => t == null || t.length === 0 ? null : JSON.parse(t));
}
class kn {
  constructor() {
    this.maxRedirects = 10;
  }
  request(t, r = new Wm.CancellationToken(), n) {
    Mn(t);
    const i = n == null ? void 0 : JSON.stringify(n), o = i ? Buffer.from(i) : void 0;
    if (o != null) {
      yr(i);
      const { headers: s, ...a } = t;
      t = {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": o.length,
          ...s
        },
        ...a
      };
    }
    return this.doApiRequest(t, r, (s) => s.end(o));
  }
  doApiRequest(t, r, n, i = 0) {
    return yr.enabled && yr(`Request: ${jn(t)}`), r.createPromise((o, s, a) => {
      const l = this.createRequest(t, (f) => {
        try {
          this.handleResponse(f, t, r, o, s, i, n);
        } catch (c) {
          s(c);
        }
      });
      this.addErrorAndTimeoutHandlers(l, s, t.timeout), this.addRedirectHandlers(l, t, s, i, (f) => {
        this.doApiRequest(f, r, n, i).then(o).catch(s);
      }), n(l, s), a(() => l.abort());
    });
  }
  // noinspection JSUnusedLocalSymbols
  // eslint-disable-next-line
  addRedirectHandlers(t, r, n, i, o) {
  }
  addErrorAndTimeoutHandlers(t, r, n = 60 * 1e3) {
    this.addTimeOutHandler(t, r, n), t.on("error", r), t.on("aborted", () => {
      r(new Error("Request has been aborted by the server"));
    });
  }
  handleResponse(t, r, n, i, o, s, a) {
    var l;
    if (yr.enabled && yr(`Response: ${t.statusCode} ${t.statusMessage}, request options: ${jn(r)}`), t.statusCode === 404) {
      o(Lo(t, `method: ${r.method || "GET"} url: ${r.protocol || "https:"}//${r.hostname}${r.port ? `:${r.port}` : ""}${r.path}

Please double check that your authentication token is correct. Due to security reasons, actual status maybe not reported, but 404.
`));
      return;
    } else if (t.statusCode === 204) {
      i();
      return;
    }
    const f = (l = t.statusCode) !== null && l !== void 0 ? l : 0, c = f >= 300 && f < 400, u = rr(t, "location");
    if (c && u != null) {
      if (s > this.maxRedirects) {
        o(this.createMaxRedirectError());
        return;
      }
      this.doApiRequest(kn.prepareRedirectUrlOptions(u, r), n, a, s).then(i).catch(o);
      return;
    }
    t.setEncoding("utf8");
    let h = "";
    t.on("error", o), t.on("data", (m) => h += m), t.on("end", () => {
      try {
        if (t.statusCode != null && t.statusCode >= 400) {
          const m = rr(t, "content-type"), v = m != null && (Array.isArray(m) ? m.find((E) => E.includes("json")) != null : m.includes("json"));
          o(Lo(t, `method: ${r.method || "GET"} url: ${r.protocol || "https:"}//${r.hostname}${r.port ? `:${r.port}` : ""}${r.path}

          Data:
          ${v ? JSON.stringify(JSON.parse(h)) : h}
          `));
        } else
          i(h.length === 0 ? null : h);
      } catch (m) {
        o(m);
      }
    });
  }
  async downloadToBuffer(t, r) {
    return await r.cancellationToken.createPromise((n, i, o) => {
      const s = [], a = {
        headers: r.headers || void 0,
        // because PrivateGitHubProvider requires HttpExecutor.prepareRedirectUrlOptions logic, so, we need to redirect manually
        redirect: "manual"
      };
      os(t, a), Mn(a), this.doDownload(a, {
        destination: null,
        options: r,
        onCancel: o,
        callback: (l) => {
          l == null ? n(Buffer.concat(s)) : i(l);
        },
        responseHandler: (l, f) => {
          let c = 0;
          l.on("data", (u) => {
            if (c += u.length, c > 524288e3) {
              f(new Error("Maximum allowed size is 500 MB"));
              return;
            }
            s.push(u);
          }), l.on("end", () => {
            f(null);
          });
        }
      }, 0);
    });
  }
  doDownload(t, r, n) {
    const i = this.createRequest(t, (o) => {
      if (o.statusCode >= 400) {
        r.callback(new Error(`Cannot download "${t.protocol || "https:"}//${t.hostname}${t.path}", status ${o.statusCode}: ${o.statusMessage}`));
        return;
      }
      o.on("error", r.callback);
      const s = rr(o, "location");
      if (s != null) {
        n < this.maxRedirects ? this.doDownload(kn.prepareRedirectUrlOptions(s, t), r, n++) : r.callback(this.createMaxRedirectError());
        return;
      }
      r.responseHandler == null ? Jm(r, o) : r.responseHandler(o, r.callback);
    });
    this.addErrorAndTimeoutHandlers(i, r.callback, t.timeout), this.addRedirectHandlers(i, t, r.callback, n, (o) => {
      this.doDownload(o, r, n++);
    }), i.end();
  }
  createMaxRedirectError() {
    return new Error(`Too many redirects (> ${this.maxRedirects})`);
  }
  addTimeOutHandler(t, r, n) {
    t.on("socket", (i) => {
      i.setTimeout(n, () => {
        t.abort(), r(new Error("Request timed out"));
      });
    });
  }
  static prepareRedirectUrlOptions(t, r) {
    const n = fu(t, { ...r }), i = n.headers;
    if (i != null && i.authorization) {
      const o = new uu.URL(t);
      (o.hostname.endsWith(".amazonaws.com") || o.searchParams.has("X-Amz-Credential")) && delete i.authorization;
    }
    return n;
  }
  static retryOnServerError(t, r = 3) {
    for (let n = 0; ; n++)
      try {
        return t();
      } catch (i) {
        if (n < r && (i instanceof is && i.isServerError() || i.code === "EPIPE"))
          continue;
        throw i;
      }
  }
}
Ce.HttpExecutor = kn;
function fu(e, t) {
  const r = Mn(t);
  return os(new uu.URL(e), r), r;
}
function os(e, t) {
  t.protocol = e.protocol, t.hostname = e.hostname, e.port ? t.port = e.port : t.port && delete t.port, t.path = e.pathname + e.search;
}
class Uo extends Gm.Transform {
  // noinspection JSUnusedGlobalSymbols
  get actual() {
    return this._actual;
  }
  constructor(t, r = "sha512", n = "base64") {
    super(), this.expected = t, this.algorithm = r, this.encoding = n, this._actual = null, this.isValidateOnEnd = !0, this.digester = (0, Bm.createHash)(r);
  }
  // noinspection JSUnusedGlobalSymbols
  _transform(t, r, n) {
    this.digester.update(t), n(null, t);
  }
  // noinspection JSUnusedGlobalSymbols
  _flush(t) {
    if (this._actual = this.digester.digest(this.encoding), this.isValidateOnEnd)
      try {
        this.validate();
      } catch (r) {
        t(r);
        return;
      }
    t(null);
  }
  validate() {
    if (this._actual == null)
      throw (0, va.newError)("Not finished yet", "ERR_STREAM_NOT_FINISHED");
    if (this._actual !== this.expected)
      throw (0, va.newError)(`${this.algorithm} checksum mismatch, expected ${this.expected}, got ${this._actual}`, "ERR_CHECKSUM_MISMATCH");
    return null;
  }
}
Ce.DigestTransform = Uo;
function Xm(e, t, r) {
  return e != null && t != null && e !== t ? (r(new Error(`checksum mismatch: expected ${t} but got ${e} (X-Checksum-Sha2 header)`)), !1) : !0;
}
function rr(e, t) {
  const r = e.headers[t];
  return r == null ? null : Array.isArray(r) ? r.length === 0 ? null : r[r.length - 1] : r;
}
function Jm(e, t) {
  if (!Xm(rr(t, "X-Checksum-Sha2"), e.options.sha2, e.callback))
    return;
  const r = [];
  if (e.options.onProgress != null) {
    const s = rr(t, "content-length");
    s != null && r.push(new Vm.ProgressCallbackTransform(parseInt(s, 10), e.options.cancellationToken, e.options.onProgress));
  }
  const n = e.options.sha512;
  n != null ? r.push(new Uo(n, "sha512", n.length === 128 && !n.includes("+") && !n.includes("Z") && !n.includes("=") ? "hex" : "base64")) : e.options.sha2 != null && r.push(new Uo(e.options.sha2, "sha256", "hex"));
  const i = (0, Hm.createWriteStream)(e.destination);
  r.push(i);
  let o = t;
  for (const s of r)
    s.on("error", (a) => {
      i.close(), e.options.cancellationToken.cancelled || e.callback(a);
    }), o = o.pipe(s);
  i.on("finish", () => {
    i.close(e.callback);
  });
}
function Mn(e, t, r) {
  r != null && (e.method = r), e.headers = { ...e.headers };
  const n = e.headers;
  return t != null && (n.authorization = t.startsWith("Basic") || t.startsWith("Bearer") ? t : `token ${t}`), n["User-Agent"] == null && (n["User-Agent"] = "electron-builder"), (r == null || r === "GET" || n["Cache-Control"] == null) && (n["Cache-Control"] = "no-cache"), e.protocol == null && process.versions.electron != null && (e.protocol = "https:"), e;
}
function jn(e, t) {
  return JSON.stringify(e, (r, n) => r.endsWith("Authorization") || r.endsWith("authorization") || r.endsWith("Password") || r.endsWith("PASSWORD") || r.endsWith("Token") || r.includes("password") || r.includes("token") || t != null && t.has(r) ? "<stripped sensitive data>" : n, 2);
}
var Zn = {};
Object.defineProperty(Zn, "__esModule", { value: !0 });
Zn.MemoLazy = void 0;
class Km {
  constructor(t, r) {
    this.selector = t, this.creator = r, this.selected = void 0, this._value = void 0;
  }
  get hasValue() {
    return this._value !== void 0;
  }
  get value() {
    const t = this.selector();
    if (this._value !== void 0 && du(this.selected, t))
      return this._value;
    this.selected = t;
    const r = this.creator(t);
    return this.value = r, r;
  }
  set value(t) {
    this._value = t;
  }
}
Zn.MemoLazy = Km;
function du(e, t) {
  if (typeof e == "object" && e !== null && (typeof t == "object" && t !== null)) {
    const i = Object.keys(e), o = Object.keys(t);
    return i.length === o.length && i.every((s) => du(e[s], t[s]));
  }
  return e === t;
}
var ei = {};
Object.defineProperty(ei, "__esModule", { value: !0 });
ei.githubUrl = Qm;
ei.getS3LikeProviderBaseUrl = Zm;
function Qm(e, t = "github.com") {
  return `${e.protocol || "https"}://${e.host || t}`;
}
function Zm(e) {
  const t = e.provider;
  if (t === "s3")
    return eg(e);
  if (t === "spaces")
    return tg(e);
  throw new Error(`Not supported provider: ${t}`);
}
function eg(e) {
  let t;
  if (e.accelerate == !0)
    t = `https://${e.bucket}.s3-accelerate.amazonaws.com`;
  else if (e.endpoint != null)
    t = `${e.endpoint}/${e.bucket}`;
  else if (e.bucket.includes(".")) {
    if (e.region == null)
      throw new Error(`Bucket name "${e.bucket}" includes a dot, but S3 region is missing`);
    e.region === "us-east-1" ? t = `https://s3.amazonaws.com/${e.bucket}` : t = `https://s3-${e.region}.amazonaws.com/${e.bucket}`;
  } else e.region === "cn-north-1" ? t = `https://${e.bucket}.s3.${e.region}.amazonaws.com.cn` : t = `https://${e.bucket}.s3.amazonaws.com`;
  return hu(t, e.path);
}
function hu(e, t) {
  return t != null && t.length > 0 && (t.startsWith("/") || (e += "/"), e += t), e;
}
function tg(e) {
  if (e.name == null)
    throw new Error("name is missing");
  if (e.region == null)
    throw new Error("region is missing");
  return hu(`https://${e.name}.${e.region}.digitaloceanspaces.com`, e.path);
}
var ss = {};
Object.defineProperty(ss, "__esModule", { value: !0 });
ss.retry = pu;
const rg = gt;
async function pu(e, t, r, n = 0, i = 0, o) {
  var s;
  const a = new rg.CancellationToken();
  try {
    return await e();
  } catch (l) {
    if ((!((s = o == null ? void 0 : o(l)) !== null && s !== void 0) || s) && t > 0 && !a.cancelled)
      return await new Promise((f) => setTimeout(f, r + n * i)), await pu(e, t - 1, r, n, i + 1, o);
    throw l;
  }
}
var as = {};
Object.defineProperty(as, "__esModule", { value: !0 });
as.parseDn = ng;
function ng(e) {
  let t = !1, r = null, n = "", i = 0;
  e = e.trim();
  const o = /* @__PURE__ */ new Map();
  for (let s = 0; s <= e.length; s++) {
    if (s === e.length) {
      r !== null && o.set(r, n);
      break;
    }
    const a = e[s];
    if (t) {
      if (a === '"') {
        t = !1;
        continue;
      }
    } else {
      if (a === '"') {
        t = !0;
        continue;
      }
      if (a === "\\") {
        s++;
        const l = parseInt(e.slice(s, s + 2), 16);
        Number.isNaN(l) ? n += e[s] : (s++, n += String.fromCharCode(l));
        continue;
      }
      if (r === null && a === "=") {
        r = n, n = "";
        continue;
      }
      if (a === "," || a === ";" || a === "+") {
        r !== null && o.set(r, n), r = null, n = "";
        continue;
      }
    }
    if (a === " " && !t) {
      if (n.length === 0)
        continue;
      if (s > i) {
        let l = s;
        for (; e[l] === " "; )
          l++;
        i = l;
      }
      if (i >= e.length || e[i] === "," || e[i] === ";" || r === null && e[i] === "=" || r !== null && e[i] === "+") {
        s = i - 1;
        continue;
      }
    }
    n += a;
  }
  return o;
}
var or = {};
Object.defineProperty(or, "__esModule", { value: !0 });
or.nil = or.UUID = void 0;
const mu = Vr, gu = cr, ig = "options.name must be either a string or a Buffer", wa = (0, mu.randomBytes)(16);
wa[0] = wa[0] | 1;
const $n = {}, J = [];
for (let e = 0; e < 256; e++) {
  const t = (e + 256).toString(16).substr(1);
  $n[t] = e, J[e] = t;
}
class Lt {
  constructor(t) {
    this.ascii = null, this.binary = null;
    const r = Lt.check(t);
    if (!r)
      throw new Error("not a UUID");
    this.version = r.version, r.format === "ascii" ? this.ascii = t : this.binary = t;
  }
  static v5(t, r) {
    return og(t, "sha1", 80, r);
  }
  toString() {
    return this.ascii == null && (this.ascii = sg(this.binary)), this.ascii;
  }
  inspect() {
    return `UUID v${this.version} ${this.toString()}`;
  }
  static check(t, r = 0) {
    if (typeof t == "string")
      return t = t.toLowerCase(), /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-([a-f0-9]{12})$/.test(t) ? t === "00000000-0000-0000-0000-000000000000" ? { version: void 0, variant: "nil", format: "ascii" } : {
        version: ($n[t[14] + t[15]] & 240) >> 4,
        variant: _a(($n[t[19] + t[20]] & 224) >> 5),
        format: "ascii"
      } : !1;
    if (Buffer.isBuffer(t)) {
      if (t.length < r + 16)
        return !1;
      let n = 0;
      for (; n < 16 && t[r + n] === 0; n++)
        ;
      return n === 16 ? { version: void 0, variant: "nil", format: "binary" } : {
        version: (t[r + 6] & 240) >> 4,
        variant: _a((t[r + 8] & 224) >> 5),
        format: "binary"
      };
    }
    throw (0, gu.newError)("Unknown type of uuid", "ERR_UNKNOWN_UUID_TYPE");
  }
  // read stringified uuid into a Buffer
  static parse(t) {
    const r = Buffer.allocUnsafe(16);
    let n = 0;
    for (let i = 0; i < 16; i++)
      r[i] = $n[t[n++] + t[n++]], (i === 3 || i === 5 || i === 7 || i === 9) && (n += 1);
    return r;
  }
}
or.UUID = Lt;
Lt.OID = Lt.parse("6ba7b812-9dad-11d1-80b4-00c04fd430c8");
function _a(e) {
  switch (e) {
    case 0:
    case 1:
    case 3:
      return "ncs";
    case 4:
    case 5:
      return "rfc4122";
    case 6:
      return "microsoft";
    default:
      return "future";
  }
}
var Cr;
(function(e) {
  e[e.ASCII = 0] = "ASCII", e[e.BINARY = 1] = "BINARY", e[e.OBJECT = 2] = "OBJECT";
})(Cr || (Cr = {}));
function og(e, t, r, n, i = Cr.ASCII) {
  const o = (0, mu.createHash)(t);
  if (typeof e != "string" && !Buffer.isBuffer(e))
    throw (0, gu.newError)(ig, "ERR_INVALID_UUID_NAME");
  o.update(n), o.update(e);
  const a = o.digest();
  let l;
  switch (i) {
    case Cr.BINARY:
      a[6] = a[6] & 15 | r, a[8] = a[8] & 63 | 128, l = a;
      break;
    case Cr.OBJECT:
      a[6] = a[6] & 15 | r, a[8] = a[8] & 63 | 128, l = new Lt(a);
      break;
    default:
      l = J[a[0]] + J[a[1]] + J[a[2]] + J[a[3]] + "-" + J[a[4]] + J[a[5]] + "-" + J[a[6] & 15 | r] + J[a[7]] + "-" + J[a[8] & 63 | 128] + J[a[9]] + "-" + J[a[10]] + J[a[11]] + J[a[12]] + J[a[13]] + J[a[14]] + J[a[15]];
      break;
  }
  return l;
}
function sg(e) {
  return J[e[0]] + J[e[1]] + J[e[2]] + J[e[3]] + "-" + J[e[4]] + J[e[5]] + "-" + J[e[6]] + J[e[7]] + "-" + J[e[8]] + J[e[9]] + "-" + J[e[10]] + J[e[11]] + J[e[12]] + J[e[13]] + J[e[14]] + J[e[15]];
}
or.nil = new Lt("00000000-0000-0000-0000-000000000000");
var Xr = {}, yu = {};
(function(e) {
  (function(t) {
    t.parser = function(p, d) {
      return new n(p, d);
    }, t.SAXParser = n, t.SAXStream = c, t.createStream = f, t.MAX_BUFFER_LENGTH = 64 * 1024;
    var r = [
      "comment",
      "sgmlDecl",
      "textNode",
      "tagName",
      "doctype",
      "procInstName",
      "procInstBody",
      "entity",
      "attribName",
      "attribValue",
      "cdata",
      "script"
    ];
    t.EVENTS = [
      "text",
      "processinginstruction",
      "sgmldeclaration",
      "doctype",
      "comment",
      "opentagstart",
      "attribute",
      "opentag",
      "closetag",
      "opencdata",
      "cdata",
      "closecdata",
      "error",
      "end",
      "ready",
      "script",
      "opennamespace",
      "closenamespace"
    ];
    function n(p, d) {
      if (!(this instanceof n))
        return new n(p, d);
      var T = this;
      o(T), T.q = T.c = "", T.bufferCheckPosition = t.MAX_BUFFER_LENGTH, T.opt = d || {}, T.opt.lowercase = T.opt.lowercase || T.opt.lowercasetags, T.looseCase = T.opt.lowercase ? "toLowerCase" : "toUpperCase", T.tags = [], T.closed = T.closedRoot = T.sawRoot = !1, T.tag = T.error = null, T.strict = !!p, T.noscript = !!(p || T.opt.noscript), T.state = y.BEGIN, T.strictEntities = T.opt.strictEntities, T.ENTITIES = T.strictEntities ? Object.create(t.XML_ENTITIES) : Object.create(t.ENTITIES), T.attribList = [], T.opt.xmlns && (T.ns = Object.create(E)), T.opt.unquotedAttributeValues === void 0 && (T.opt.unquotedAttributeValues = !p), T.trackPosition = T.opt.position !== !1, T.trackPosition && (T.position = T.line = T.column = 0), H(T, "onready");
    }
    Object.create || (Object.create = function(p) {
      function d() {
      }
      d.prototype = p;
      var T = new d();
      return T;
    }), Object.keys || (Object.keys = function(p) {
      var d = [];
      for (var T in p) p.hasOwnProperty(T) && d.push(T);
      return d;
    });
    function i(p) {
      for (var d = Math.max(t.MAX_BUFFER_LENGTH, 10), T = 0, _ = 0, K = r.length; _ < K; _++) {
        var re = p[r[_]].length;
        if (re > d)
          switch (r[_]) {
            case "textNode":
              Z(p);
              break;
            case "cdata":
              M(p, "oncdata", p.cdata), p.cdata = "";
              break;
            case "script":
              M(p, "onscript", p.script), p.script = "";
              break;
            default:
              O(p, "Max buffer length exceeded: " + r[_]);
          }
        T = Math.max(T, re);
      }
      var se = t.MAX_BUFFER_LENGTH - T;
      p.bufferCheckPosition = se + p.position;
    }
    function o(p) {
      for (var d = 0, T = r.length; d < T; d++)
        p[r[d]] = "";
    }
    function s(p) {
      Z(p), p.cdata !== "" && (M(p, "oncdata", p.cdata), p.cdata = ""), p.script !== "" && (M(p, "onscript", p.script), p.script = "");
    }
    n.prototype = {
      end: function() {
        D(this);
      },
      write: ze,
      resume: function() {
        return this.error = null, this;
      },
      close: function() {
        return this.write(null);
      },
      flush: function() {
        s(this);
      }
    };
    var a;
    try {
      a = require("stream").Stream;
    } catch {
      a = function() {
      };
    }
    a || (a = function() {
    });
    var l = t.EVENTS.filter(function(p) {
      return p !== "error" && p !== "end";
    });
    function f(p, d) {
      return new c(p, d);
    }
    function c(p, d) {
      if (!(this instanceof c))
        return new c(p, d);
      a.apply(this), this._parser = new n(p, d), this.writable = !0, this.readable = !0;
      var T = this;
      this._parser.onend = function() {
        T.emit("end");
      }, this._parser.onerror = function(_) {
        T.emit("error", _), T._parser.error = null;
      }, this._decoder = null, l.forEach(function(_) {
        Object.defineProperty(T, "on" + _, {
          get: function() {
            return T._parser["on" + _];
          },
          set: function(K) {
            if (!K)
              return T.removeAllListeners(_), T._parser["on" + _] = K, K;
            T.on(_, K);
          },
          enumerable: !0,
          configurable: !1
        });
      });
    }
    c.prototype = Object.create(a.prototype, {
      constructor: {
        value: c
      }
    }), c.prototype.write = function(p) {
      if (typeof Buffer == "function" && typeof Buffer.isBuffer == "function" && Buffer.isBuffer(p)) {
        if (!this._decoder) {
          var d = Kd.StringDecoder;
          this._decoder = new d("utf8");
        }
        p = this._decoder.write(p);
      }
      return this._parser.write(p.toString()), this.emit("data", p), !0;
    }, c.prototype.end = function(p) {
      return p && p.length && this.write(p), this._parser.end(), !0;
    }, c.prototype.on = function(p, d) {
      var T = this;
      return !T._parser["on" + p] && l.indexOf(p) !== -1 && (T._parser["on" + p] = function() {
        var _ = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
        _.splice(0, 0, p), T.emit.apply(T, _);
      }), a.prototype.on.call(T, p, d);
    };
    var u = "[CDATA[", h = "DOCTYPE", m = "http://www.w3.org/XML/1998/namespace", v = "http://www.w3.org/2000/xmlns/", E = { xml: m, xmlns: v }, S = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, A = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/, b = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, N = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
    function x(p) {
      return p === " " || p === `
` || p === "\r" || p === "	";
    }
    function B(p) {
      return p === '"' || p === "'";
    }
    function q(p) {
      return p === ">" || x(p);
    }
    function j(p, d) {
      return p.test(d);
    }
    function le(p, d) {
      return !j(p, d);
    }
    var y = 0;
    t.STATE = {
      BEGIN: y++,
      // leading byte order mark or whitespace
      BEGIN_WHITESPACE: y++,
      // leading whitespace
      TEXT: y++,
      // general stuff
      TEXT_ENTITY: y++,
      // &amp and such.
      OPEN_WAKA: y++,
      // <
      SGML_DECL: y++,
      // <!BLARG
      SGML_DECL_QUOTED: y++,
      // <!BLARG foo "bar
      DOCTYPE: y++,
      // <!DOCTYPE
      DOCTYPE_QUOTED: y++,
      // <!DOCTYPE "//blah
      DOCTYPE_DTD: y++,
      // <!DOCTYPE "//blah" [ ...
      DOCTYPE_DTD_QUOTED: y++,
      // <!DOCTYPE "//blah" [ "foo
      COMMENT_STARTING: y++,
      // <!-
      COMMENT: y++,
      // <!--
      COMMENT_ENDING: y++,
      // <!-- blah -
      COMMENT_ENDED: y++,
      // <!-- blah --
      CDATA: y++,
      // <![CDATA[ something
      CDATA_ENDING: y++,
      // ]
      CDATA_ENDING_2: y++,
      // ]]
      PROC_INST: y++,
      // <?hi
      PROC_INST_BODY: y++,
      // <?hi there
      PROC_INST_ENDING: y++,
      // <?hi "there" ?
      OPEN_TAG: y++,
      // <strong
      OPEN_TAG_SLASH: y++,
      // <strong /
      ATTRIB: y++,
      // <a
      ATTRIB_NAME: y++,
      // <a foo
      ATTRIB_NAME_SAW_WHITE: y++,
      // <a foo _
      ATTRIB_VALUE: y++,
      // <a foo=
      ATTRIB_VALUE_QUOTED: y++,
      // <a foo="bar
      ATTRIB_VALUE_CLOSED: y++,
      // <a foo="bar"
      ATTRIB_VALUE_UNQUOTED: y++,
      // <a foo=bar
      ATTRIB_VALUE_ENTITY_Q: y++,
      // <foo bar="&quot;"
      ATTRIB_VALUE_ENTITY_U: y++,
      // <foo bar=&quot
      CLOSE_TAG: y++,
      // </a
      CLOSE_TAG_SAW_WHITE: y++,
      // </a   >
      SCRIPT: y++,
      // <script> ...
      SCRIPT_ENDING: y++
      // <script> ... <
    }, t.XML_ENTITIES = {
      amp: "&",
      gt: ">",
      lt: "<",
      quot: '"',
      apos: "'"
    }, t.ENTITIES = {
      amp: "&",
      gt: ">",
      lt: "<",
      quot: '"',
      apos: "'",
      AElig: 198,
      Aacute: 193,
      Acirc: 194,
      Agrave: 192,
      Aring: 197,
      Atilde: 195,
      Auml: 196,
      Ccedil: 199,
      ETH: 208,
      Eacute: 201,
      Ecirc: 202,
      Egrave: 200,
      Euml: 203,
      Iacute: 205,
      Icirc: 206,
      Igrave: 204,
      Iuml: 207,
      Ntilde: 209,
      Oacute: 211,
      Ocirc: 212,
      Ograve: 210,
      Oslash: 216,
      Otilde: 213,
      Ouml: 214,
      THORN: 222,
      Uacute: 218,
      Ucirc: 219,
      Ugrave: 217,
      Uuml: 220,
      Yacute: 221,
      aacute: 225,
      acirc: 226,
      aelig: 230,
      agrave: 224,
      aring: 229,
      atilde: 227,
      auml: 228,
      ccedil: 231,
      eacute: 233,
      ecirc: 234,
      egrave: 232,
      eth: 240,
      euml: 235,
      iacute: 237,
      icirc: 238,
      igrave: 236,
      iuml: 239,
      ntilde: 241,
      oacute: 243,
      ocirc: 244,
      ograve: 242,
      oslash: 248,
      otilde: 245,
      ouml: 246,
      szlig: 223,
      thorn: 254,
      uacute: 250,
      ucirc: 251,
      ugrave: 249,
      uuml: 252,
      yacute: 253,
      yuml: 255,
      copy: 169,
      reg: 174,
      nbsp: 160,
      iexcl: 161,
      cent: 162,
      pound: 163,
      curren: 164,
      yen: 165,
      brvbar: 166,
      sect: 167,
      uml: 168,
      ordf: 170,
      laquo: 171,
      not: 172,
      shy: 173,
      macr: 175,
      deg: 176,
      plusmn: 177,
      sup1: 185,
      sup2: 178,
      sup3: 179,
      acute: 180,
      micro: 181,
      para: 182,
      middot: 183,
      cedil: 184,
      ordm: 186,
      raquo: 187,
      frac14: 188,
      frac12: 189,
      frac34: 190,
      iquest: 191,
      times: 215,
      divide: 247,
      OElig: 338,
      oelig: 339,
      Scaron: 352,
      scaron: 353,
      Yuml: 376,
      fnof: 402,
      circ: 710,
      tilde: 732,
      Alpha: 913,
      Beta: 914,
      Gamma: 915,
      Delta: 916,
      Epsilon: 917,
      Zeta: 918,
      Eta: 919,
      Theta: 920,
      Iota: 921,
      Kappa: 922,
      Lambda: 923,
      Mu: 924,
      Nu: 925,
      Xi: 926,
      Omicron: 927,
      Pi: 928,
      Rho: 929,
      Sigma: 931,
      Tau: 932,
      Upsilon: 933,
      Phi: 934,
      Chi: 935,
      Psi: 936,
      Omega: 937,
      alpha: 945,
      beta: 946,
      gamma: 947,
      delta: 948,
      epsilon: 949,
      zeta: 950,
      eta: 951,
      theta: 952,
      iota: 953,
      kappa: 954,
      lambda: 955,
      mu: 956,
      nu: 957,
      xi: 958,
      omicron: 959,
      pi: 960,
      rho: 961,
      sigmaf: 962,
      sigma: 963,
      tau: 964,
      upsilon: 965,
      phi: 966,
      chi: 967,
      psi: 968,
      omega: 969,
      thetasym: 977,
      upsih: 978,
      piv: 982,
      ensp: 8194,
      emsp: 8195,
      thinsp: 8201,
      zwnj: 8204,
      zwj: 8205,
      lrm: 8206,
      rlm: 8207,
      ndash: 8211,
      mdash: 8212,
      lsquo: 8216,
      rsquo: 8217,
      sbquo: 8218,
      ldquo: 8220,
      rdquo: 8221,
      bdquo: 8222,
      dagger: 8224,
      Dagger: 8225,
      bull: 8226,
      hellip: 8230,
      permil: 8240,
      prime: 8242,
      Prime: 8243,
      lsaquo: 8249,
      rsaquo: 8250,
      oline: 8254,
      frasl: 8260,
      euro: 8364,
      image: 8465,
      weierp: 8472,
      real: 8476,
      trade: 8482,
      alefsym: 8501,
      larr: 8592,
      uarr: 8593,
      rarr: 8594,
      darr: 8595,
      harr: 8596,
      crarr: 8629,
      lArr: 8656,
      uArr: 8657,
      rArr: 8658,
      dArr: 8659,
      hArr: 8660,
      forall: 8704,
      part: 8706,
      exist: 8707,
      empty: 8709,
      nabla: 8711,
      isin: 8712,
      notin: 8713,
      ni: 8715,
      prod: 8719,
      sum: 8721,
      minus: 8722,
      lowast: 8727,
      radic: 8730,
      prop: 8733,
      infin: 8734,
      ang: 8736,
      and: 8743,
      or: 8744,
      cap: 8745,
      cup: 8746,
      int: 8747,
      there4: 8756,
      sim: 8764,
      cong: 8773,
      asymp: 8776,
      ne: 8800,
      equiv: 8801,
      le: 8804,
      ge: 8805,
      sub: 8834,
      sup: 8835,
      nsub: 8836,
      sube: 8838,
      supe: 8839,
      oplus: 8853,
      otimes: 8855,
      perp: 8869,
      sdot: 8901,
      lceil: 8968,
      rceil: 8969,
      lfloor: 8970,
      rfloor: 8971,
      lang: 9001,
      rang: 9002,
      loz: 9674,
      spades: 9824,
      clubs: 9827,
      hearts: 9829,
      diams: 9830
    }, Object.keys(t.ENTITIES).forEach(function(p) {
      var d = t.ENTITIES[p], T = typeof d == "number" ? String.fromCharCode(d) : d;
      t.ENTITIES[p] = T;
    });
    for (var z in t.STATE)
      t.STATE[t.STATE[z]] = z;
    y = t.STATE;
    function H(p, d, T) {
      p[d] && p[d](T);
    }
    function M(p, d, T) {
      p.textNode && Z(p), H(p, d, T);
    }
    function Z(p) {
      p.textNode = R(p.opt, p.textNode), p.textNode && H(p, "ontext", p.textNode), p.textNode = "";
    }
    function R(p, d) {
      return p.trim && (d = d.trim()), p.normalize && (d = d.replace(/\s+/g, " ")), d;
    }
    function O(p, d) {
      return Z(p), p.trackPosition && (d += `
Line: ` + p.line + `
Column: ` + p.column + `
Char: ` + p.c), d = new Error(d), p.error = d, H(p, "onerror", d), p;
    }
    function D(p) {
      return p.sawRoot && !p.closedRoot && C(p, "Unclosed root tag"), p.state !== y.BEGIN && p.state !== y.BEGIN_WHITESPACE && p.state !== y.TEXT && O(p, "Unexpected end"), Z(p), p.c = "", p.closed = !0, H(p, "onend"), n.call(p, p.strict, p.opt), p;
    }
    function C(p, d) {
      if (typeof p != "object" || !(p instanceof n))
        throw new Error("bad call to strictFail");
      p.strict && O(p, d);
    }
    function $(p) {
      p.strict || (p.tagName = p.tagName[p.looseCase]());
      var d = p.tags[p.tags.length - 1] || p, T = p.tag = { name: p.tagName, attributes: {} };
      p.opt.xmlns && (T.ns = d.ns), p.attribList.length = 0, M(p, "onopentagstart", T);
    }
    function I(p, d) {
      var T = p.indexOf(":"), _ = T < 0 ? ["", p] : p.split(":"), K = _[0], re = _[1];
      return d && p === "xmlns" && (K = "xmlns", re = ""), { prefix: K, local: re };
    }
    function k(p) {
      if (p.strict || (p.attribName = p.attribName[p.looseCase]()), p.attribList.indexOf(p.attribName) !== -1 || p.tag.attributes.hasOwnProperty(p.attribName)) {
        p.attribName = p.attribValue = "";
        return;
      }
      if (p.opt.xmlns) {
        var d = I(p.attribName, !0), T = d.prefix, _ = d.local;
        if (T === "xmlns")
          if (_ === "xml" && p.attribValue !== m)
            C(
              p,
              "xml: prefix must be bound to " + m + `
Actual: ` + p.attribValue
            );
          else if (_ === "xmlns" && p.attribValue !== v)
            C(
              p,
              "xmlns: prefix must be bound to " + v + `
Actual: ` + p.attribValue
            );
          else {
            var K = p.tag, re = p.tags[p.tags.length - 1] || p;
            K.ns === re.ns && (K.ns = Object.create(re.ns)), K.ns[_] = p.attribValue;
          }
        p.attribList.push([p.attribName, p.attribValue]);
      } else
        p.tag.attributes[p.attribName] = p.attribValue, M(p, "onattribute", {
          name: p.attribName,
          value: p.attribValue
        });
      p.attribName = p.attribValue = "";
    }
    function Y(p, d) {
      if (p.opt.xmlns) {
        var T = p.tag, _ = I(p.tagName);
        T.prefix = _.prefix, T.local = _.local, T.uri = T.ns[_.prefix] || "", T.prefix && !T.uri && (C(
          p,
          "Unbound namespace prefix: " + JSON.stringify(p.tagName)
        ), T.uri = _.prefix);
        var K = p.tags[p.tags.length - 1] || p;
        T.ns && K.ns !== T.ns && Object.keys(T.ns).forEach(function(on) {
          M(p, "onopennamespace", {
            prefix: on,
            uri: T.ns[on]
          });
        });
        for (var re = 0, se = p.attribList.length; re < se; re++) {
          var ge = p.attribList[re], we = ge[0], it = ge[1], ue = I(we, !0), Be = ue.prefix, Ei = ue.local, nn = Be === "" ? "" : T.ns[Be] || "", dr = {
            name: we,
            value: it,
            prefix: Be,
            local: Ei,
            uri: nn
          };
          Be && Be !== "xmlns" && !nn && (C(
            p,
            "Unbound namespace prefix: " + JSON.stringify(Be)
          ), dr.uri = Be), p.tag.attributes[we] = dr, M(p, "onattribute", dr);
        }
        p.attribList.length = 0;
      }
      p.tag.isSelfClosing = !!d, p.sawRoot = !0, p.tags.push(p.tag), M(p, "onopentag", p.tag), d || (!p.noscript && p.tagName.toLowerCase() === "script" ? p.state = y.SCRIPT : p.state = y.TEXT, p.tag = null, p.tagName = ""), p.attribName = p.attribValue = "", p.attribList.length = 0;
    }
    function G(p) {
      if (!p.tagName) {
        C(p, "Weird empty close tag."), p.textNode += "</>", p.state = y.TEXT;
        return;
      }
      if (p.script) {
        if (p.tagName !== "script") {
          p.script += "</" + p.tagName + ">", p.tagName = "", p.state = y.SCRIPT;
          return;
        }
        M(p, "onscript", p.script), p.script = "";
      }
      var d = p.tags.length, T = p.tagName;
      p.strict || (T = T[p.looseCase]());
      for (var _ = T; d--; ) {
        var K = p.tags[d];
        if (K.name !== _)
          C(p, "Unexpected close tag");
        else
          break;
      }
      if (d < 0) {
        C(p, "Unmatched closing tag: " + p.tagName), p.textNode += "</" + p.tagName + ">", p.state = y.TEXT;
        return;
      }
      p.tagName = T;
      for (var re = p.tags.length; re-- > d; ) {
        var se = p.tag = p.tags.pop();
        p.tagName = p.tag.name, M(p, "onclosetag", p.tagName);
        var ge = {};
        for (var we in se.ns)
          ge[we] = se.ns[we];
        var it = p.tags[p.tags.length - 1] || p;
        p.opt.xmlns && se.ns !== it.ns && Object.keys(se.ns).forEach(function(ue) {
          var Be = se.ns[ue];
          M(p, "onclosenamespace", { prefix: ue, uri: Be });
        });
      }
      d === 0 && (p.closedRoot = !0), p.tagName = p.attribValue = p.attribName = "", p.attribList.length = 0, p.state = y.TEXT;
    }
    function ee(p) {
      var d = p.entity, T = d.toLowerCase(), _, K = "";
      return p.ENTITIES[d] ? p.ENTITIES[d] : p.ENTITIES[T] ? p.ENTITIES[T] : (d = T, d.charAt(0) === "#" && (d.charAt(1) === "x" ? (d = d.slice(2), _ = parseInt(d, 16), K = _.toString(16)) : (d = d.slice(1), _ = parseInt(d, 10), K = _.toString(10))), d = d.replace(/^0+/, ""), isNaN(_) || K.toLowerCase() !== d || _ < 0 || _ > 1114111 ? (C(p, "Invalid character entity"), "&" + p.entity + ";") : String.fromCodePoint(_));
    }
    function de(p, d) {
      d === "<" ? (p.state = y.OPEN_WAKA, p.startTagPosition = p.position) : x(d) || (C(p, "Non-whitespace before first tag."), p.textNode = d, p.state = y.TEXT);
    }
    function U(p, d) {
      var T = "";
      return d < p.length && (T = p.charAt(d)), T;
    }
    function ze(p) {
      var d = this;
      if (this.error)
        throw this.error;
      if (d.closed)
        return O(
          d,
          "Cannot write after close. Assign an onready handler."
        );
      if (p === null)
        return D(d);
      typeof p == "object" && (p = p.toString());
      for (var T = 0, _ = ""; _ = U(p, T++), d.c = _, !!_; )
        switch (d.trackPosition && (d.position++, _ === `
` ? (d.line++, d.column = 0) : d.column++), d.state) {
          case y.BEGIN:
            if (d.state = y.BEGIN_WHITESPACE, _ === "\uFEFF")
              continue;
            de(d, _);
            continue;
          case y.BEGIN_WHITESPACE:
            de(d, _);
            continue;
          case y.TEXT:
            if (d.sawRoot && !d.closedRoot) {
              for (var re = T - 1; _ && _ !== "<" && _ !== "&"; )
                _ = U(p, T++), _ && d.trackPosition && (d.position++, _ === `
` ? (d.line++, d.column = 0) : d.column++);
              d.textNode += p.substring(re, T - 1);
            }
            _ === "<" && !(d.sawRoot && d.closedRoot && !d.strict) ? (d.state = y.OPEN_WAKA, d.startTagPosition = d.position) : (!x(_) && (!d.sawRoot || d.closedRoot) && C(d, "Text data outside of root node."), _ === "&" ? d.state = y.TEXT_ENTITY : d.textNode += _);
            continue;
          case y.SCRIPT:
            _ === "<" ? d.state = y.SCRIPT_ENDING : d.script += _;
            continue;
          case y.SCRIPT_ENDING:
            _ === "/" ? d.state = y.CLOSE_TAG : (d.script += "<" + _, d.state = y.SCRIPT);
            continue;
          case y.OPEN_WAKA:
            if (_ === "!")
              d.state = y.SGML_DECL, d.sgmlDecl = "";
            else if (!x(_)) if (j(S, _))
              d.state = y.OPEN_TAG, d.tagName = _;
            else if (_ === "/")
              d.state = y.CLOSE_TAG, d.tagName = "";
            else if (_ === "?")
              d.state = y.PROC_INST, d.procInstName = d.procInstBody = "";
            else {
              if (C(d, "Unencoded <"), d.startTagPosition + 1 < d.position) {
                var K = d.position - d.startTagPosition;
                _ = new Array(K).join(" ") + _;
              }
              d.textNode += "<" + _, d.state = y.TEXT;
            }
            continue;
          case y.SGML_DECL:
            if (d.sgmlDecl + _ === "--") {
              d.state = y.COMMENT, d.comment = "", d.sgmlDecl = "";
              continue;
            }
            d.doctype && d.doctype !== !0 && d.sgmlDecl ? (d.state = y.DOCTYPE_DTD, d.doctype += "<!" + d.sgmlDecl + _, d.sgmlDecl = "") : (d.sgmlDecl + _).toUpperCase() === u ? (M(d, "onopencdata"), d.state = y.CDATA, d.sgmlDecl = "", d.cdata = "") : (d.sgmlDecl + _).toUpperCase() === h ? (d.state = y.DOCTYPE, (d.doctype || d.sawRoot) && C(
              d,
              "Inappropriately located doctype declaration"
            ), d.doctype = "", d.sgmlDecl = "") : _ === ">" ? (M(d, "onsgmldeclaration", d.sgmlDecl), d.sgmlDecl = "", d.state = y.TEXT) : (B(_) && (d.state = y.SGML_DECL_QUOTED), d.sgmlDecl += _);
            continue;
          case y.SGML_DECL_QUOTED:
            _ === d.q && (d.state = y.SGML_DECL, d.q = ""), d.sgmlDecl += _;
            continue;
          case y.DOCTYPE:
            _ === ">" ? (d.state = y.TEXT, M(d, "ondoctype", d.doctype), d.doctype = !0) : (d.doctype += _, _ === "[" ? d.state = y.DOCTYPE_DTD : B(_) && (d.state = y.DOCTYPE_QUOTED, d.q = _));
            continue;
          case y.DOCTYPE_QUOTED:
            d.doctype += _, _ === d.q && (d.q = "", d.state = y.DOCTYPE);
            continue;
          case y.DOCTYPE_DTD:
            _ === "]" ? (d.doctype += _, d.state = y.DOCTYPE) : _ === "<" ? (d.state = y.OPEN_WAKA, d.startTagPosition = d.position) : B(_) ? (d.doctype += _, d.state = y.DOCTYPE_DTD_QUOTED, d.q = _) : d.doctype += _;
            continue;
          case y.DOCTYPE_DTD_QUOTED:
            d.doctype += _, _ === d.q && (d.state = y.DOCTYPE_DTD, d.q = "");
            continue;
          case y.COMMENT:
            _ === "-" ? d.state = y.COMMENT_ENDING : d.comment += _;
            continue;
          case y.COMMENT_ENDING:
            _ === "-" ? (d.state = y.COMMENT_ENDED, d.comment = R(d.opt, d.comment), d.comment && M(d, "oncomment", d.comment), d.comment = "") : (d.comment += "-" + _, d.state = y.COMMENT);
            continue;
          case y.COMMENT_ENDED:
            _ !== ">" ? (C(d, "Malformed comment"), d.comment += "--" + _, d.state = y.COMMENT) : d.doctype && d.doctype !== !0 ? d.state = y.DOCTYPE_DTD : d.state = y.TEXT;
            continue;
          case y.CDATA:
            for (var re = T - 1; _ && _ !== "]"; )
              _ = U(p, T++), _ && d.trackPosition && (d.position++, _ === `
` ? (d.line++, d.column = 0) : d.column++);
            d.cdata += p.substring(re, T - 1), _ === "]" && (d.state = y.CDATA_ENDING);
            continue;
          case y.CDATA_ENDING:
            _ === "]" ? d.state = y.CDATA_ENDING_2 : (d.cdata += "]" + _, d.state = y.CDATA);
            continue;
          case y.CDATA_ENDING_2:
            _ === ">" ? (d.cdata && M(d, "oncdata", d.cdata), M(d, "onclosecdata"), d.cdata = "", d.state = y.TEXT) : _ === "]" ? d.cdata += "]" : (d.cdata += "]]" + _, d.state = y.CDATA);
            continue;
          case y.PROC_INST:
            _ === "?" ? d.state = y.PROC_INST_ENDING : x(_) ? d.state = y.PROC_INST_BODY : d.procInstName += _;
            continue;
          case y.PROC_INST_BODY:
            if (!d.procInstBody && x(_))
              continue;
            _ === "?" ? d.state = y.PROC_INST_ENDING : d.procInstBody += _;
            continue;
          case y.PROC_INST_ENDING:
            _ === ">" ? (M(d, "onprocessinginstruction", {
              name: d.procInstName,
              body: d.procInstBody
            }), d.procInstName = d.procInstBody = "", d.state = y.TEXT) : (d.procInstBody += "?" + _, d.state = y.PROC_INST_BODY);
            continue;
          case y.OPEN_TAG:
            j(A, _) ? d.tagName += _ : ($(d), _ === ">" ? Y(d) : _ === "/" ? d.state = y.OPEN_TAG_SLASH : (x(_) || C(d, "Invalid character in tag name"), d.state = y.ATTRIB));
            continue;
          case y.OPEN_TAG_SLASH:
            _ === ">" ? (Y(d, !0), G(d)) : (C(
              d,
              "Forward-slash in opening tag not followed by >"
            ), d.state = y.ATTRIB);
            continue;
          case y.ATTRIB:
            if (x(_))
              continue;
            _ === ">" ? Y(d) : _ === "/" ? d.state = y.OPEN_TAG_SLASH : j(S, _) ? (d.attribName = _, d.attribValue = "", d.state = y.ATTRIB_NAME) : C(d, "Invalid attribute name");
            continue;
          case y.ATTRIB_NAME:
            _ === "=" ? d.state = y.ATTRIB_VALUE : _ === ">" ? (C(d, "Attribute without value"), d.attribValue = d.attribName, k(d), Y(d)) : x(_) ? d.state = y.ATTRIB_NAME_SAW_WHITE : j(A, _) ? d.attribName += _ : C(d, "Invalid attribute name");
            continue;
          case y.ATTRIB_NAME_SAW_WHITE:
            if (_ === "=")
              d.state = y.ATTRIB_VALUE;
            else {
              if (x(_))
                continue;
              C(d, "Attribute without value"), d.tag.attributes[d.attribName] = "", d.attribValue = "", M(d, "onattribute", {
                name: d.attribName,
                value: ""
              }), d.attribName = "", _ === ">" ? Y(d) : j(S, _) ? (d.attribName = _, d.state = y.ATTRIB_NAME) : (C(d, "Invalid attribute name"), d.state = y.ATTRIB);
            }
            continue;
          case y.ATTRIB_VALUE:
            if (x(_))
              continue;
            B(_) ? (d.q = _, d.state = y.ATTRIB_VALUE_QUOTED) : (d.opt.unquotedAttributeValues || O(d, "Unquoted attribute value"), d.state = y.ATTRIB_VALUE_UNQUOTED, d.attribValue = _);
            continue;
          case y.ATTRIB_VALUE_QUOTED:
            if (_ !== d.q) {
              _ === "&" ? d.state = y.ATTRIB_VALUE_ENTITY_Q : d.attribValue += _;
              continue;
            }
            k(d), d.q = "", d.state = y.ATTRIB_VALUE_CLOSED;
            continue;
          case y.ATTRIB_VALUE_CLOSED:
            x(_) ? d.state = y.ATTRIB : _ === ">" ? Y(d) : _ === "/" ? d.state = y.OPEN_TAG_SLASH : j(S, _) ? (C(d, "No whitespace between attributes"), d.attribName = _, d.attribValue = "", d.state = y.ATTRIB_NAME) : C(d, "Invalid attribute name");
            continue;
          case y.ATTRIB_VALUE_UNQUOTED:
            if (!q(_)) {
              _ === "&" ? d.state = y.ATTRIB_VALUE_ENTITY_U : d.attribValue += _;
              continue;
            }
            k(d), _ === ">" ? Y(d) : d.state = y.ATTRIB;
            continue;
          case y.CLOSE_TAG:
            if (d.tagName)
              _ === ">" ? G(d) : j(A, _) ? d.tagName += _ : d.script ? (d.script += "</" + d.tagName, d.tagName = "", d.state = y.SCRIPT) : (x(_) || C(d, "Invalid tagname in closing tag"), d.state = y.CLOSE_TAG_SAW_WHITE);
            else {
              if (x(_))
                continue;
              le(S, _) ? d.script ? (d.script += "</" + _, d.state = y.SCRIPT) : C(d, "Invalid tagname in closing tag.") : d.tagName = _;
            }
            continue;
          case y.CLOSE_TAG_SAW_WHITE:
            if (x(_))
              continue;
            _ === ">" ? G(d) : C(d, "Invalid characters in closing tag");
            continue;
          case y.TEXT_ENTITY:
          case y.ATTRIB_VALUE_ENTITY_Q:
          case y.ATTRIB_VALUE_ENTITY_U:
            var se, ge;
            switch (d.state) {
              case y.TEXT_ENTITY:
                se = y.TEXT, ge = "textNode";
                break;
              case y.ATTRIB_VALUE_ENTITY_Q:
                se = y.ATTRIB_VALUE_QUOTED, ge = "attribValue";
                break;
              case y.ATTRIB_VALUE_ENTITY_U:
                se = y.ATTRIB_VALUE_UNQUOTED, ge = "attribValue";
                break;
            }
            if (_ === ";") {
              var we = ee(d);
              d.opt.unparsedEntities && !Object.values(t.XML_ENTITIES).includes(we) ? (d.entity = "", d.state = se, d.write(we)) : (d[ge] += we, d.entity = "", d.state = se);
            } else j(d.entity.length ? N : b, _) ? d.entity += _ : (C(d, "Invalid character in entity name"), d[ge] += "&" + d.entity + _, d.entity = "", d.state = se);
            continue;
          default:
            throw new Error(d, "Unknown state: " + d.state);
        }
      return d.position >= d.bufferCheckPosition && i(d), d;
    }
    /*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
    String.fromCodePoint || function() {
      var p = String.fromCharCode, d = Math.floor, T = function() {
        var _ = 16384, K = [], re, se, ge = -1, we = arguments.length;
        if (!we)
          return "";
        for (var it = ""; ++ge < we; ) {
          var ue = Number(arguments[ge]);
          if (!isFinite(ue) || // `NaN`, `+Infinity`, or `-Infinity`
          ue < 0 || // not a valid Unicode code point
          ue > 1114111 || // not a valid Unicode code point
          d(ue) !== ue)
            throw RangeError("Invalid code point: " + ue);
          ue <= 65535 ? K.push(ue) : (ue -= 65536, re = (ue >> 10) + 55296, se = ue % 1024 + 56320, K.push(re, se)), (ge + 1 === we || K.length > _) && (it += p.apply(null, K), K.length = 0);
        }
        return it;
      };
      Object.defineProperty ? Object.defineProperty(String, "fromCodePoint", {
        value: T,
        configurable: !0,
        writable: !0
      }) : String.fromCodePoint = T;
    }();
  })(e);
})(yu);
Object.defineProperty(Xr, "__esModule", { value: !0 });
Xr.XElement = void 0;
Xr.parseXml = ug;
const ag = yu, vn = cr;
class Eu {
  constructor(t) {
    if (this.name = t, this.value = "", this.attributes = null, this.isCData = !1, this.elements = null, !t)
      throw (0, vn.newError)("Element name cannot be empty", "ERR_XML_ELEMENT_NAME_EMPTY");
    if (!cg(t))
      throw (0, vn.newError)(`Invalid element name: ${t}`, "ERR_XML_ELEMENT_INVALID_NAME");
  }
  attribute(t) {
    const r = this.attributes === null ? null : this.attributes[t];
    if (r == null)
      throw (0, vn.newError)(`No attribute "${t}"`, "ERR_XML_MISSED_ATTRIBUTE");
    return r;
  }
  removeAttribute(t) {
    this.attributes !== null && delete this.attributes[t];
  }
  element(t, r = !1, n = null) {
    const i = this.elementOrNull(t, r);
    if (i === null)
      throw (0, vn.newError)(n || `No element "${t}"`, "ERR_XML_MISSED_ELEMENT");
    return i;
  }
  elementOrNull(t, r = !1) {
    if (this.elements === null)
      return null;
    for (const n of this.elements)
      if (Sa(n, t, r))
        return n;
    return null;
  }
  getElements(t, r = !1) {
    return this.elements === null ? [] : this.elements.filter((n) => Sa(n, t, r));
  }
  elementValueOrEmpty(t, r = !1) {
    const n = this.elementOrNull(t, r);
    return n === null ? "" : n.value;
  }
}
Xr.XElement = Eu;
const lg = new RegExp(/^[A-Za-z_][:A-Za-z0-9_-]*$/i);
function cg(e) {
  return lg.test(e);
}
function Sa(e, t, r) {
  const n = e.name;
  return n === t || r === !0 && n.length === t.length && n.toLowerCase() === t.toLowerCase();
}
function ug(e) {
  let t = null;
  const r = ag.parser(!0, {}), n = [];
  return r.onopentag = (i) => {
    const o = new Eu(i.name);
    if (o.attributes = i.attributes, t === null)
      t = o;
    else {
      const s = n[n.length - 1];
      s.elements == null && (s.elements = []), s.elements.push(o);
    }
    n.push(o);
  }, r.onclosetag = () => {
    n.pop();
  }, r.ontext = (i) => {
    n.length > 0 && (n[n.length - 1].value = i);
  }, r.oncdata = (i) => {
    const o = n[n.length - 1];
    o.value = i, o.isCData = !0;
  }, r.onerror = (i) => {
    throw i;
  }, r.write(e), t;
}
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.CURRENT_APP_PACKAGE_FILE_NAME = e.CURRENT_APP_INSTALLER_FILE_NAME = e.XElement = e.parseXml = e.UUID = e.parseDn = e.retry = e.githubUrl = e.getS3LikeProviderBaseUrl = e.ProgressCallbackTransform = e.MemoLazy = e.safeStringifyJson = e.safeGetHeader = e.parseJson = e.HttpExecutor = e.HttpError = e.DigestTransform = e.createHttpError = e.configureRequestUrl = e.configureRequestOptionsFromUrl = e.configureRequestOptions = e.newError = e.CancellationToken = e.CancellationError = void 0, e.asArray = u;
  var t = gt;
  Object.defineProperty(e, "CancellationError", { enumerable: !0, get: function() {
    return t.CancellationError;
  } }), Object.defineProperty(e, "CancellationToken", { enumerable: !0, get: function() {
    return t.CancellationToken;
  } });
  var r = cr;
  Object.defineProperty(e, "newError", { enumerable: !0, get: function() {
    return r.newError;
  } });
  var n = Ce;
  Object.defineProperty(e, "configureRequestOptions", { enumerable: !0, get: function() {
    return n.configureRequestOptions;
  } }), Object.defineProperty(e, "configureRequestOptionsFromUrl", { enumerable: !0, get: function() {
    return n.configureRequestOptionsFromUrl;
  } }), Object.defineProperty(e, "configureRequestUrl", { enumerable: !0, get: function() {
    return n.configureRequestUrl;
  } }), Object.defineProperty(e, "createHttpError", { enumerable: !0, get: function() {
    return n.createHttpError;
  } }), Object.defineProperty(e, "DigestTransform", { enumerable: !0, get: function() {
    return n.DigestTransform;
  } }), Object.defineProperty(e, "HttpError", { enumerable: !0, get: function() {
    return n.HttpError;
  } }), Object.defineProperty(e, "HttpExecutor", { enumerable: !0, get: function() {
    return n.HttpExecutor;
  } }), Object.defineProperty(e, "parseJson", { enumerable: !0, get: function() {
    return n.parseJson;
  } }), Object.defineProperty(e, "safeGetHeader", { enumerable: !0, get: function() {
    return n.safeGetHeader;
  } }), Object.defineProperty(e, "safeStringifyJson", { enumerable: !0, get: function() {
    return n.safeStringifyJson;
  } });
  var i = Zn;
  Object.defineProperty(e, "MemoLazy", { enumerable: !0, get: function() {
    return i.MemoLazy;
  } });
  var o = Yr;
  Object.defineProperty(e, "ProgressCallbackTransform", { enumerable: !0, get: function() {
    return o.ProgressCallbackTransform;
  } });
  var s = ei;
  Object.defineProperty(e, "getS3LikeProviderBaseUrl", { enumerable: !0, get: function() {
    return s.getS3LikeProviderBaseUrl;
  } }), Object.defineProperty(e, "githubUrl", { enumerable: !0, get: function() {
    return s.githubUrl;
  } });
  var a = ss;
  Object.defineProperty(e, "retry", { enumerable: !0, get: function() {
    return a.retry;
  } });
  var l = as;
  Object.defineProperty(e, "parseDn", { enumerable: !0, get: function() {
    return l.parseDn;
  } });
  var f = or;
  Object.defineProperty(e, "UUID", { enumerable: !0, get: function() {
    return f.UUID;
  } });
  var c = Xr;
  Object.defineProperty(e, "parseXml", { enumerable: !0, get: function() {
    return c.parseXml;
  } }), Object.defineProperty(e, "XElement", { enumerable: !0, get: function() {
    return c.XElement;
  } }), e.CURRENT_APP_INSTALLER_FILE_NAME = "installer.exe", e.CURRENT_APP_PACKAGE_FILE_NAME = "package.7z";
  function u(h) {
    return h == null ? [] : Array.isArray(h) ? h : [h];
  }
})(me);
var ve = {}, ls = {}, Ge = {};
function vu(e) {
  return typeof e > "u" || e === null;
}
function fg(e) {
  return typeof e == "object" && e !== null;
}
function dg(e) {
  return Array.isArray(e) ? e : vu(e) ? [] : [e];
}
function hg(e, t) {
  var r, n, i, o;
  if (t)
    for (o = Object.keys(t), r = 0, n = o.length; r < n; r += 1)
      i = o[r], e[i] = t[i];
  return e;
}
function pg(e, t) {
  var r = "", n;
  for (n = 0; n < t; n += 1)
    r += e;
  return r;
}
function mg(e) {
  return e === 0 && Number.NEGATIVE_INFINITY === 1 / e;
}
Ge.isNothing = vu;
Ge.isObject = fg;
Ge.toArray = dg;
Ge.repeat = pg;
Ge.isNegativeZero = mg;
Ge.extend = hg;
function wu(e, t) {
  var r = "", n = e.reason || "(unknown reason)";
  return e.mark ? (e.mark.name && (r += 'in "' + e.mark.name + '" '), r += "(" + (e.mark.line + 1) + ":" + (e.mark.column + 1) + ")", !t && e.mark.snippet && (r += `

` + e.mark.snippet), n + " " + r) : n;
}
function Fr(e, t) {
  Error.call(this), this.name = "YAMLException", this.reason = e, this.mark = t, this.message = wu(this, !1), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack || "";
}
Fr.prototype = Object.create(Error.prototype);
Fr.prototype.constructor = Fr;
Fr.prototype.toString = function(t) {
  return this.name + ": " + wu(this, t);
};
var Jr = Fr, Sr = Ge;
function Fi(e, t, r, n, i) {
  var o = "", s = "", a = Math.floor(i / 2) - 1;
  return n - t > a && (o = " ... ", t = n - a + o.length), r - n > a && (s = " ...", r = n + a - s.length), {
    str: o + e.slice(t, r).replace(/\t/g, "→") + s,
    pos: n - t + o.length
    // relative position
  };
}
function xi(e, t) {
  return Sr.repeat(" ", t - e.length) + e;
}
function gg(e, t) {
  if (t = Object.create(t || null), !e.buffer) return null;
  t.maxLength || (t.maxLength = 79), typeof t.indent != "number" && (t.indent = 1), typeof t.linesBefore != "number" && (t.linesBefore = 3), typeof t.linesAfter != "number" && (t.linesAfter = 2);
  for (var r = /\r?\n|\r|\0/g, n = [0], i = [], o, s = -1; o = r.exec(e.buffer); )
    i.push(o.index), n.push(o.index + o[0].length), e.position <= o.index && s < 0 && (s = n.length - 2);
  s < 0 && (s = n.length - 1);
  var a = "", l, f, c = Math.min(e.line + t.linesAfter, i.length).toString().length, u = t.maxLength - (t.indent + c + 3);
  for (l = 1; l <= t.linesBefore && !(s - l < 0); l++)
    f = Fi(
      e.buffer,
      n[s - l],
      i[s - l],
      e.position - (n[s] - n[s - l]),
      u
    ), a = Sr.repeat(" ", t.indent) + xi((e.line - l + 1).toString(), c) + " | " + f.str + `
` + a;
  for (f = Fi(e.buffer, n[s], i[s], e.position, u), a += Sr.repeat(" ", t.indent) + xi((e.line + 1).toString(), c) + " | " + f.str + `
`, a += Sr.repeat("-", t.indent + c + 3 + f.pos) + `^
`, l = 1; l <= t.linesAfter && !(s + l >= i.length); l++)
    f = Fi(
      e.buffer,
      n[s + l],
      i[s + l],
      e.position - (n[s] - n[s + l]),
      u
    ), a += Sr.repeat(" ", t.indent) + xi((e.line + l + 1).toString(), c) + " | " + f.str + `
`;
  return a.replace(/\n$/, "");
}
var yg = gg, Aa = Jr, Eg = [
  "kind",
  "multi",
  "resolve",
  "construct",
  "instanceOf",
  "predicate",
  "represent",
  "representName",
  "defaultStyle",
  "styleAliases"
], vg = [
  "scalar",
  "sequence",
  "mapping"
];
function wg(e) {
  var t = {};
  return e !== null && Object.keys(e).forEach(function(r) {
    e[r].forEach(function(n) {
      t[String(n)] = r;
    });
  }), t;
}
function _g(e, t) {
  if (t = t || {}, Object.keys(t).forEach(function(r) {
    if (Eg.indexOf(r) === -1)
      throw new Aa('Unknown option "' + r + '" is met in definition of "' + e + '" YAML type.');
  }), this.options = t, this.tag = e, this.kind = t.kind || null, this.resolve = t.resolve || function() {
    return !0;
  }, this.construct = t.construct || function(r) {
    return r;
  }, this.instanceOf = t.instanceOf || null, this.predicate = t.predicate || null, this.represent = t.represent || null, this.representName = t.representName || null, this.defaultStyle = t.defaultStyle || null, this.multi = t.multi || !1, this.styleAliases = wg(t.styleAliases || null), vg.indexOf(this.kind) === -1)
    throw new Aa('Unknown kind "' + this.kind + '" is specified for "' + e + '" YAML type.');
}
var Ie = _g, Er = Jr, Li = Ie;
function ba(e, t) {
  var r = [];
  return e[t].forEach(function(n) {
    var i = r.length;
    r.forEach(function(o, s) {
      o.tag === n.tag && o.kind === n.kind && o.multi === n.multi && (i = s);
    }), r[i] = n;
  }), r;
}
function Sg() {
  var e = {
    scalar: {},
    sequence: {},
    mapping: {},
    fallback: {},
    multi: {
      scalar: [],
      sequence: [],
      mapping: [],
      fallback: []
    }
  }, t, r;
  function n(i) {
    i.multi ? (e.multi[i.kind].push(i), e.multi.fallback.push(i)) : e[i.kind][i.tag] = e.fallback[i.tag] = i;
  }
  for (t = 0, r = arguments.length; t < r; t += 1)
    arguments[t].forEach(n);
  return e;
}
function ko(e) {
  return this.extend(e);
}
ko.prototype.extend = function(t) {
  var r = [], n = [];
  if (t instanceof Li)
    n.push(t);
  else if (Array.isArray(t))
    n = n.concat(t);
  else if (t && (Array.isArray(t.implicit) || Array.isArray(t.explicit)))
    t.implicit && (r = r.concat(t.implicit)), t.explicit && (n = n.concat(t.explicit));
  else
    throw new Er("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
  r.forEach(function(o) {
    if (!(o instanceof Li))
      throw new Er("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    if (o.loadKind && o.loadKind !== "scalar")
      throw new Er("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
    if (o.multi)
      throw new Er("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
  }), n.forEach(function(o) {
    if (!(o instanceof Li))
      throw new Er("Specified list of YAML types (or a single Type object) contains a non-Type object.");
  });
  var i = Object.create(ko.prototype);
  return i.implicit = (this.implicit || []).concat(r), i.explicit = (this.explicit || []).concat(n), i.compiledImplicit = ba(i, "implicit"), i.compiledExplicit = ba(i, "explicit"), i.compiledTypeMap = Sg(i.compiledImplicit, i.compiledExplicit), i;
};
var _u = ko, Ag = Ie, Su = new Ag("tag:yaml.org,2002:str", {
  kind: "scalar",
  construct: function(e) {
    return e !== null ? e : "";
  }
}), bg = Ie, Au = new bg("tag:yaml.org,2002:seq", {
  kind: "sequence",
  construct: function(e) {
    return e !== null ? e : [];
  }
}), Tg = Ie, bu = new Tg("tag:yaml.org,2002:map", {
  kind: "mapping",
  construct: function(e) {
    return e !== null ? e : {};
  }
}), Cg = _u, Tu = new Cg({
  explicit: [
    Su,
    Au,
    bu
  ]
}), Og = Ie;
function Pg(e) {
  if (e === null) return !0;
  var t = e.length;
  return t === 1 && e === "~" || t === 4 && (e === "null" || e === "Null" || e === "NULL");
}
function Rg() {
  return null;
}
function Ig(e) {
  return e === null;
}
var Cu = new Og("tag:yaml.org,2002:null", {
  kind: "scalar",
  resolve: Pg,
  construct: Rg,
  predicate: Ig,
  represent: {
    canonical: function() {
      return "~";
    },
    lowercase: function() {
      return "null";
    },
    uppercase: function() {
      return "NULL";
    },
    camelcase: function() {
      return "Null";
    },
    empty: function() {
      return "";
    }
  },
  defaultStyle: "lowercase"
}), Dg = Ie;
function Ng(e) {
  if (e === null) return !1;
  var t = e.length;
  return t === 4 && (e === "true" || e === "True" || e === "TRUE") || t === 5 && (e === "false" || e === "False" || e === "FALSE");
}
function $g(e) {
  return e === "true" || e === "True" || e === "TRUE";
}
function Fg(e) {
  return Object.prototype.toString.call(e) === "[object Boolean]";
}
var Ou = new Dg("tag:yaml.org,2002:bool", {
  kind: "scalar",
  resolve: Ng,
  construct: $g,
  predicate: Fg,
  represent: {
    lowercase: function(e) {
      return e ? "true" : "false";
    },
    uppercase: function(e) {
      return e ? "TRUE" : "FALSE";
    },
    camelcase: function(e) {
      return e ? "True" : "False";
    }
  },
  defaultStyle: "lowercase"
}), xg = Ge, Lg = Ie;
function Ug(e) {
  return 48 <= e && e <= 57 || 65 <= e && e <= 70 || 97 <= e && e <= 102;
}
function kg(e) {
  return 48 <= e && e <= 55;
}
function Mg(e) {
  return 48 <= e && e <= 57;
}
function jg(e) {
  if (e === null) return !1;
  var t = e.length, r = 0, n = !1, i;
  if (!t) return !1;
  if (i = e[r], (i === "-" || i === "+") && (i = e[++r]), i === "0") {
    if (r + 1 === t) return !0;
    if (i = e[++r], i === "b") {
      for (r++; r < t; r++)
        if (i = e[r], i !== "_") {
          if (i !== "0" && i !== "1") return !1;
          n = !0;
        }
      return n && i !== "_";
    }
    if (i === "x") {
      for (r++; r < t; r++)
        if (i = e[r], i !== "_") {
          if (!Ug(e.charCodeAt(r))) return !1;
          n = !0;
        }
      return n && i !== "_";
    }
    if (i === "o") {
      for (r++; r < t; r++)
        if (i = e[r], i !== "_") {
          if (!kg(e.charCodeAt(r))) return !1;
          n = !0;
        }
      return n && i !== "_";
    }
  }
  if (i === "_") return !1;
  for (; r < t; r++)
    if (i = e[r], i !== "_") {
      if (!Mg(e.charCodeAt(r)))
        return !1;
      n = !0;
    }
  return !(!n || i === "_");
}
function Bg(e) {
  var t = e, r = 1, n;
  if (t.indexOf("_") !== -1 && (t = t.replace(/_/g, "")), n = t[0], (n === "-" || n === "+") && (n === "-" && (r = -1), t = t.slice(1), n = t[0]), t === "0") return 0;
  if (n === "0") {
    if (t[1] === "b") return r * parseInt(t.slice(2), 2);
    if (t[1] === "x") return r * parseInt(t.slice(2), 16);
    if (t[1] === "o") return r * parseInt(t.slice(2), 8);
  }
  return r * parseInt(t, 10);
}
function qg(e) {
  return Object.prototype.toString.call(e) === "[object Number]" && e % 1 === 0 && !xg.isNegativeZero(e);
}
var Pu = new Lg("tag:yaml.org,2002:int", {
  kind: "scalar",
  resolve: jg,
  construct: Bg,
  predicate: qg,
  represent: {
    binary: function(e) {
      return e >= 0 ? "0b" + e.toString(2) : "-0b" + e.toString(2).slice(1);
    },
    octal: function(e) {
      return e >= 0 ? "0o" + e.toString(8) : "-0o" + e.toString(8).slice(1);
    },
    decimal: function(e) {
      return e.toString(10);
    },
    /* eslint-disable max-len */
    hexadecimal: function(e) {
      return e >= 0 ? "0x" + e.toString(16).toUpperCase() : "-0x" + e.toString(16).toUpperCase().slice(1);
    }
  },
  defaultStyle: "decimal",
  styleAliases: {
    binary: [2, "bin"],
    octal: [8, "oct"],
    decimal: [10, "dec"],
    hexadecimal: [16, "hex"]
  }
}), Ru = Ge, Hg = Ie, Gg = new RegExp(
  // 2.5e4, 2.5 and integers
  "^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
);
function Wg(e) {
  return !(e === null || !Gg.test(e) || // Quick hack to not allow integers end with `_`
  // Probably should update regexp & check speed
  e[e.length - 1] === "_");
}
function Vg(e) {
  var t, r;
  return t = e.replace(/_/g, "").toLowerCase(), r = t[0] === "-" ? -1 : 1, "+-".indexOf(t[0]) >= 0 && (t = t.slice(1)), t === ".inf" ? r === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : t === ".nan" ? NaN : r * parseFloat(t, 10);
}
var zg = /^[-+]?[0-9]+e/;
function Yg(e, t) {
  var r;
  if (isNaN(e))
    switch (t) {
      case "lowercase":
        return ".nan";
      case "uppercase":
        return ".NAN";
      case "camelcase":
        return ".NaN";
    }
  else if (Number.POSITIVE_INFINITY === e)
    switch (t) {
      case "lowercase":
        return ".inf";
      case "uppercase":
        return ".INF";
      case "camelcase":
        return ".Inf";
    }
  else if (Number.NEGATIVE_INFINITY === e)
    switch (t) {
      case "lowercase":
        return "-.inf";
      case "uppercase":
        return "-.INF";
      case "camelcase":
        return "-.Inf";
    }
  else if (Ru.isNegativeZero(e))
    return "-0.0";
  return r = e.toString(10), zg.test(r) ? r.replace("e", ".e") : r;
}
function Xg(e) {
  return Object.prototype.toString.call(e) === "[object Number]" && (e % 1 !== 0 || Ru.isNegativeZero(e));
}
var Iu = new Hg("tag:yaml.org,2002:float", {
  kind: "scalar",
  resolve: Wg,
  construct: Vg,
  predicate: Xg,
  represent: Yg,
  defaultStyle: "lowercase"
}), Du = Tu.extend({
  implicit: [
    Cu,
    Ou,
    Pu,
    Iu
  ]
}), Nu = Du, Jg = Ie, $u = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
), Fu = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
);
function Kg(e) {
  return e === null ? !1 : $u.exec(e) !== null || Fu.exec(e) !== null;
}
function Qg(e) {
  var t, r, n, i, o, s, a, l = 0, f = null, c, u, h;
  if (t = $u.exec(e), t === null && (t = Fu.exec(e)), t === null) throw new Error("Date resolve error");
  if (r = +t[1], n = +t[2] - 1, i = +t[3], !t[4])
    return new Date(Date.UTC(r, n, i));
  if (o = +t[4], s = +t[5], a = +t[6], t[7]) {
    for (l = t[7].slice(0, 3); l.length < 3; )
      l += "0";
    l = +l;
  }
  return t[9] && (c = +t[10], u = +(t[11] || 0), f = (c * 60 + u) * 6e4, t[9] === "-" && (f = -f)), h = new Date(Date.UTC(r, n, i, o, s, a, l)), f && h.setTime(h.getTime() - f), h;
}
function Zg(e) {
  return e.toISOString();
}
var xu = new Jg("tag:yaml.org,2002:timestamp", {
  kind: "scalar",
  resolve: Kg,
  construct: Qg,
  instanceOf: Date,
  represent: Zg
}), e0 = Ie;
function t0(e) {
  return e === "<<" || e === null;
}
var Lu = new e0("tag:yaml.org,2002:merge", {
  kind: "scalar",
  resolve: t0
}), r0 = Ie, cs = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
function n0(e) {
  if (e === null) return !1;
  var t, r, n = 0, i = e.length, o = cs;
  for (r = 0; r < i; r++)
    if (t = o.indexOf(e.charAt(r)), !(t > 64)) {
      if (t < 0) return !1;
      n += 6;
    }
  return n % 8 === 0;
}
function i0(e) {
  var t, r, n = e.replace(/[\r\n=]/g, ""), i = n.length, o = cs, s = 0, a = [];
  for (t = 0; t < i; t++)
    t % 4 === 0 && t && (a.push(s >> 16 & 255), a.push(s >> 8 & 255), a.push(s & 255)), s = s << 6 | o.indexOf(n.charAt(t));
  return r = i % 4 * 6, r === 0 ? (a.push(s >> 16 & 255), a.push(s >> 8 & 255), a.push(s & 255)) : r === 18 ? (a.push(s >> 10 & 255), a.push(s >> 2 & 255)) : r === 12 && a.push(s >> 4 & 255), new Uint8Array(a);
}
function o0(e) {
  var t = "", r = 0, n, i, o = e.length, s = cs;
  for (n = 0; n < o; n++)
    n % 3 === 0 && n && (t += s[r >> 18 & 63], t += s[r >> 12 & 63], t += s[r >> 6 & 63], t += s[r & 63]), r = (r << 8) + e[n];
  return i = o % 3, i === 0 ? (t += s[r >> 18 & 63], t += s[r >> 12 & 63], t += s[r >> 6 & 63], t += s[r & 63]) : i === 2 ? (t += s[r >> 10 & 63], t += s[r >> 4 & 63], t += s[r << 2 & 63], t += s[64]) : i === 1 && (t += s[r >> 2 & 63], t += s[r << 4 & 63], t += s[64], t += s[64]), t;
}
function s0(e) {
  return Object.prototype.toString.call(e) === "[object Uint8Array]";
}
var Uu = new r0("tag:yaml.org,2002:binary", {
  kind: "scalar",
  resolve: n0,
  construct: i0,
  predicate: s0,
  represent: o0
}), a0 = Ie, l0 = Object.prototype.hasOwnProperty, c0 = Object.prototype.toString;
function u0(e) {
  if (e === null) return !0;
  var t = [], r, n, i, o, s, a = e;
  for (r = 0, n = a.length; r < n; r += 1) {
    if (i = a[r], s = !1, c0.call(i) !== "[object Object]") return !1;
    for (o in i)
      if (l0.call(i, o))
        if (!s) s = !0;
        else return !1;
    if (!s) return !1;
    if (t.indexOf(o) === -1) t.push(o);
    else return !1;
  }
  return !0;
}
function f0(e) {
  return e !== null ? e : [];
}
var ku = new a0("tag:yaml.org,2002:omap", {
  kind: "sequence",
  resolve: u0,
  construct: f0
}), d0 = Ie, h0 = Object.prototype.toString;
function p0(e) {
  if (e === null) return !0;
  var t, r, n, i, o, s = e;
  for (o = new Array(s.length), t = 0, r = s.length; t < r; t += 1) {
    if (n = s[t], h0.call(n) !== "[object Object]" || (i = Object.keys(n), i.length !== 1)) return !1;
    o[t] = [i[0], n[i[0]]];
  }
  return !0;
}
function m0(e) {
  if (e === null) return [];
  var t, r, n, i, o, s = e;
  for (o = new Array(s.length), t = 0, r = s.length; t < r; t += 1)
    n = s[t], i = Object.keys(n), o[t] = [i[0], n[i[0]]];
  return o;
}
var Mu = new d0("tag:yaml.org,2002:pairs", {
  kind: "sequence",
  resolve: p0,
  construct: m0
}), g0 = Ie, y0 = Object.prototype.hasOwnProperty;
function E0(e) {
  if (e === null) return !0;
  var t, r = e;
  for (t in r)
    if (y0.call(r, t) && r[t] !== null)
      return !1;
  return !0;
}
function v0(e) {
  return e !== null ? e : {};
}
var ju = new g0("tag:yaml.org,2002:set", {
  kind: "mapping",
  resolve: E0,
  construct: v0
}), us = Nu.extend({
  implicit: [
    xu,
    Lu
  ],
  explicit: [
    Uu,
    ku,
    Mu,
    ju
  ]
}), Dt = Ge, Bu = Jr, w0 = yg, _0 = us, yt = Object.prototype.hasOwnProperty, Bn = 1, qu = 2, Hu = 3, qn = 4, Ui = 1, S0 = 2, Ta = 3, A0 = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, b0 = /[\x85\u2028\u2029]/, T0 = /[,\[\]\{\}]/, Gu = /^(?:!|!!|![a-z\-]+!)$/i, Wu = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
function Ca(e) {
  return Object.prototype.toString.call(e);
}
function Je(e) {
  return e === 10 || e === 13;
}
function Ft(e) {
  return e === 9 || e === 32;
}
function $e(e) {
  return e === 9 || e === 32 || e === 10 || e === 13;
}
function Jt(e) {
  return e === 44 || e === 91 || e === 93 || e === 123 || e === 125;
}
function C0(e) {
  var t;
  return 48 <= e && e <= 57 ? e - 48 : (t = e | 32, 97 <= t && t <= 102 ? t - 97 + 10 : -1);
}
function O0(e) {
  return e === 120 ? 2 : e === 117 ? 4 : e === 85 ? 8 : 0;
}
function P0(e) {
  return 48 <= e && e <= 57 ? e - 48 : -1;
}
function Oa(e) {
  return e === 48 ? "\0" : e === 97 ? "\x07" : e === 98 ? "\b" : e === 116 || e === 9 ? "	" : e === 110 ? `
` : e === 118 ? "\v" : e === 102 ? "\f" : e === 114 ? "\r" : e === 101 ? "\x1B" : e === 32 ? " " : e === 34 ? '"' : e === 47 ? "/" : e === 92 ? "\\" : e === 78 ? "" : e === 95 ? " " : e === 76 ? "\u2028" : e === 80 ? "\u2029" : "";
}
function R0(e) {
  return e <= 65535 ? String.fromCharCode(e) : String.fromCharCode(
    (e - 65536 >> 10) + 55296,
    (e - 65536 & 1023) + 56320
  );
}
function Vu(e, t, r) {
  t === "__proto__" ? Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !0,
    writable: !0,
    value: r
  }) : e[t] = r;
}
var zu = new Array(256), Yu = new Array(256);
for (var Ht = 0; Ht < 256; Ht++)
  zu[Ht] = Oa(Ht) ? 1 : 0, Yu[Ht] = Oa(Ht);
function I0(e, t) {
  this.input = e, this.filename = t.filename || null, this.schema = t.schema || _0, this.onWarning = t.onWarning || null, this.legacy = t.legacy || !1, this.json = t.json || !1, this.listener = t.listener || null, this.implicitTypes = this.schema.compiledImplicit, this.typeMap = this.schema.compiledTypeMap, this.length = e.length, this.position = 0, this.line = 0, this.lineStart = 0, this.lineIndent = 0, this.firstTabInLine = -1, this.documents = [];
}
function Xu(e, t) {
  var r = {
    name: e.filename,
    buffer: e.input.slice(0, -1),
    // omit trailing \0
    position: e.position,
    line: e.line,
    column: e.position - e.lineStart
  };
  return r.snippet = w0(r), new Bu(t, r);
}
function L(e, t) {
  throw Xu(e, t);
}
function Hn(e, t) {
  e.onWarning && e.onWarning.call(null, Xu(e, t));
}
var Pa = {
  YAML: function(t, r, n) {
    var i, o, s;
    t.version !== null && L(t, "duplication of %YAML directive"), n.length !== 1 && L(t, "YAML directive accepts exactly one argument"), i = /^([0-9]+)\.([0-9]+)$/.exec(n[0]), i === null && L(t, "ill-formed argument of the YAML directive"), o = parseInt(i[1], 10), s = parseInt(i[2], 10), o !== 1 && L(t, "unacceptable YAML version of the document"), t.version = n[0], t.checkLineBreaks = s < 2, s !== 1 && s !== 2 && Hn(t, "unsupported YAML version of the document");
  },
  TAG: function(t, r, n) {
    var i, o;
    n.length !== 2 && L(t, "TAG directive accepts exactly two arguments"), i = n[0], o = n[1], Gu.test(i) || L(t, "ill-formed tag handle (first argument) of the TAG directive"), yt.call(t.tagMap, i) && L(t, 'there is a previously declared suffix for "' + i + '" tag handle'), Wu.test(o) || L(t, "ill-formed tag prefix (second argument) of the TAG directive");
    try {
      o = decodeURIComponent(o);
    } catch {
      L(t, "tag prefix is malformed: " + o);
    }
    t.tagMap[i] = o;
  }
};
function ht(e, t, r, n) {
  var i, o, s, a;
  if (t < r) {
    if (a = e.input.slice(t, r), n)
      for (i = 0, o = a.length; i < o; i += 1)
        s = a.charCodeAt(i), s === 9 || 32 <= s && s <= 1114111 || L(e, "expected valid JSON character");
    else A0.test(a) && L(e, "the stream contains non-printable characters");
    e.result += a;
  }
}
function Ra(e, t, r, n) {
  var i, o, s, a;
  for (Dt.isObject(r) || L(e, "cannot merge mappings; the provided source object is unacceptable"), i = Object.keys(r), s = 0, a = i.length; s < a; s += 1)
    o = i[s], yt.call(t, o) || (Vu(t, o, r[o]), n[o] = !0);
}
function Kt(e, t, r, n, i, o, s, a, l) {
  var f, c;
  if (Array.isArray(i))
    for (i = Array.prototype.slice.call(i), f = 0, c = i.length; f < c; f += 1)
      Array.isArray(i[f]) && L(e, "nested arrays are not supported inside keys"), typeof i == "object" && Ca(i[f]) === "[object Object]" && (i[f] = "[object Object]");
  if (typeof i == "object" && Ca(i) === "[object Object]" && (i = "[object Object]"), i = String(i), t === null && (t = {}), n === "tag:yaml.org,2002:merge")
    if (Array.isArray(o))
      for (f = 0, c = o.length; f < c; f += 1)
        Ra(e, t, o[f], r);
    else
      Ra(e, t, o, r);
  else
    !e.json && !yt.call(r, i) && yt.call(t, i) && (e.line = s || e.line, e.lineStart = a || e.lineStart, e.position = l || e.position, L(e, "duplicated mapping key")), Vu(t, i, o), delete r[i];
  return t;
}
function fs(e) {
  var t;
  t = e.input.charCodeAt(e.position), t === 10 ? e.position++ : t === 13 ? (e.position++, e.input.charCodeAt(e.position) === 10 && e.position++) : L(e, "a line break is expected"), e.line += 1, e.lineStart = e.position, e.firstTabInLine = -1;
}
function ce(e, t, r) {
  for (var n = 0, i = e.input.charCodeAt(e.position); i !== 0; ) {
    for (; Ft(i); )
      i === 9 && e.firstTabInLine === -1 && (e.firstTabInLine = e.position), i = e.input.charCodeAt(++e.position);
    if (t && i === 35)
      do
        i = e.input.charCodeAt(++e.position);
      while (i !== 10 && i !== 13 && i !== 0);
    if (Je(i))
      for (fs(e), i = e.input.charCodeAt(e.position), n++, e.lineIndent = 0; i === 32; )
        e.lineIndent++, i = e.input.charCodeAt(++e.position);
    else
      break;
  }
  return r !== -1 && n !== 0 && e.lineIndent < r && Hn(e, "deficient indentation"), n;
}
function ti(e) {
  var t = e.position, r;
  return r = e.input.charCodeAt(t), !!((r === 45 || r === 46) && r === e.input.charCodeAt(t + 1) && r === e.input.charCodeAt(t + 2) && (t += 3, r = e.input.charCodeAt(t), r === 0 || $e(r)));
}
function ds(e, t) {
  t === 1 ? e.result += " " : t > 1 && (e.result += Dt.repeat(`
`, t - 1));
}
function D0(e, t, r) {
  var n, i, o, s, a, l, f, c, u = e.kind, h = e.result, m;
  if (m = e.input.charCodeAt(e.position), $e(m) || Jt(m) || m === 35 || m === 38 || m === 42 || m === 33 || m === 124 || m === 62 || m === 39 || m === 34 || m === 37 || m === 64 || m === 96 || (m === 63 || m === 45) && (i = e.input.charCodeAt(e.position + 1), $e(i) || r && Jt(i)))
    return !1;
  for (e.kind = "scalar", e.result = "", o = s = e.position, a = !1; m !== 0; ) {
    if (m === 58) {
      if (i = e.input.charCodeAt(e.position + 1), $e(i) || r && Jt(i))
        break;
    } else if (m === 35) {
      if (n = e.input.charCodeAt(e.position - 1), $e(n))
        break;
    } else {
      if (e.position === e.lineStart && ti(e) || r && Jt(m))
        break;
      if (Je(m))
        if (l = e.line, f = e.lineStart, c = e.lineIndent, ce(e, !1, -1), e.lineIndent >= t) {
          a = !0, m = e.input.charCodeAt(e.position);
          continue;
        } else {
          e.position = s, e.line = l, e.lineStart = f, e.lineIndent = c;
          break;
        }
    }
    a && (ht(e, o, s, !1), ds(e, e.line - l), o = s = e.position, a = !1), Ft(m) || (s = e.position + 1), m = e.input.charCodeAt(++e.position);
  }
  return ht(e, o, s, !1), e.result ? !0 : (e.kind = u, e.result = h, !1);
}
function N0(e, t) {
  var r, n, i;
  if (r = e.input.charCodeAt(e.position), r !== 39)
    return !1;
  for (e.kind = "scalar", e.result = "", e.position++, n = i = e.position; (r = e.input.charCodeAt(e.position)) !== 0; )
    if (r === 39)
      if (ht(e, n, e.position, !0), r = e.input.charCodeAt(++e.position), r === 39)
        n = e.position, e.position++, i = e.position;
      else
        return !0;
    else Je(r) ? (ht(e, n, i, !0), ds(e, ce(e, !1, t)), n = i = e.position) : e.position === e.lineStart && ti(e) ? L(e, "unexpected end of the document within a single quoted scalar") : (e.position++, i = e.position);
  L(e, "unexpected end of the stream within a single quoted scalar");
}
function $0(e, t) {
  var r, n, i, o, s, a;
  if (a = e.input.charCodeAt(e.position), a !== 34)
    return !1;
  for (e.kind = "scalar", e.result = "", e.position++, r = n = e.position; (a = e.input.charCodeAt(e.position)) !== 0; ) {
    if (a === 34)
      return ht(e, r, e.position, !0), e.position++, !0;
    if (a === 92) {
      if (ht(e, r, e.position, !0), a = e.input.charCodeAt(++e.position), Je(a))
        ce(e, !1, t);
      else if (a < 256 && zu[a])
        e.result += Yu[a], e.position++;
      else if ((s = O0(a)) > 0) {
        for (i = s, o = 0; i > 0; i--)
          a = e.input.charCodeAt(++e.position), (s = C0(a)) >= 0 ? o = (o << 4) + s : L(e, "expected hexadecimal character");
        e.result += R0(o), e.position++;
      } else
        L(e, "unknown escape sequence");
      r = n = e.position;
    } else Je(a) ? (ht(e, r, n, !0), ds(e, ce(e, !1, t)), r = n = e.position) : e.position === e.lineStart && ti(e) ? L(e, "unexpected end of the document within a double quoted scalar") : (e.position++, n = e.position);
  }
  L(e, "unexpected end of the stream within a double quoted scalar");
}
function F0(e, t) {
  var r = !0, n, i, o, s = e.tag, a, l = e.anchor, f, c, u, h, m, v = /* @__PURE__ */ Object.create(null), E, S, A, b;
  if (b = e.input.charCodeAt(e.position), b === 91)
    c = 93, m = !1, a = [];
  else if (b === 123)
    c = 125, m = !0, a = {};
  else
    return !1;
  for (e.anchor !== null && (e.anchorMap[e.anchor] = a), b = e.input.charCodeAt(++e.position); b !== 0; ) {
    if (ce(e, !0, t), b = e.input.charCodeAt(e.position), b === c)
      return e.position++, e.tag = s, e.anchor = l, e.kind = m ? "mapping" : "sequence", e.result = a, !0;
    r ? b === 44 && L(e, "expected the node content, but found ','") : L(e, "missed comma between flow collection entries"), S = E = A = null, u = h = !1, b === 63 && (f = e.input.charCodeAt(e.position + 1), $e(f) && (u = h = !0, e.position++, ce(e, !0, t))), n = e.line, i = e.lineStart, o = e.position, sr(e, t, Bn, !1, !0), S = e.tag, E = e.result, ce(e, !0, t), b = e.input.charCodeAt(e.position), (h || e.line === n) && b === 58 && (u = !0, b = e.input.charCodeAt(++e.position), ce(e, !0, t), sr(e, t, Bn, !1, !0), A = e.result), m ? Kt(e, a, v, S, E, A, n, i, o) : u ? a.push(Kt(e, null, v, S, E, A, n, i, o)) : a.push(E), ce(e, !0, t), b = e.input.charCodeAt(e.position), b === 44 ? (r = !0, b = e.input.charCodeAt(++e.position)) : r = !1;
  }
  L(e, "unexpected end of the stream within a flow collection");
}
function x0(e, t) {
  var r, n, i = Ui, o = !1, s = !1, a = t, l = 0, f = !1, c, u;
  if (u = e.input.charCodeAt(e.position), u === 124)
    n = !1;
  else if (u === 62)
    n = !0;
  else
    return !1;
  for (e.kind = "scalar", e.result = ""; u !== 0; )
    if (u = e.input.charCodeAt(++e.position), u === 43 || u === 45)
      Ui === i ? i = u === 43 ? Ta : S0 : L(e, "repeat of a chomping mode identifier");
    else if ((c = P0(u)) >= 0)
      c === 0 ? L(e, "bad explicit indentation width of a block scalar; it cannot be less than one") : s ? L(e, "repeat of an indentation width identifier") : (a = t + c - 1, s = !0);
    else
      break;
  if (Ft(u)) {
    do
      u = e.input.charCodeAt(++e.position);
    while (Ft(u));
    if (u === 35)
      do
        u = e.input.charCodeAt(++e.position);
      while (!Je(u) && u !== 0);
  }
  for (; u !== 0; ) {
    for (fs(e), e.lineIndent = 0, u = e.input.charCodeAt(e.position); (!s || e.lineIndent < a) && u === 32; )
      e.lineIndent++, u = e.input.charCodeAt(++e.position);
    if (!s && e.lineIndent > a && (a = e.lineIndent), Je(u)) {
      l++;
      continue;
    }
    if (e.lineIndent < a) {
      i === Ta ? e.result += Dt.repeat(`
`, o ? 1 + l : l) : i === Ui && o && (e.result += `
`);
      break;
    }
    for (n ? Ft(u) ? (f = !0, e.result += Dt.repeat(`
`, o ? 1 + l : l)) : f ? (f = !1, e.result += Dt.repeat(`
`, l + 1)) : l === 0 ? o && (e.result += " ") : e.result += Dt.repeat(`
`, l) : e.result += Dt.repeat(`
`, o ? 1 + l : l), o = !0, s = !0, l = 0, r = e.position; !Je(u) && u !== 0; )
      u = e.input.charCodeAt(++e.position);
    ht(e, r, e.position, !1);
  }
  return !0;
}
function Ia(e, t) {
  var r, n = e.tag, i = e.anchor, o = [], s, a = !1, l;
  if (e.firstTabInLine !== -1) return !1;
  for (e.anchor !== null && (e.anchorMap[e.anchor] = o), l = e.input.charCodeAt(e.position); l !== 0 && (e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, L(e, "tab characters must not be used in indentation")), !(l !== 45 || (s = e.input.charCodeAt(e.position + 1), !$e(s)))); ) {
    if (a = !0, e.position++, ce(e, !0, -1) && e.lineIndent <= t) {
      o.push(null), l = e.input.charCodeAt(e.position);
      continue;
    }
    if (r = e.line, sr(e, t, Hu, !1, !0), o.push(e.result), ce(e, !0, -1), l = e.input.charCodeAt(e.position), (e.line === r || e.lineIndent > t) && l !== 0)
      L(e, "bad indentation of a sequence entry");
    else if (e.lineIndent < t)
      break;
  }
  return a ? (e.tag = n, e.anchor = i, e.kind = "sequence", e.result = o, !0) : !1;
}
function L0(e, t, r) {
  var n, i, o, s, a, l, f = e.tag, c = e.anchor, u = {}, h = /* @__PURE__ */ Object.create(null), m = null, v = null, E = null, S = !1, A = !1, b;
  if (e.firstTabInLine !== -1) return !1;
  for (e.anchor !== null && (e.anchorMap[e.anchor] = u), b = e.input.charCodeAt(e.position); b !== 0; ) {
    if (!S && e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, L(e, "tab characters must not be used in indentation")), n = e.input.charCodeAt(e.position + 1), o = e.line, (b === 63 || b === 58) && $e(n))
      b === 63 ? (S && (Kt(e, u, h, m, v, null, s, a, l), m = v = E = null), A = !0, S = !0, i = !0) : S ? (S = !1, i = !0) : L(e, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"), e.position += 1, b = n;
    else {
      if (s = e.line, a = e.lineStart, l = e.position, !sr(e, r, qu, !1, !0))
        break;
      if (e.line === o) {
        for (b = e.input.charCodeAt(e.position); Ft(b); )
          b = e.input.charCodeAt(++e.position);
        if (b === 58)
          b = e.input.charCodeAt(++e.position), $e(b) || L(e, "a whitespace character is expected after the key-value separator within a block mapping"), S && (Kt(e, u, h, m, v, null, s, a, l), m = v = E = null), A = !0, S = !1, i = !1, m = e.tag, v = e.result;
        else if (A)
          L(e, "can not read an implicit mapping pair; a colon is missed");
        else
          return e.tag = f, e.anchor = c, !0;
      } else if (A)
        L(e, "can not read a block mapping entry; a multiline key may not be an implicit key");
      else
        return e.tag = f, e.anchor = c, !0;
    }
    if ((e.line === o || e.lineIndent > t) && (S && (s = e.line, a = e.lineStart, l = e.position), sr(e, t, qn, !0, i) && (S ? v = e.result : E = e.result), S || (Kt(e, u, h, m, v, E, s, a, l), m = v = E = null), ce(e, !0, -1), b = e.input.charCodeAt(e.position)), (e.line === o || e.lineIndent > t) && b !== 0)
      L(e, "bad indentation of a mapping entry");
    else if (e.lineIndent < t)
      break;
  }
  return S && Kt(e, u, h, m, v, null, s, a, l), A && (e.tag = f, e.anchor = c, e.kind = "mapping", e.result = u), A;
}
function U0(e) {
  var t, r = !1, n = !1, i, o, s;
  if (s = e.input.charCodeAt(e.position), s !== 33) return !1;
  if (e.tag !== null && L(e, "duplication of a tag property"), s = e.input.charCodeAt(++e.position), s === 60 ? (r = !0, s = e.input.charCodeAt(++e.position)) : s === 33 ? (n = !0, i = "!!", s = e.input.charCodeAt(++e.position)) : i = "!", t = e.position, r) {
    do
      s = e.input.charCodeAt(++e.position);
    while (s !== 0 && s !== 62);
    e.position < e.length ? (o = e.input.slice(t, e.position), s = e.input.charCodeAt(++e.position)) : L(e, "unexpected end of the stream within a verbatim tag");
  } else {
    for (; s !== 0 && !$e(s); )
      s === 33 && (n ? L(e, "tag suffix cannot contain exclamation marks") : (i = e.input.slice(t - 1, e.position + 1), Gu.test(i) || L(e, "named tag handle cannot contain such characters"), n = !0, t = e.position + 1)), s = e.input.charCodeAt(++e.position);
    o = e.input.slice(t, e.position), T0.test(o) && L(e, "tag suffix cannot contain flow indicator characters");
  }
  o && !Wu.test(o) && L(e, "tag name cannot contain such characters: " + o);
  try {
    o = decodeURIComponent(o);
  } catch {
    L(e, "tag name is malformed: " + o);
  }
  return r ? e.tag = o : yt.call(e.tagMap, i) ? e.tag = e.tagMap[i] + o : i === "!" ? e.tag = "!" + o : i === "!!" ? e.tag = "tag:yaml.org,2002:" + o : L(e, 'undeclared tag handle "' + i + '"'), !0;
}
function k0(e) {
  var t, r;
  if (r = e.input.charCodeAt(e.position), r !== 38) return !1;
  for (e.anchor !== null && L(e, "duplication of an anchor property"), r = e.input.charCodeAt(++e.position), t = e.position; r !== 0 && !$e(r) && !Jt(r); )
    r = e.input.charCodeAt(++e.position);
  return e.position === t && L(e, "name of an anchor node must contain at least one character"), e.anchor = e.input.slice(t, e.position), !0;
}
function M0(e) {
  var t, r, n;
  if (n = e.input.charCodeAt(e.position), n !== 42) return !1;
  for (n = e.input.charCodeAt(++e.position), t = e.position; n !== 0 && !$e(n) && !Jt(n); )
    n = e.input.charCodeAt(++e.position);
  return e.position === t && L(e, "name of an alias node must contain at least one character"), r = e.input.slice(t, e.position), yt.call(e.anchorMap, r) || L(e, 'unidentified alias "' + r + '"'), e.result = e.anchorMap[r], ce(e, !0, -1), !0;
}
function sr(e, t, r, n, i) {
  var o, s, a, l = 1, f = !1, c = !1, u, h, m, v, E, S;
  if (e.listener !== null && e.listener("open", e), e.tag = null, e.anchor = null, e.kind = null, e.result = null, o = s = a = qn === r || Hu === r, n && ce(e, !0, -1) && (f = !0, e.lineIndent > t ? l = 1 : e.lineIndent === t ? l = 0 : e.lineIndent < t && (l = -1)), l === 1)
    for (; U0(e) || k0(e); )
      ce(e, !0, -1) ? (f = !0, a = o, e.lineIndent > t ? l = 1 : e.lineIndent === t ? l = 0 : e.lineIndent < t && (l = -1)) : a = !1;
  if (a && (a = f || i), (l === 1 || qn === r) && (Bn === r || qu === r ? E = t : E = t + 1, S = e.position - e.lineStart, l === 1 ? a && (Ia(e, S) || L0(e, S, E)) || F0(e, E) ? c = !0 : (s && x0(e, E) || N0(e, E) || $0(e, E) ? c = !0 : M0(e) ? (c = !0, (e.tag !== null || e.anchor !== null) && L(e, "alias node should not have any properties")) : D0(e, E, Bn === r) && (c = !0, e.tag === null && (e.tag = "?")), e.anchor !== null && (e.anchorMap[e.anchor] = e.result)) : l === 0 && (c = a && Ia(e, S))), e.tag === null)
    e.anchor !== null && (e.anchorMap[e.anchor] = e.result);
  else if (e.tag === "?") {
    for (e.result !== null && e.kind !== "scalar" && L(e, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + e.kind + '"'), u = 0, h = e.implicitTypes.length; u < h; u += 1)
      if (v = e.implicitTypes[u], v.resolve(e.result)) {
        e.result = v.construct(e.result), e.tag = v.tag, e.anchor !== null && (e.anchorMap[e.anchor] = e.result);
        break;
      }
  } else if (e.tag !== "!") {
    if (yt.call(e.typeMap[e.kind || "fallback"], e.tag))
      v = e.typeMap[e.kind || "fallback"][e.tag];
    else
      for (v = null, m = e.typeMap.multi[e.kind || "fallback"], u = 0, h = m.length; u < h; u += 1)
        if (e.tag.slice(0, m[u].tag.length) === m[u].tag) {
          v = m[u];
          break;
        }
    v || L(e, "unknown tag !<" + e.tag + ">"), e.result !== null && v.kind !== e.kind && L(e, "unacceptable node kind for !<" + e.tag + '> tag; it should be "' + v.kind + '", not "' + e.kind + '"'), v.resolve(e.result, e.tag) ? (e.result = v.construct(e.result, e.tag), e.anchor !== null && (e.anchorMap[e.anchor] = e.result)) : L(e, "cannot resolve a node with !<" + e.tag + "> explicit tag");
  }
  return e.listener !== null && e.listener("close", e), e.tag !== null || e.anchor !== null || c;
}
function j0(e) {
  var t = e.position, r, n, i, o = !1, s;
  for (e.version = null, e.checkLineBreaks = e.legacy, e.tagMap = /* @__PURE__ */ Object.create(null), e.anchorMap = /* @__PURE__ */ Object.create(null); (s = e.input.charCodeAt(e.position)) !== 0 && (ce(e, !0, -1), s = e.input.charCodeAt(e.position), !(e.lineIndent > 0 || s !== 37)); ) {
    for (o = !0, s = e.input.charCodeAt(++e.position), r = e.position; s !== 0 && !$e(s); )
      s = e.input.charCodeAt(++e.position);
    for (n = e.input.slice(r, e.position), i = [], n.length < 1 && L(e, "directive name must not be less than one character in length"); s !== 0; ) {
      for (; Ft(s); )
        s = e.input.charCodeAt(++e.position);
      if (s === 35) {
        do
          s = e.input.charCodeAt(++e.position);
        while (s !== 0 && !Je(s));
        break;
      }
      if (Je(s)) break;
      for (r = e.position; s !== 0 && !$e(s); )
        s = e.input.charCodeAt(++e.position);
      i.push(e.input.slice(r, e.position));
    }
    s !== 0 && fs(e), yt.call(Pa, n) ? Pa[n](e, n, i) : Hn(e, 'unknown document directive "' + n + '"');
  }
  if (ce(e, !0, -1), e.lineIndent === 0 && e.input.charCodeAt(e.position) === 45 && e.input.charCodeAt(e.position + 1) === 45 && e.input.charCodeAt(e.position + 2) === 45 ? (e.position += 3, ce(e, !0, -1)) : o && L(e, "directives end mark is expected"), sr(e, e.lineIndent - 1, qn, !1, !0), ce(e, !0, -1), e.checkLineBreaks && b0.test(e.input.slice(t, e.position)) && Hn(e, "non-ASCII line breaks are interpreted as content"), e.documents.push(e.result), e.position === e.lineStart && ti(e)) {
    e.input.charCodeAt(e.position) === 46 && (e.position += 3, ce(e, !0, -1));
    return;
  }
  if (e.position < e.length - 1)
    L(e, "end of the stream or a document separator is expected");
  else
    return;
}
function Ju(e, t) {
  e = String(e), t = t || {}, e.length !== 0 && (e.charCodeAt(e.length - 1) !== 10 && e.charCodeAt(e.length - 1) !== 13 && (e += `
`), e.charCodeAt(0) === 65279 && (e = e.slice(1)));
  var r = new I0(e, t), n = e.indexOf("\0");
  for (n !== -1 && (r.position = n, L(r, "null byte is not allowed in input")), r.input += "\0"; r.input.charCodeAt(r.position) === 32; )
    r.lineIndent += 1, r.position += 1;
  for (; r.position < r.length - 1; )
    j0(r);
  return r.documents;
}
function B0(e, t, r) {
  t !== null && typeof t == "object" && typeof r > "u" && (r = t, t = null);
  var n = Ju(e, r);
  if (typeof t != "function")
    return n;
  for (var i = 0, o = n.length; i < o; i += 1)
    t(n[i]);
}
function q0(e, t) {
  var r = Ju(e, t);
  if (r.length !== 0) {
    if (r.length === 1)
      return r[0];
    throw new Bu("expected a single document in the stream, but found more");
  }
}
ls.loadAll = B0;
ls.load = q0;
var Ku = {}, ri = Ge, Kr = Jr, H0 = us, Qu = Object.prototype.toString, Zu = Object.prototype.hasOwnProperty, hs = 65279, G0 = 9, xr = 10, W0 = 13, V0 = 32, z0 = 33, Y0 = 34, Mo = 35, X0 = 37, J0 = 38, K0 = 39, Q0 = 42, ef = 44, Z0 = 45, Gn = 58, ey = 61, ty = 62, ry = 63, ny = 64, tf = 91, rf = 93, iy = 96, nf = 123, oy = 124, of = 125, Ae = {};
Ae[0] = "\\0";
Ae[7] = "\\a";
Ae[8] = "\\b";
Ae[9] = "\\t";
Ae[10] = "\\n";
Ae[11] = "\\v";
Ae[12] = "\\f";
Ae[13] = "\\r";
Ae[27] = "\\e";
Ae[34] = '\\"';
Ae[92] = "\\\\";
Ae[133] = "\\N";
Ae[160] = "\\_";
Ae[8232] = "\\L";
Ae[8233] = "\\P";
var sy = [
  "y",
  "Y",
  "yes",
  "Yes",
  "YES",
  "on",
  "On",
  "ON",
  "n",
  "N",
  "no",
  "No",
  "NO",
  "off",
  "Off",
  "OFF"
], ay = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
function ly(e, t) {
  var r, n, i, o, s, a, l;
  if (t === null) return {};
  for (r = {}, n = Object.keys(t), i = 0, o = n.length; i < o; i += 1)
    s = n[i], a = String(t[s]), s.slice(0, 2) === "!!" && (s = "tag:yaml.org,2002:" + s.slice(2)), l = e.compiledTypeMap.fallback[s], l && Zu.call(l.styleAliases, a) && (a = l.styleAliases[a]), r[s] = a;
  return r;
}
function cy(e) {
  var t, r, n;
  if (t = e.toString(16).toUpperCase(), e <= 255)
    r = "x", n = 2;
  else if (e <= 65535)
    r = "u", n = 4;
  else if (e <= 4294967295)
    r = "U", n = 8;
  else
    throw new Kr("code point within a string may not be greater than 0xFFFFFFFF");
  return "\\" + r + ri.repeat("0", n - t.length) + t;
}
var uy = 1, Lr = 2;
function fy(e) {
  this.schema = e.schema || H0, this.indent = Math.max(1, e.indent || 2), this.noArrayIndent = e.noArrayIndent || !1, this.skipInvalid = e.skipInvalid || !1, this.flowLevel = ri.isNothing(e.flowLevel) ? -1 : e.flowLevel, this.styleMap = ly(this.schema, e.styles || null), this.sortKeys = e.sortKeys || !1, this.lineWidth = e.lineWidth || 80, this.noRefs = e.noRefs || !1, this.noCompatMode = e.noCompatMode || !1, this.condenseFlow = e.condenseFlow || !1, this.quotingType = e.quotingType === '"' ? Lr : uy, this.forceQuotes = e.forceQuotes || !1, this.replacer = typeof e.replacer == "function" ? e.replacer : null, this.implicitTypes = this.schema.compiledImplicit, this.explicitTypes = this.schema.compiledExplicit, this.tag = null, this.result = "", this.duplicates = [], this.usedDuplicates = null;
}
function Da(e, t) {
  for (var r = ri.repeat(" ", t), n = 0, i = -1, o = "", s, a = e.length; n < a; )
    i = e.indexOf(`
`, n), i === -1 ? (s = e.slice(n), n = a) : (s = e.slice(n, i + 1), n = i + 1), s.length && s !== `
` && (o += r), o += s;
  return o;
}
function jo(e, t) {
  return `
` + ri.repeat(" ", e.indent * t);
}
function dy(e, t) {
  var r, n, i;
  for (r = 0, n = e.implicitTypes.length; r < n; r += 1)
    if (i = e.implicitTypes[r], i.resolve(t))
      return !0;
  return !1;
}
function Wn(e) {
  return e === V0 || e === G0;
}
function Ur(e) {
  return 32 <= e && e <= 126 || 161 <= e && e <= 55295 && e !== 8232 && e !== 8233 || 57344 <= e && e <= 65533 && e !== hs || 65536 <= e && e <= 1114111;
}
function Na(e) {
  return Ur(e) && e !== hs && e !== W0 && e !== xr;
}
function $a(e, t, r) {
  var n = Na(e), i = n && !Wn(e);
  return (
    // ns-plain-safe
    (r ? (
      // c = flow-in
      n
    ) : n && e !== ef && e !== tf && e !== rf && e !== nf && e !== of) && e !== Mo && !(t === Gn && !i) || Na(t) && !Wn(t) && e === Mo || t === Gn && i
  );
}
function hy(e) {
  return Ur(e) && e !== hs && !Wn(e) && e !== Z0 && e !== ry && e !== Gn && e !== ef && e !== tf && e !== rf && e !== nf && e !== of && e !== Mo && e !== J0 && e !== Q0 && e !== z0 && e !== oy && e !== ey && e !== ty && e !== K0 && e !== Y0 && e !== X0 && e !== ny && e !== iy;
}
function py(e) {
  return !Wn(e) && e !== Gn;
}
function Ar(e, t) {
  var r = e.charCodeAt(t), n;
  return r >= 55296 && r <= 56319 && t + 1 < e.length && (n = e.charCodeAt(t + 1), n >= 56320 && n <= 57343) ? (r - 55296) * 1024 + n - 56320 + 65536 : r;
}
function sf(e) {
  var t = /^\n* /;
  return t.test(e);
}
var af = 1, Bo = 2, lf = 3, cf = 4, Yt = 5;
function my(e, t, r, n, i, o, s, a) {
  var l, f = 0, c = null, u = !1, h = !1, m = n !== -1, v = -1, E = hy(Ar(e, 0)) && py(Ar(e, e.length - 1));
  if (t || s)
    for (l = 0; l < e.length; f >= 65536 ? l += 2 : l++) {
      if (f = Ar(e, l), !Ur(f))
        return Yt;
      E = E && $a(f, c, a), c = f;
    }
  else {
    for (l = 0; l < e.length; f >= 65536 ? l += 2 : l++) {
      if (f = Ar(e, l), f === xr)
        u = !0, m && (h = h || // Foldable line = too long, and not more-indented.
        l - v - 1 > n && e[v + 1] !== " ", v = l);
      else if (!Ur(f))
        return Yt;
      E = E && $a(f, c, a), c = f;
    }
    h = h || m && l - v - 1 > n && e[v + 1] !== " ";
  }
  return !u && !h ? E && !s && !i(e) ? af : o === Lr ? Yt : Bo : r > 9 && sf(e) ? Yt : s ? o === Lr ? Yt : Bo : h ? cf : lf;
}
function gy(e, t, r, n, i) {
  e.dump = function() {
    if (t.length === 0)
      return e.quotingType === Lr ? '""' : "''";
    if (!e.noCompatMode && (sy.indexOf(t) !== -1 || ay.test(t)))
      return e.quotingType === Lr ? '"' + t + '"' : "'" + t + "'";
    var o = e.indent * Math.max(1, r), s = e.lineWidth === -1 ? -1 : Math.max(Math.min(e.lineWidth, 40), e.lineWidth - o), a = n || e.flowLevel > -1 && r >= e.flowLevel;
    function l(f) {
      return dy(e, f);
    }
    switch (my(
      t,
      a,
      e.indent,
      s,
      l,
      e.quotingType,
      e.forceQuotes && !n,
      i
    )) {
      case af:
        return t;
      case Bo:
        return "'" + t.replace(/'/g, "''") + "'";
      case lf:
        return "|" + Fa(t, e.indent) + xa(Da(t, o));
      case cf:
        return ">" + Fa(t, e.indent) + xa(Da(yy(t, s), o));
      case Yt:
        return '"' + Ey(t) + '"';
      default:
        throw new Kr("impossible error: invalid scalar style");
    }
  }();
}
function Fa(e, t) {
  var r = sf(e) ? String(t) : "", n = e[e.length - 1] === `
`, i = n && (e[e.length - 2] === `
` || e === `
`), o = i ? "+" : n ? "" : "-";
  return r + o + `
`;
}
function xa(e) {
  return e[e.length - 1] === `
` ? e.slice(0, -1) : e;
}
function yy(e, t) {
  for (var r = /(\n+)([^\n]*)/g, n = function() {
    var f = e.indexOf(`
`);
    return f = f !== -1 ? f : e.length, r.lastIndex = f, La(e.slice(0, f), t);
  }(), i = e[0] === `
` || e[0] === " ", o, s; s = r.exec(e); ) {
    var a = s[1], l = s[2];
    o = l[0] === " ", n += a + (!i && !o && l !== "" ? `
` : "") + La(l, t), i = o;
  }
  return n;
}
function La(e, t) {
  if (e === "" || e[0] === " ") return e;
  for (var r = / [^ ]/g, n, i = 0, o, s = 0, a = 0, l = ""; n = r.exec(e); )
    a = n.index, a - i > t && (o = s > i ? s : a, l += `
` + e.slice(i, o), i = o + 1), s = a;
  return l += `
`, e.length - i > t && s > i ? l += e.slice(i, s) + `
` + e.slice(s + 1) : l += e.slice(i), l.slice(1);
}
function Ey(e) {
  for (var t = "", r = 0, n, i = 0; i < e.length; r >= 65536 ? i += 2 : i++)
    r = Ar(e, i), n = Ae[r], !n && Ur(r) ? (t += e[i], r >= 65536 && (t += e[i + 1])) : t += n || cy(r);
  return t;
}
function vy(e, t, r) {
  var n = "", i = e.tag, o, s, a;
  for (o = 0, s = r.length; o < s; o += 1)
    a = r[o], e.replacer && (a = e.replacer.call(r, String(o), a)), (tt(e, t, a, !1, !1) || typeof a > "u" && tt(e, t, null, !1, !1)) && (n !== "" && (n += "," + (e.condenseFlow ? "" : " ")), n += e.dump);
  e.tag = i, e.dump = "[" + n + "]";
}
function Ua(e, t, r, n) {
  var i = "", o = e.tag, s, a, l;
  for (s = 0, a = r.length; s < a; s += 1)
    l = r[s], e.replacer && (l = e.replacer.call(r, String(s), l)), (tt(e, t + 1, l, !0, !0, !1, !0) || typeof l > "u" && tt(e, t + 1, null, !0, !0, !1, !0)) && ((!n || i !== "") && (i += jo(e, t)), e.dump && xr === e.dump.charCodeAt(0) ? i += "-" : i += "- ", i += e.dump);
  e.tag = o, e.dump = i || "[]";
}
function wy(e, t, r) {
  var n = "", i = e.tag, o = Object.keys(r), s, a, l, f, c;
  for (s = 0, a = o.length; s < a; s += 1)
    c = "", n !== "" && (c += ", "), e.condenseFlow && (c += '"'), l = o[s], f = r[l], e.replacer && (f = e.replacer.call(r, l, f)), tt(e, t, l, !1, !1) && (e.dump.length > 1024 && (c += "? "), c += e.dump + (e.condenseFlow ? '"' : "") + ":" + (e.condenseFlow ? "" : " "), tt(e, t, f, !1, !1) && (c += e.dump, n += c));
  e.tag = i, e.dump = "{" + n + "}";
}
function _y(e, t, r, n) {
  var i = "", o = e.tag, s = Object.keys(r), a, l, f, c, u, h;
  if (e.sortKeys === !0)
    s.sort();
  else if (typeof e.sortKeys == "function")
    s.sort(e.sortKeys);
  else if (e.sortKeys)
    throw new Kr("sortKeys must be a boolean or a function");
  for (a = 0, l = s.length; a < l; a += 1)
    h = "", (!n || i !== "") && (h += jo(e, t)), f = s[a], c = r[f], e.replacer && (c = e.replacer.call(r, f, c)), tt(e, t + 1, f, !0, !0, !0) && (u = e.tag !== null && e.tag !== "?" || e.dump && e.dump.length > 1024, u && (e.dump && xr === e.dump.charCodeAt(0) ? h += "?" : h += "? "), h += e.dump, u && (h += jo(e, t)), tt(e, t + 1, c, !0, u) && (e.dump && xr === e.dump.charCodeAt(0) ? h += ":" : h += ": ", h += e.dump, i += h));
  e.tag = o, e.dump = i || "{}";
}
function ka(e, t, r) {
  var n, i, o, s, a, l;
  for (i = r ? e.explicitTypes : e.implicitTypes, o = 0, s = i.length; o < s; o += 1)
    if (a = i[o], (a.instanceOf || a.predicate) && (!a.instanceOf || typeof t == "object" && t instanceof a.instanceOf) && (!a.predicate || a.predicate(t))) {
      if (r ? a.multi && a.representName ? e.tag = a.representName(t) : e.tag = a.tag : e.tag = "?", a.represent) {
        if (l = e.styleMap[a.tag] || a.defaultStyle, Qu.call(a.represent) === "[object Function]")
          n = a.represent(t, l);
        else if (Zu.call(a.represent, l))
          n = a.represent[l](t, l);
        else
          throw new Kr("!<" + a.tag + '> tag resolver accepts not "' + l + '" style');
        e.dump = n;
      }
      return !0;
    }
  return !1;
}
function tt(e, t, r, n, i, o, s) {
  e.tag = null, e.dump = r, ka(e, r, !1) || ka(e, r, !0);
  var a = Qu.call(e.dump), l = n, f;
  n && (n = e.flowLevel < 0 || e.flowLevel > t);
  var c = a === "[object Object]" || a === "[object Array]", u, h;
  if (c && (u = e.duplicates.indexOf(r), h = u !== -1), (e.tag !== null && e.tag !== "?" || h || e.indent !== 2 && t > 0) && (i = !1), h && e.usedDuplicates[u])
    e.dump = "*ref_" + u;
  else {
    if (c && h && !e.usedDuplicates[u] && (e.usedDuplicates[u] = !0), a === "[object Object]")
      n && Object.keys(e.dump).length !== 0 ? (_y(e, t, e.dump, i), h && (e.dump = "&ref_" + u + e.dump)) : (wy(e, t, e.dump), h && (e.dump = "&ref_" + u + " " + e.dump));
    else if (a === "[object Array]")
      n && e.dump.length !== 0 ? (e.noArrayIndent && !s && t > 0 ? Ua(e, t - 1, e.dump, i) : Ua(e, t, e.dump, i), h && (e.dump = "&ref_" + u + e.dump)) : (vy(e, t, e.dump), h && (e.dump = "&ref_" + u + " " + e.dump));
    else if (a === "[object String]")
      e.tag !== "?" && gy(e, e.dump, t, o, l);
    else {
      if (a === "[object Undefined]")
        return !1;
      if (e.skipInvalid) return !1;
      throw new Kr("unacceptable kind of an object to dump " + a);
    }
    e.tag !== null && e.tag !== "?" && (f = encodeURI(
      e.tag[0] === "!" ? e.tag.slice(1) : e.tag
    ).replace(/!/g, "%21"), e.tag[0] === "!" ? f = "!" + f : f.slice(0, 18) === "tag:yaml.org,2002:" ? f = "!!" + f.slice(18) : f = "!<" + f + ">", e.dump = f + " " + e.dump);
  }
  return !0;
}
function Sy(e, t) {
  var r = [], n = [], i, o;
  for (qo(e, r, n), i = 0, o = n.length; i < o; i += 1)
    t.duplicates.push(r[n[i]]);
  t.usedDuplicates = new Array(o);
}
function qo(e, t, r) {
  var n, i, o;
  if (e !== null && typeof e == "object")
    if (i = t.indexOf(e), i !== -1)
      r.indexOf(i) === -1 && r.push(i);
    else if (t.push(e), Array.isArray(e))
      for (i = 0, o = e.length; i < o; i += 1)
        qo(e[i], t, r);
    else
      for (n = Object.keys(e), i = 0, o = n.length; i < o; i += 1)
        qo(e[n[i]], t, r);
}
function Ay(e, t) {
  t = t || {};
  var r = new fy(t);
  r.noRefs || Sy(e, r);
  var n = e;
  return r.replacer && (n = r.replacer.call({ "": n }, "", n)), tt(r, 0, n, !0, !0) ? r.dump + `
` : "";
}
Ku.dump = Ay;
var uf = ls, by = Ku;
function ps(e, t) {
  return function() {
    throw new Error("Function yaml." + e + " is removed in js-yaml 4. Use yaml." + t + " instead, which is now safe by default.");
  };
}
ve.Type = Ie;
ve.Schema = _u;
ve.FAILSAFE_SCHEMA = Tu;
ve.JSON_SCHEMA = Du;
ve.CORE_SCHEMA = Nu;
ve.DEFAULT_SCHEMA = us;
ve.load = uf.load;
ve.loadAll = uf.loadAll;
ve.dump = by.dump;
ve.YAMLException = Jr;
ve.types = {
  binary: Uu,
  float: Iu,
  map: bu,
  null: Cu,
  pairs: Mu,
  set: ju,
  timestamp: xu,
  bool: Ou,
  int: Pu,
  merge: Lu,
  omap: ku,
  seq: Au,
  str: Su
};
ve.safeLoad = ps("safeLoad", "load");
ve.safeLoadAll = ps("safeLoadAll", "loadAll");
ve.safeDump = ps("safeDump", "dump");
var ni = {};
Object.defineProperty(ni, "__esModule", { value: !0 });
ni.Lazy = void 0;
class Ty {
  constructor(t) {
    this._value = null, this.creator = t;
  }
  get hasValue() {
    return this.creator == null;
  }
  get value() {
    if (this.creator == null)
      return this._value;
    const t = this.creator();
    return this.value = t, t;
  }
  set value(t) {
    this._value = t, this.creator = null;
  }
}
ni.Lazy = Ty;
var Ho = { exports: {} };
const Cy = "2.0.0", ff = 256, Oy = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
9007199254740991, Py = 16, Ry = ff - 6, Iy = [
  "major",
  "premajor",
  "minor",
  "preminor",
  "patch",
  "prepatch",
  "prerelease"
];
var ii = {
  MAX_LENGTH: ff,
  MAX_SAFE_COMPONENT_LENGTH: Py,
  MAX_SAFE_BUILD_LENGTH: Ry,
  MAX_SAFE_INTEGER: Oy,
  RELEASE_TYPES: Iy,
  SEMVER_SPEC_VERSION: Cy,
  FLAG_INCLUDE_PRERELEASE: 1,
  FLAG_LOOSE: 2
};
const Dy = typeof process == "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...e) => console.error("SEMVER", ...e) : () => {
};
var oi = Dy;
(function(e, t) {
  const {
    MAX_SAFE_COMPONENT_LENGTH: r,
    MAX_SAFE_BUILD_LENGTH: n,
    MAX_LENGTH: i
  } = ii, o = oi;
  t = e.exports = {};
  const s = t.re = [], a = t.safeRe = [], l = t.src = [], f = t.safeSrc = [], c = t.t = {};
  let u = 0;
  const h = "[a-zA-Z0-9-]", m = [
    ["\\s", 1],
    ["\\d", i],
    [h, n]
  ], v = (S) => {
    for (const [A, b] of m)
      S = S.split(`${A}*`).join(`${A}{0,${b}}`).split(`${A}+`).join(`${A}{1,${b}}`);
    return S;
  }, E = (S, A, b) => {
    const N = v(A), x = u++;
    o(S, x, A), c[S] = x, l[x] = A, f[x] = N, s[x] = new RegExp(A, b ? "g" : void 0), a[x] = new RegExp(N, b ? "g" : void 0);
  };
  E("NUMERICIDENTIFIER", "0|[1-9]\\d*"), E("NUMERICIDENTIFIERLOOSE", "\\d+"), E("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${h}*`), E("MAINVERSION", `(${l[c.NUMERICIDENTIFIER]})\\.(${l[c.NUMERICIDENTIFIER]})\\.(${l[c.NUMERICIDENTIFIER]})`), E("MAINVERSIONLOOSE", `(${l[c.NUMERICIDENTIFIERLOOSE]})\\.(${l[c.NUMERICIDENTIFIERLOOSE]})\\.(${l[c.NUMERICIDENTIFIERLOOSE]})`), E("PRERELEASEIDENTIFIER", `(?:${l[c.NONNUMERICIDENTIFIER]}|${l[c.NUMERICIDENTIFIER]})`), E("PRERELEASEIDENTIFIERLOOSE", `(?:${l[c.NONNUMERICIDENTIFIER]}|${l[c.NUMERICIDENTIFIERLOOSE]})`), E("PRERELEASE", `(?:-(${l[c.PRERELEASEIDENTIFIER]}(?:\\.${l[c.PRERELEASEIDENTIFIER]})*))`), E("PRERELEASELOOSE", `(?:-?(${l[c.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${l[c.PRERELEASEIDENTIFIERLOOSE]})*))`), E("BUILDIDENTIFIER", `${h}+`), E("BUILD", `(?:\\+(${l[c.BUILDIDENTIFIER]}(?:\\.${l[c.BUILDIDENTIFIER]})*))`), E("FULLPLAIN", `v?${l[c.MAINVERSION]}${l[c.PRERELEASE]}?${l[c.BUILD]}?`), E("FULL", `^${l[c.FULLPLAIN]}$`), E("LOOSEPLAIN", `[v=\\s]*${l[c.MAINVERSIONLOOSE]}${l[c.PRERELEASELOOSE]}?${l[c.BUILD]}?`), E("LOOSE", `^${l[c.LOOSEPLAIN]}$`), E("GTLT", "((?:<|>)?=?)"), E("XRANGEIDENTIFIERLOOSE", `${l[c.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`), E("XRANGEIDENTIFIER", `${l[c.NUMERICIDENTIFIER]}|x|X|\\*`), E("XRANGEPLAIN", `[v=\\s]*(${l[c.XRANGEIDENTIFIER]})(?:\\.(${l[c.XRANGEIDENTIFIER]})(?:\\.(${l[c.XRANGEIDENTIFIER]})(?:${l[c.PRERELEASE]})?${l[c.BUILD]}?)?)?`), E("XRANGEPLAINLOOSE", `[v=\\s]*(${l[c.XRANGEIDENTIFIERLOOSE]})(?:\\.(${l[c.XRANGEIDENTIFIERLOOSE]})(?:\\.(${l[c.XRANGEIDENTIFIERLOOSE]})(?:${l[c.PRERELEASELOOSE]})?${l[c.BUILD]}?)?)?`), E("XRANGE", `^${l[c.GTLT]}\\s*${l[c.XRANGEPLAIN]}$`), E("XRANGELOOSE", `^${l[c.GTLT]}\\s*${l[c.XRANGEPLAINLOOSE]}$`), E("COERCEPLAIN", `(^|[^\\d])(\\d{1,${r}})(?:\\.(\\d{1,${r}}))?(?:\\.(\\d{1,${r}}))?`), E("COERCE", `${l[c.COERCEPLAIN]}(?:$|[^\\d])`), E("COERCEFULL", l[c.COERCEPLAIN] + `(?:${l[c.PRERELEASE]})?(?:${l[c.BUILD]})?(?:$|[^\\d])`), E("COERCERTL", l[c.COERCE], !0), E("COERCERTLFULL", l[c.COERCEFULL], !0), E("LONETILDE", "(?:~>?)"), E("TILDETRIM", `(\\s*)${l[c.LONETILDE]}\\s+`, !0), t.tildeTrimReplace = "$1~", E("TILDE", `^${l[c.LONETILDE]}${l[c.XRANGEPLAIN]}$`), E("TILDELOOSE", `^${l[c.LONETILDE]}${l[c.XRANGEPLAINLOOSE]}$`), E("LONECARET", "(?:\\^)"), E("CARETTRIM", `(\\s*)${l[c.LONECARET]}\\s+`, !0), t.caretTrimReplace = "$1^", E("CARET", `^${l[c.LONECARET]}${l[c.XRANGEPLAIN]}$`), E("CARETLOOSE", `^${l[c.LONECARET]}${l[c.XRANGEPLAINLOOSE]}$`), E("COMPARATORLOOSE", `^${l[c.GTLT]}\\s*(${l[c.LOOSEPLAIN]})$|^$`), E("COMPARATOR", `^${l[c.GTLT]}\\s*(${l[c.FULLPLAIN]})$|^$`), E("COMPARATORTRIM", `(\\s*)${l[c.GTLT]}\\s*(${l[c.LOOSEPLAIN]}|${l[c.XRANGEPLAIN]})`, !0), t.comparatorTrimReplace = "$1$2$3", E("HYPHENRANGE", `^\\s*(${l[c.XRANGEPLAIN]})\\s+-\\s+(${l[c.XRANGEPLAIN]})\\s*$`), E("HYPHENRANGELOOSE", `^\\s*(${l[c.XRANGEPLAINLOOSE]})\\s+-\\s+(${l[c.XRANGEPLAINLOOSE]})\\s*$`), E("STAR", "(<|>)?=?\\s*\\*"), E("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$"), E("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
})(Ho, Ho.exports);
var Qr = Ho.exports;
const Ny = Object.freeze({ loose: !0 }), $y = Object.freeze({}), Fy = (e) => e ? typeof e != "object" ? Ny : e : $y;
var ms = Fy;
const Ma = /^[0-9]+$/, df = (e, t) => {
  if (typeof e == "number" && typeof t == "number")
    return e === t ? 0 : e < t ? -1 : 1;
  const r = Ma.test(e), n = Ma.test(t);
  return r && n && (e = +e, t = +t), e === t ? 0 : r && !n ? -1 : n && !r ? 1 : e < t ? -1 : 1;
}, xy = (e, t) => df(t, e);
var hf = {
  compareIdentifiers: df,
  rcompareIdentifiers: xy
};
const wn = oi, { MAX_LENGTH: ja, MAX_SAFE_INTEGER: _n } = ii, { safeRe: Sn, t: An } = Qr, Ly = ms, { compareIdentifiers: ki } = hf;
let Uy = class Xe {
  constructor(t, r) {
    if (r = Ly(r), t instanceof Xe) {
      if (t.loose === !!r.loose && t.includePrerelease === !!r.includePrerelease)
        return t;
      t = t.version;
    } else if (typeof t != "string")
      throw new TypeError(`Invalid version. Must be a string. Got type "${typeof t}".`);
    if (t.length > ja)
      throw new TypeError(
        `version is longer than ${ja} characters`
      );
    wn("SemVer", t, r), this.options = r, this.loose = !!r.loose, this.includePrerelease = !!r.includePrerelease;
    const n = t.trim().match(r.loose ? Sn[An.LOOSE] : Sn[An.FULL]);
    if (!n)
      throw new TypeError(`Invalid Version: ${t}`);
    if (this.raw = t, this.major = +n[1], this.minor = +n[2], this.patch = +n[3], this.major > _n || this.major < 0)
      throw new TypeError("Invalid major version");
    if (this.minor > _n || this.minor < 0)
      throw new TypeError("Invalid minor version");
    if (this.patch > _n || this.patch < 0)
      throw new TypeError("Invalid patch version");
    n[4] ? this.prerelease = n[4].split(".").map((i) => {
      if (/^[0-9]+$/.test(i)) {
        const o = +i;
        if (o >= 0 && o < _n)
          return o;
      }
      return i;
    }) : this.prerelease = [], this.build = n[5] ? n[5].split(".") : [], this.format();
  }
  format() {
    return this.version = `${this.major}.${this.minor}.${this.patch}`, this.prerelease.length && (this.version += `-${this.prerelease.join(".")}`), this.version;
  }
  toString() {
    return this.version;
  }
  compare(t) {
    if (wn("SemVer.compare", this.version, this.options, t), !(t instanceof Xe)) {
      if (typeof t == "string" && t === this.version)
        return 0;
      t = new Xe(t, this.options);
    }
    return t.version === this.version ? 0 : this.compareMain(t) || this.comparePre(t);
  }
  compareMain(t) {
    return t instanceof Xe || (t = new Xe(t, this.options)), this.major < t.major ? -1 : this.major > t.major ? 1 : this.minor < t.minor ? -1 : this.minor > t.minor ? 1 : this.patch < t.patch ? -1 : this.patch > t.patch ? 1 : 0;
  }
  comparePre(t) {
    if (t instanceof Xe || (t = new Xe(t, this.options)), this.prerelease.length && !t.prerelease.length)
      return -1;
    if (!this.prerelease.length && t.prerelease.length)
      return 1;
    if (!this.prerelease.length && !t.prerelease.length)
      return 0;
    let r = 0;
    do {
      const n = this.prerelease[r], i = t.prerelease[r];
      if (wn("prerelease compare", r, n, i), n === void 0 && i === void 0)
        return 0;
      if (i === void 0)
        return 1;
      if (n === void 0)
        return -1;
      if (n === i)
        continue;
      return ki(n, i);
    } while (++r);
  }
  compareBuild(t) {
    t instanceof Xe || (t = new Xe(t, this.options));
    let r = 0;
    do {
      const n = this.build[r], i = t.build[r];
      if (wn("build compare", r, n, i), n === void 0 && i === void 0)
        return 0;
      if (i === void 0)
        return 1;
      if (n === void 0)
        return -1;
      if (n === i)
        continue;
      return ki(n, i);
    } while (++r);
  }
  // preminor will bump the version up to the next minor release, and immediately
  // down to pre-release. premajor and prepatch work the same way.
  inc(t, r, n) {
    if (t.startsWith("pre")) {
      if (!r && n === !1)
        throw new Error("invalid increment argument: identifier is empty");
      if (r) {
        const i = `-${r}`.match(this.options.loose ? Sn[An.PRERELEASELOOSE] : Sn[An.PRERELEASE]);
        if (!i || i[1] !== r)
          throw new Error(`invalid identifier: ${r}`);
      }
    }
    switch (t) {
      case "premajor":
        this.prerelease.length = 0, this.patch = 0, this.minor = 0, this.major++, this.inc("pre", r, n);
        break;
      case "preminor":
        this.prerelease.length = 0, this.patch = 0, this.minor++, this.inc("pre", r, n);
        break;
      case "prepatch":
        this.prerelease.length = 0, this.inc("patch", r, n), this.inc("pre", r, n);
        break;
      case "prerelease":
        this.prerelease.length === 0 && this.inc("patch", r, n), this.inc("pre", r, n);
        break;
      case "release":
        if (this.prerelease.length === 0)
          throw new Error(`version ${this.raw} is not a prerelease`);
        this.prerelease.length = 0;
        break;
      case "major":
        (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) && this.major++, this.minor = 0, this.patch = 0, this.prerelease = [];
        break;
      case "minor":
        (this.patch !== 0 || this.prerelease.length === 0) && this.minor++, this.patch = 0, this.prerelease = [];
        break;
      case "patch":
        this.prerelease.length === 0 && this.patch++, this.prerelease = [];
        break;
      case "pre": {
        const i = Number(n) ? 1 : 0;
        if (this.prerelease.length === 0)
          this.prerelease = [i];
        else {
          let o = this.prerelease.length;
          for (; --o >= 0; )
            typeof this.prerelease[o] == "number" && (this.prerelease[o]++, o = -2);
          if (o === -1) {
            if (r === this.prerelease.join(".") && n === !1)
              throw new Error("invalid increment argument: identifier already exists");
            this.prerelease.push(i);
          }
        }
        if (r) {
          let o = [r, i];
          n === !1 && (o = [r]), ki(this.prerelease[0], r) === 0 ? isNaN(this.prerelease[1]) && (this.prerelease = o) : this.prerelease = o;
        }
        break;
      }
      default:
        throw new Error(`invalid increment argument: ${t}`);
    }
    return this.raw = this.format(), this.build.length && (this.raw += `+${this.build.join(".")}`), this;
  }
};
var De = Uy;
const Ba = De, ky = (e, t, r = !1) => {
  if (e instanceof Ba)
    return e;
  try {
    return new Ba(e, t);
  } catch (n) {
    if (!r)
      return null;
    throw n;
  }
};
var ur = ky;
const My = ur, jy = (e, t) => {
  const r = My(e, t);
  return r ? r.version : null;
};
var By = jy;
const qy = ur, Hy = (e, t) => {
  const r = qy(e.trim().replace(/^[=v]+/, ""), t);
  return r ? r.version : null;
};
var Gy = Hy;
const qa = De, Wy = (e, t, r, n, i) => {
  typeof r == "string" && (i = n, n = r, r = void 0);
  try {
    return new qa(
      e instanceof qa ? e.version : e,
      r
    ).inc(t, n, i).version;
  } catch {
    return null;
  }
};
var Vy = Wy;
const Ha = ur, zy = (e, t) => {
  const r = Ha(e, null, !0), n = Ha(t, null, !0), i = r.compare(n);
  if (i === 0)
    return null;
  const o = i > 0, s = o ? r : n, a = o ? n : r, l = !!s.prerelease.length;
  if (!!a.prerelease.length && !l) {
    if (!a.patch && !a.minor)
      return "major";
    if (a.compareMain(s) === 0)
      return a.minor && !a.patch ? "minor" : "patch";
  }
  const c = l ? "pre" : "";
  return r.major !== n.major ? c + "major" : r.minor !== n.minor ? c + "minor" : r.patch !== n.patch ? c + "patch" : "prerelease";
};
var Yy = zy;
const Xy = De, Jy = (e, t) => new Xy(e, t).major;
var Ky = Jy;
const Qy = De, Zy = (e, t) => new Qy(e, t).minor;
var eE = Zy;
const tE = De, rE = (e, t) => new tE(e, t).patch;
var nE = rE;
const iE = ur, oE = (e, t) => {
  const r = iE(e, t);
  return r && r.prerelease.length ? r.prerelease : null;
};
var sE = oE;
const Ga = De, aE = (e, t, r) => new Ga(e, r).compare(new Ga(t, r));
var We = aE;
const lE = We, cE = (e, t, r) => lE(t, e, r);
var uE = cE;
const fE = We, dE = (e, t) => fE(e, t, !0);
var hE = dE;
const Wa = De, pE = (e, t, r) => {
  const n = new Wa(e, r), i = new Wa(t, r);
  return n.compare(i) || n.compareBuild(i);
};
var gs = pE;
const mE = gs, gE = (e, t) => e.sort((r, n) => mE(r, n, t));
var yE = gE;
const EE = gs, vE = (e, t) => e.sort((r, n) => EE(n, r, t));
var wE = vE;
const _E = We, SE = (e, t, r) => _E(e, t, r) > 0;
var si = SE;
const AE = We, bE = (e, t, r) => AE(e, t, r) < 0;
var ys = bE;
const TE = We, CE = (e, t, r) => TE(e, t, r) === 0;
var pf = CE;
const OE = We, PE = (e, t, r) => OE(e, t, r) !== 0;
var mf = PE;
const RE = We, IE = (e, t, r) => RE(e, t, r) >= 0;
var Es = IE;
const DE = We, NE = (e, t, r) => DE(e, t, r) <= 0;
var vs = NE;
const $E = pf, FE = mf, xE = si, LE = Es, UE = ys, kE = vs, ME = (e, t, r, n) => {
  switch (t) {
    case "===":
      return typeof e == "object" && (e = e.version), typeof r == "object" && (r = r.version), e === r;
    case "!==":
      return typeof e == "object" && (e = e.version), typeof r == "object" && (r = r.version), e !== r;
    case "":
    case "=":
    case "==":
      return $E(e, r, n);
    case "!=":
      return FE(e, r, n);
    case ">":
      return xE(e, r, n);
    case ">=":
      return LE(e, r, n);
    case "<":
      return UE(e, r, n);
    case "<=":
      return kE(e, r, n);
    default:
      throw new TypeError(`Invalid operator: ${t}`);
  }
};
var gf = ME;
const jE = De, BE = ur, { safeRe: bn, t: Tn } = Qr, qE = (e, t) => {
  if (e instanceof jE)
    return e;
  if (typeof e == "number" && (e = String(e)), typeof e != "string")
    return null;
  t = t || {};
  let r = null;
  if (!t.rtl)
    r = e.match(t.includePrerelease ? bn[Tn.COERCEFULL] : bn[Tn.COERCE]);
  else {
    const l = t.includePrerelease ? bn[Tn.COERCERTLFULL] : bn[Tn.COERCERTL];
    let f;
    for (; (f = l.exec(e)) && (!r || r.index + r[0].length !== e.length); )
      (!r || f.index + f[0].length !== r.index + r[0].length) && (r = f), l.lastIndex = f.index + f[1].length + f[2].length;
    l.lastIndex = -1;
  }
  if (r === null)
    return null;
  const n = r[2], i = r[3] || "0", o = r[4] || "0", s = t.includePrerelease && r[5] ? `-${r[5]}` : "", a = t.includePrerelease && r[6] ? `+${r[6]}` : "";
  return BE(`${n}.${i}.${o}${s}${a}`, t);
};
var HE = qE;
class GE {
  constructor() {
    this.max = 1e3, this.map = /* @__PURE__ */ new Map();
  }
  get(t) {
    const r = this.map.get(t);
    if (r !== void 0)
      return this.map.delete(t), this.map.set(t, r), r;
  }
  delete(t) {
    return this.map.delete(t);
  }
  set(t, r) {
    if (!this.delete(t) && r !== void 0) {
      if (this.map.size >= this.max) {
        const i = this.map.keys().next().value;
        this.delete(i);
      }
      this.map.set(t, r);
    }
    return this;
  }
}
var WE = GE, Mi, Va;
function Ve() {
  if (Va) return Mi;
  Va = 1;
  const e = /\s+/g;
  class t {
    constructor(O, D) {
      if (D = i(D), O instanceof t)
        return O.loose === !!D.loose && O.includePrerelease === !!D.includePrerelease ? O : new t(O.raw, D);
      if (O instanceof o)
        return this.raw = O.value, this.set = [[O]], this.formatted = void 0, this;
      if (this.options = D, this.loose = !!D.loose, this.includePrerelease = !!D.includePrerelease, this.raw = O.trim().replace(e, " "), this.set = this.raw.split("||").map((C) => this.parseRange(C.trim())).filter((C) => C.length), !this.set.length)
        throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
      if (this.set.length > 1) {
        const C = this.set[0];
        if (this.set = this.set.filter(($) => !E($[0])), this.set.length === 0)
          this.set = [C];
        else if (this.set.length > 1) {
          for (const $ of this.set)
            if ($.length === 1 && S($[0])) {
              this.set = [$];
              break;
            }
        }
      }
      this.formatted = void 0;
    }
    get range() {
      if (this.formatted === void 0) {
        this.formatted = "";
        for (let O = 0; O < this.set.length; O++) {
          O > 0 && (this.formatted += "||");
          const D = this.set[O];
          for (let C = 0; C < D.length; C++)
            C > 0 && (this.formatted += " "), this.formatted += D[C].toString().trim();
        }
      }
      return this.formatted;
    }
    format() {
      return this.range;
    }
    toString() {
      return this.range;
    }
    parseRange(O) {
      const C = ((this.options.includePrerelease && m) | (this.options.loose && v)) + ":" + O, $ = n.get(C);
      if ($)
        return $;
      const I = this.options.loose, k = I ? l[f.HYPHENRANGELOOSE] : l[f.HYPHENRANGE];
      O = O.replace(k, M(this.options.includePrerelease)), s("hyphen replace", O), O = O.replace(l[f.COMPARATORTRIM], c), s("comparator trim", O), O = O.replace(l[f.TILDETRIM], u), s("tilde trim", O), O = O.replace(l[f.CARETTRIM], h), s("caret trim", O);
      let Y = O.split(" ").map((U) => b(U, this.options)).join(" ").split(/\s+/).map((U) => H(U, this.options));
      I && (Y = Y.filter((U) => (s("loose invalid filter", U, this.options), !!U.match(l[f.COMPARATORLOOSE])))), s("range list", Y);
      const G = /* @__PURE__ */ new Map(), ee = Y.map((U) => new o(U, this.options));
      for (const U of ee) {
        if (E(U))
          return [U];
        G.set(U.value, U);
      }
      G.size > 1 && G.has("") && G.delete("");
      const de = [...G.values()];
      return n.set(C, de), de;
    }
    intersects(O, D) {
      if (!(O instanceof t))
        throw new TypeError("a Range is required");
      return this.set.some((C) => A(C, D) && O.set.some(($) => A($, D) && C.every((I) => $.every((k) => I.intersects(k, D)))));
    }
    // if ANY of the sets match ALL of its comparators, then pass
    test(O) {
      if (!O)
        return !1;
      if (typeof O == "string")
        try {
          O = new a(O, this.options);
        } catch {
          return !1;
        }
      for (let D = 0; D < this.set.length; D++)
        if (Z(this.set[D], O, this.options))
          return !0;
      return !1;
    }
  }
  Mi = t;
  const r = WE, n = new r(), i = ms, o = ai(), s = oi, a = De, {
    safeRe: l,
    t: f,
    comparatorTrimReplace: c,
    tildeTrimReplace: u,
    caretTrimReplace: h
  } = Qr, { FLAG_INCLUDE_PRERELEASE: m, FLAG_LOOSE: v } = ii, E = (R) => R.value === "<0.0.0-0", S = (R) => R.value === "", A = (R, O) => {
    let D = !0;
    const C = R.slice();
    let $ = C.pop();
    for (; D && C.length; )
      D = C.every((I) => $.intersects(I, O)), $ = C.pop();
    return D;
  }, b = (R, O) => (R = R.replace(l[f.BUILD], ""), s("comp", R, O), R = q(R, O), s("caret", R), R = x(R, O), s("tildes", R), R = le(R, O), s("xrange", R), R = z(R, O), s("stars", R), R), N = (R) => !R || R.toLowerCase() === "x" || R === "*", x = (R, O) => R.trim().split(/\s+/).map((D) => B(D, O)).join(" "), B = (R, O) => {
    const D = O.loose ? l[f.TILDELOOSE] : l[f.TILDE];
    return R.replace(D, (C, $, I, k, Y) => {
      s("tilde", R, C, $, I, k, Y);
      let G;
      return N($) ? G = "" : N(I) ? G = `>=${$}.0.0 <${+$ + 1}.0.0-0` : N(k) ? G = `>=${$}.${I}.0 <${$}.${+I + 1}.0-0` : Y ? (s("replaceTilde pr", Y), G = `>=${$}.${I}.${k}-${Y} <${$}.${+I + 1}.0-0`) : G = `>=${$}.${I}.${k} <${$}.${+I + 1}.0-0`, s("tilde return", G), G;
    });
  }, q = (R, O) => R.trim().split(/\s+/).map((D) => j(D, O)).join(" "), j = (R, O) => {
    s("caret", R, O);
    const D = O.loose ? l[f.CARETLOOSE] : l[f.CARET], C = O.includePrerelease ? "-0" : "";
    return R.replace(D, ($, I, k, Y, G) => {
      s("caret", R, $, I, k, Y, G);
      let ee;
      return N(I) ? ee = "" : N(k) ? ee = `>=${I}.0.0${C} <${+I + 1}.0.0-0` : N(Y) ? I === "0" ? ee = `>=${I}.${k}.0${C} <${I}.${+k + 1}.0-0` : ee = `>=${I}.${k}.0${C} <${+I + 1}.0.0-0` : G ? (s("replaceCaret pr", G), I === "0" ? k === "0" ? ee = `>=${I}.${k}.${Y}-${G} <${I}.${k}.${+Y + 1}-0` : ee = `>=${I}.${k}.${Y}-${G} <${I}.${+k + 1}.0-0` : ee = `>=${I}.${k}.${Y}-${G} <${+I + 1}.0.0-0`) : (s("no pr"), I === "0" ? k === "0" ? ee = `>=${I}.${k}.${Y}${C} <${I}.${k}.${+Y + 1}-0` : ee = `>=${I}.${k}.${Y}${C} <${I}.${+k + 1}.0-0` : ee = `>=${I}.${k}.${Y} <${+I + 1}.0.0-0`), s("caret return", ee), ee;
    });
  }, le = (R, O) => (s("replaceXRanges", R, O), R.split(/\s+/).map((D) => y(D, O)).join(" ")), y = (R, O) => {
    R = R.trim();
    const D = O.loose ? l[f.XRANGELOOSE] : l[f.XRANGE];
    return R.replace(D, (C, $, I, k, Y, G) => {
      s("xRange", R, C, $, I, k, Y, G);
      const ee = N(I), de = ee || N(k), U = de || N(Y), ze = U;
      return $ === "=" && ze && ($ = ""), G = O.includePrerelease ? "-0" : "", ee ? $ === ">" || $ === "<" ? C = "<0.0.0-0" : C = "*" : $ && ze ? (de && (k = 0), Y = 0, $ === ">" ? ($ = ">=", de ? (I = +I + 1, k = 0, Y = 0) : (k = +k + 1, Y = 0)) : $ === "<=" && ($ = "<", de ? I = +I + 1 : k = +k + 1), $ === "<" && (G = "-0"), C = `${$ + I}.${k}.${Y}${G}`) : de ? C = `>=${I}.0.0${G} <${+I + 1}.0.0-0` : U && (C = `>=${I}.${k}.0${G} <${I}.${+k + 1}.0-0`), s("xRange return", C), C;
    });
  }, z = (R, O) => (s("replaceStars", R, O), R.trim().replace(l[f.STAR], "")), H = (R, O) => (s("replaceGTE0", R, O), R.trim().replace(l[O.includePrerelease ? f.GTE0PRE : f.GTE0], "")), M = (R) => (O, D, C, $, I, k, Y, G, ee, de, U, ze) => (N(C) ? D = "" : N($) ? D = `>=${C}.0.0${R ? "-0" : ""}` : N(I) ? D = `>=${C}.${$}.0${R ? "-0" : ""}` : k ? D = `>=${D}` : D = `>=${D}${R ? "-0" : ""}`, N(ee) ? G = "" : N(de) ? G = `<${+ee + 1}.0.0-0` : N(U) ? G = `<${ee}.${+de + 1}.0-0` : ze ? G = `<=${ee}.${de}.${U}-${ze}` : R ? G = `<${ee}.${de}.${+U + 1}-0` : G = `<=${G}`, `${D} ${G}`.trim()), Z = (R, O, D) => {
    for (let C = 0; C < R.length; C++)
      if (!R[C].test(O))
        return !1;
    if (O.prerelease.length && !D.includePrerelease) {
      for (let C = 0; C < R.length; C++)
        if (s(R[C].semver), R[C].semver !== o.ANY && R[C].semver.prerelease.length > 0) {
          const $ = R[C].semver;
          if ($.major === O.major && $.minor === O.minor && $.patch === O.patch)
            return !0;
        }
      return !1;
    }
    return !0;
  };
  return Mi;
}
var ji, za;
function ai() {
  if (za) return ji;
  za = 1;
  const e = Symbol("SemVer ANY");
  class t {
    static get ANY() {
      return e;
    }
    constructor(c, u) {
      if (u = r(u), c instanceof t) {
        if (c.loose === !!u.loose)
          return c;
        c = c.value;
      }
      c = c.trim().split(/\s+/).join(" "), s("comparator", c, u), this.options = u, this.loose = !!u.loose, this.parse(c), this.semver === e ? this.value = "" : this.value = this.operator + this.semver.version, s("comp", this);
    }
    parse(c) {
      const u = this.options.loose ? n[i.COMPARATORLOOSE] : n[i.COMPARATOR], h = c.match(u);
      if (!h)
        throw new TypeError(`Invalid comparator: ${c}`);
      this.operator = h[1] !== void 0 ? h[1] : "", this.operator === "=" && (this.operator = ""), h[2] ? this.semver = new a(h[2], this.options.loose) : this.semver = e;
    }
    toString() {
      return this.value;
    }
    test(c) {
      if (s("Comparator.test", c, this.options.loose), this.semver === e || c === e)
        return !0;
      if (typeof c == "string")
        try {
          c = new a(c, this.options);
        } catch {
          return !1;
        }
      return o(c, this.operator, this.semver, this.options);
    }
    intersects(c, u) {
      if (!(c instanceof t))
        throw new TypeError("a Comparator is required");
      return this.operator === "" ? this.value === "" ? !0 : new l(c.value, u).test(this.value) : c.operator === "" ? c.value === "" ? !0 : new l(this.value, u).test(c.semver) : (u = r(u), u.includePrerelease && (this.value === "<0.0.0-0" || c.value === "<0.0.0-0") || !u.includePrerelease && (this.value.startsWith("<0.0.0") || c.value.startsWith("<0.0.0")) ? !1 : !!(this.operator.startsWith(">") && c.operator.startsWith(">") || this.operator.startsWith("<") && c.operator.startsWith("<") || this.semver.version === c.semver.version && this.operator.includes("=") && c.operator.includes("=") || o(this.semver, "<", c.semver, u) && this.operator.startsWith(">") && c.operator.startsWith("<") || o(this.semver, ">", c.semver, u) && this.operator.startsWith("<") && c.operator.startsWith(">")));
    }
  }
  ji = t;
  const r = ms, { safeRe: n, t: i } = Qr, o = gf, s = oi, a = De, l = Ve();
  return ji;
}
const VE = Ve(), zE = (e, t, r) => {
  try {
    t = new VE(t, r);
  } catch {
    return !1;
  }
  return t.test(e);
};
var li = zE;
const YE = Ve(), XE = (e, t) => new YE(e, t).set.map((r) => r.map((n) => n.value).join(" ").trim().split(" "));
var JE = XE;
const KE = De, QE = Ve(), ZE = (e, t, r) => {
  let n = null, i = null, o = null;
  try {
    o = new QE(t, r);
  } catch {
    return null;
  }
  return e.forEach((s) => {
    o.test(s) && (!n || i.compare(s) === -1) && (n = s, i = new KE(n, r));
  }), n;
};
var ev = ZE;
const tv = De, rv = Ve(), nv = (e, t, r) => {
  let n = null, i = null, o = null;
  try {
    o = new rv(t, r);
  } catch {
    return null;
  }
  return e.forEach((s) => {
    o.test(s) && (!n || i.compare(s) === 1) && (n = s, i = new tv(n, r));
  }), n;
};
var iv = nv;
const Bi = De, ov = Ve(), Ya = si, sv = (e, t) => {
  e = new ov(e, t);
  let r = new Bi("0.0.0");
  if (e.test(r) || (r = new Bi("0.0.0-0"), e.test(r)))
    return r;
  r = null;
  for (let n = 0; n < e.set.length; ++n) {
    const i = e.set[n];
    let o = null;
    i.forEach((s) => {
      const a = new Bi(s.semver.version);
      switch (s.operator) {
        case ">":
          a.prerelease.length === 0 ? a.patch++ : a.prerelease.push(0), a.raw = a.format();
        case "":
        case ">=":
          (!o || Ya(a, o)) && (o = a);
          break;
        case "<":
        case "<=":
          break;
        default:
          throw new Error(`Unexpected operation: ${s.operator}`);
      }
    }), o && (!r || Ya(r, o)) && (r = o);
  }
  return r && e.test(r) ? r : null;
};
var av = sv;
const lv = Ve(), cv = (e, t) => {
  try {
    return new lv(e, t).range || "*";
  } catch {
    return null;
  }
};
var uv = cv;
const fv = De, yf = ai(), { ANY: dv } = yf, hv = Ve(), pv = li, Xa = si, Ja = ys, mv = vs, gv = Es, yv = (e, t, r, n) => {
  e = new fv(e, n), t = new hv(t, n);
  let i, o, s, a, l;
  switch (r) {
    case ">":
      i = Xa, o = mv, s = Ja, a = ">", l = ">=";
      break;
    case "<":
      i = Ja, o = gv, s = Xa, a = "<", l = "<=";
      break;
    default:
      throw new TypeError('Must provide a hilo val of "<" or ">"');
  }
  if (pv(e, t, n))
    return !1;
  for (let f = 0; f < t.set.length; ++f) {
    const c = t.set[f];
    let u = null, h = null;
    if (c.forEach((m) => {
      m.semver === dv && (m = new yf(">=0.0.0")), u = u || m, h = h || m, i(m.semver, u.semver, n) ? u = m : s(m.semver, h.semver, n) && (h = m);
    }), u.operator === a || u.operator === l || (!h.operator || h.operator === a) && o(e, h.semver))
      return !1;
    if (h.operator === l && s(e, h.semver))
      return !1;
  }
  return !0;
};
var ws = yv;
const Ev = ws, vv = (e, t, r) => Ev(e, t, ">", r);
var wv = vv;
const _v = ws, Sv = (e, t, r) => _v(e, t, "<", r);
var Av = Sv;
const Ka = Ve(), bv = (e, t, r) => (e = new Ka(e, r), t = new Ka(t, r), e.intersects(t, r));
var Tv = bv;
const Cv = li, Ov = We;
var Pv = (e, t, r) => {
  const n = [];
  let i = null, o = null;
  const s = e.sort((c, u) => Ov(c, u, r));
  for (const c of s)
    Cv(c, t, r) ? (o = c, i || (i = c)) : (o && n.push([i, o]), o = null, i = null);
  i && n.push([i, null]);
  const a = [];
  for (const [c, u] of n)
    c === u ? a.push(c) : !u && c === s[0] ? a.push("*") : u ? c === s[0] ? a.push(`<=${u}`) : a.push(`${c} - ${u}`) : a.push(`>=${c}`);
  const l = a.join(" || "), f = typeof t.raw == "string" ? t.raw : String(t);
  return l.length < f.length ? l : t;
};
const Qa = Ve(), _s = ai(), { ANY: qi } = _s, vr = li, Ss = We, Rv = (e, t, r = {}) => {
  if (e === t)
    return !0;
  e = new Qa(e, r), t = new Qa(t, r);
  let n = !1;
  e: for (const i of e.set) {
    for (const o of t.set) {
      const s = Dv(i, o, r);
      if (n = n || s !== null, s)
        continue e;
    }
    if (n)
      return !1;
  }
  return !0;
}, Iv = [new _s(">=0.0.0-0")], Za = [new _s(">=0.0.0")], Dv = (e, t, r) => {
  if (e === t)
    return !0;
  if (e.length === 1 && e[0].semver === qi) {
    if (t.length === 1 && t[0].semver === qi)
      return !0;
    r.includePrerelease ? e = Iv : e = Za;
  }
  if (t.length === 1 && t[0].semver === qi) {
    if (r.includePrerelease)
      return !0;
    t = Za;
  }
  const n = /* @__PURE__ */ new Set();
  let i, o;
  for (const m of e)
    m.operator === ">" || m.operator === ">=" ? i = el(i, m, r) : m.operator === "<" || m.operator === "<=" ? o = tl(o, m, r) : n.add(m.semver);
  if (n.size > 1)
    return null;
  let s;
  if (i && o) {
    if (s = Ss(i.semver, o.semver, r), s > 0)
      return null;
    if (s === 0 && (i.operator !== ">=" || o.operator !== "<="))
      return null;
  }
  for (const m of n) {
    if (i && !vr(m, String(i), r) || o && !vr(m, String(o), r))
      return null;
    for (const v of t)
      if (!vr(m, String(v), r))
        return !1;
    return !0;
  }
  let a, l, f, c, u = o && !r.includePrerelease && o.semver.prerelease.length ? o.semver : !1, h = i && !r.includePrerelease && i.semver.prerelease.length ? i.semver : !1;
  u && u.prerelease.length === 1 && o.operator === "<" && u.prerelease[0] === 0 && (u = !1);
  for (const m of t) {
    if (c = c || m.operator === ">" || m.operator === ">=", f = f || m.operator === "<" || m.operator === "<=", i) {
      if (h && m.semver.prerelease && m.semver.prerelease.length && m.semver.major === h.major && m.semver.minor === h.minor && m.semver.patch === h.patch && (h = !1), m.operator === ">" || m.operator === ">=") {
        if (a = el(i, m, r), a === m && a !== i)
          return !1;
      } else if (i.operator === ">=" && !vr(i.semver, String(m), r))
        return !1;
    }
    if (o) {
      if (u && m.semver.prerelease && m.semver.prerelease.length && m.semver.major === u.major && m.semver.minor === u.minor && m.semver.patch === u.patch && (u = !1), m.operator === "<" || m.operator === "<=") {
        if (l = tl(o, m, r), l === m && l !== o)
          return !1;
      } else if (o.operator === "<=" && !vr(o.semver, String(m), r))
        return !1;
    }
    if (!m.operator && (o || i) && s !== 0)
      return !1;
  }
  return !(i && f && !o && s !== 0 || o && c && !i && s !== 0 || h || u);
}, el = (e, t, r) => {
  if (!e)
    return t;
  const n = Ss(e.semver, t.semver, r);
  return n > 0 ? e : n < 0 || t.operator === ">" && e.operator === ">=" ? t : e;
}, tl = (e, t, r) => {
  if (!e)
    return t;
  const n = Ss(e.semver, t.semver, r);
  return n < 0 ? e : n > 0 || t.operator === "<" && e.operator === "<=" ? t : e;
};
var Nv = Rv;
const Hi = Qr, rl = ii, $v = De, nl = hf, Fv = ur, xv = By, Lv = Gy, Uv = Vy, kv = Yy, Mv = Ky, jv = eE, Bv = nE, qv = sE, Hv = We, Gv = uE, Wv = hE, Vv = gs, zv = yE, Yv = wE, Xv = si, Jv = ys, Kv = pf, Qv = mf, Zv = Es, ew = vs, tw = gf, rw = HE, nw = ai(), iw = Ve(), ow = li, sw = JE, aw = ev, lw = iv, cw = av, uw = uv, fw = ws, dw = wv, hw = Av, pw = Tv, mw = Pv, gw = Nv;
var Ef = {
  parse: Fv,
  valid: xv,
  clean: Lv,
  inc: Uv,
  diff: kv,
  major: Mv,
  minor: jv,
  patch: Bv,
  prerelease: qv,
  compare: Hv,
  rcompare: Gv,
  compareLoose: Wv,
  compareBuild: Vv,
  sort: zv,
  rsort: Yv,
  gt: Xv,
  lt: Jv,
  eq: Kv,
  neq: Qv,
  gte: Zv,
  lte: ew,
  cmp: tw,
  coerce: rw,
  Comparator: nw,
  Range: iw,
  satisfies: ow,
  toComparators: sw,
  maxSatisfying: aw,
  minSatisfying: lw,
  minVersion: cw,
  validRange: uw,
  outside: fw,
  gtr: dw,
  ltr: hw,
  intersects: pw,
  simplifyRange: mw,
  subset: gw,
  SemVer: $v,
  re: Hi.re,
  src: Hi.src,
  tokens: Hi.t,
  SEMVER_SPEC_VERSION: rl.SEMVER_SPEC_VERSION,
  RELEASE_TYPES: rl.RELEASE_TYPES,
  compareIdentifiers: nl.compareIdentifiers,
  rcompareIdentifiers: nl.rcompareIdentifiers
}, Zr = {}, Vn = { exports: {} };
Vn.exports;
(function(e, t) {
  var r = 200, n = "__lodash_hash_undefined__", i = 1, o = 2, s = 9007199254740991, a = "[object Arguments]", l = "[object Array]", f = "[object AsyncFunction]", c = "[object Boolean]", u = "[object Date]", h = "[object Error]", m = "[object Function]", v = "[object GeneratorFunction]", E = "[object Map]", S = "[object Number]", A = "[object Null]", b = "[object Object]", N = "[object Promise]", x = "[object Proxy]", B = "[object RegExp]", q = "[object Set]", j = "[object String]", le = "[object Symbol]", y = "[object Undefined]", z = "[object WeakMap]", H = "[object ArrayBuffer]", M = "[object DataView]", Z = "[object Float32Array]", R = "[object Float64Array]", O = "[object Int8Array]", D = "[object Int16Array]", C = "[object Int32Array]", $ = "[object Uint8Array]", I = "[object Uint8ClampedArray]", k = "[object Uint16Array]", Y = "[object Uint32Array]", G = /[\\^$.*+?()[\]{}|]/g, ee = /^\[object .+?Constructor\]$/, de = /^(?:0|[1-9]\d*)$/, U = {};
  U[Z] = U[R] = U[O] = U[D] = U[C] = U[$] = U[I] = U[k] = U[Y] = !0, U[a] = U[l] = U[H] = U[c] = U[M] = U[u] = U[h] = U[m] = U[E] = U[S] = U[b] = U[B] = U[q] = U[j] = U[z] = !1;
  var ze = typeof Te == "object" && Te && Te.Object === Object && Te, p = typeof self == "object" && self && self.Object === Object && self, d = ze || p || Function("return this")(), T = t && !t.nodeType && t, _ = T && !0 && e && !e.nodeType && e, K = _ && _.exports === T, re = K && ze.process, se = function() {
    try {
      return re && re.binding && re.binding("util");
    } catch {
    }
  }(), ge = se && se.isTypedArray;
  function we(g, w) {
    for (var P = -1, F = g == null ? 0 : g.length, ne = 0, W = []; ++P < F; ) {
      var ae = g[P];
      w(ae, P, g) && (W[ne++] = ae);
    }
    return W;
  }
  function it(g, w) {
    for (var P = -1, F = w.length, ne = g.length; ++P < F; )
      g[ne + P] = w[P];
    return g;
  }
  function ue(g, w) {
    for (var P = -1, F = g == null ? 0 : g.length; ++P < F; )
      if (w(g[P], P, g))
        return !0;
    return !1;
  }
  function Be(g, w) {
    for (var P = -1, F = Array(g); ++P < g; )
      F[P] = w(P);
    return F;
  }
  function Ei(g) {
    return function(w) {
      return g(w);
    };
  }
  function nn(g, w) {
    return g.has(w);
  }
  function dr(g, w) {
    return g == null ? void 0 : g[w];
  }
  function on(g) {
    var w = -1, P = Array(g.size);
    return g.forEach(function(F, ne) {
      P[++w] = [ne, F];
    }), P;
  }
  function Bf(g, w) {
    return function(P) {
      return g(w(P));
    };
  }
  function qf(g) {
    var w = -1, P = Array(g.size);
    return g.forEach(function(F) {
      P[++w] = F;
    }), P;
  }
  var Hf = Array.prototype, Gf = Function.prototype, sn = Object.prototype, vi = d["__core-js_shared__"], Ps = Gf.toString, Ye = sn.hasOwnProperty, Rs = function() {
    var g = /[^.]+$/.exec(vi && vi.keys && vi.keys.IE_PROTO || "");
    return g ? "Symbol(src)_1." + g : "";
  }(), Is = sn.toString, Wf = RegExp(
    "^" + Ps.call(Ye).replace(G, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
  ), Ds = K ? d.Buffer : void 0, an = d.Symbol, Ns = d.Uint8Array, $s = sn.propertyIsEnumerable, Vf = Hf.splice, At = an ? an.toStringTag : void 0, Fs = Object.getOwnPropertySymbols, zf = Ds ? Ds.isBuffer : void 0, Yf = Bf(Object.keys, Object), wi = Bt(d, "DataView"), hr = Bt(d, "Map"), _i = Bt(d, "Promise"), Si = Bt(d, "Set"), Ai = Bt(d, "WeakMap"), pr = Bt(Object, "create"), Xf = Ct(wi), Jf = Ct(hr), Kf = Ct(_i), Qf = Ct(Si), Zf = Ct(Ai), xs = an ? an.prototype : void 0, bi = xs ? xs.valueOf : void 0;
  function bt(g) {
    var w = -1, P = g == null ? 0 : g.length;
    for (this.clear(); ++w < P; ) {
      var F = g[w];
      this.set(F[0], F[1]);
    }
  }
  function ed() {
    this.__data__ = pr ? pr(null) : {}, this.size = 0;
  }
  function td(g) {
    var w = this.has(g) && delete this.__data__[g];
    return this.size -= w ? 1 : 0, w;
  }
  function rd(g) {
    var w = this.__data__;
    if (pr) {
      var P = w[g];
      return P === n ? void 0 : P;
    }
    return Ye.call(w, g) ? w[g] : void 0;
  }
  function nd(g) {
    var w = this.__data__;
    return pr ? w[g] !== void 0 : Ye.call(w, g);
  }
  function id(g, w) {
    var P = this.__data__;
    return this.size += this.has(g) ? 0 : 1, P[g] = pr && w === void 0 ? n : w, this;
  }
  bt.prototype.clear = ed, bt.prototype.delete = td, bt.prototype.get = rd, bt.prototype.has = nd, bt.prototype.set = id;
  function Qe(g) {
    var w = -1, P = g == null ? 0 : g.length;
    for (this.clear(); ++w < P; ) {
      var F = g[w];
      this.set(F[0], F[1]);
    }
  }
  function od() {
    this.__data__ = [], this.size = 0;
  }
  function sd(g) {
    var w = this.__data__, P = cn(w, g);
    if (P < 0)
      return !1;
    var F = w.length - 1;
    return P == F ? w.pop() : Vf.call(w, P, 1), --this.size, !0;
  }
  function ad(g) {
    var w = this.__data__, P = cn(w, g);
    return P < 0 ? void 0 : w[P][1];
  }
  function ld(g) {
    return cn(this.__data__, g) > -1;
  }
  function cd(g, w) {
    var P = this.__data__, F = cn(P, g);
    return F < 0 ? (++this.size, P.push([g, w])) : P[F][1] = w, this;
  }
  Qe.prototype.clear = od, Qe.prototype.delete = sd, Qe.prototype.get = ad, Qe.prototype.has = ld, Qe.prototype.set = cd;
  function Tt(g) {
    var w = -1, P = g == null ? 0 : g.length;
    for (this.clear(); ++w < P; ) {
      var F = g[w];
      this.set(F[0], F[1]);
    }
  }
  function ud() {
    this.size = 0, this.__data__ = {
      hash: new bt(),
      map: new (hr || Qe)(),
      string: new bt()
    };
  }
  function fd(g) {
    var w = un(this, g).delete(g);
    return this.size -= w ? 1 : 0, w;
  }
  function dd(g) {
    return un(this, g).get(g);
  }
  function hd(g) {
    return un(this, g).has(g);
  }
  function pd(g, w) {
    var P = un(this, g), F = P.size;
    return P.set(g, w), this.size += P.size == F ? 0 : 1, this;
  }
  Tt.prototype.clear = ud, Tt.prototype.delete = fd, Tt.prototype.get = dd, Tt.prototype.has = hd, Tt.prototype.set = pd;
  function ln(g) {
    var w = -1, P = g == null ? 0 : g.length;
    for (this.__data__ = new Tt(); ++w < P; )
      this.add(g[w]);
  }
  function md(g) {
    return this.__data__.set(g, n), this;
  }
  function gd(g) {
    return this.__data__.has(g);
  }
  ln.prototype.add = ln.prototype.push = md, ln.prototype.has = gd;
  function ot(g) {
    var w = this.__data__ = new Qe(g);
    this.size = w.size;
  }
  function yd() {
    this.__data__ = new Qe(), this.size = 0;
  }
  function Ed(g) {
    var w = this.__data__, P = w.delete(g);
    return this.size = w.size, P;
  }
  function vd(g) {
    return this.__data__.get(g);
  }
  function wd(g) {
    return this.__data__.has(g);
  }
  function _d(g, w) {
    var P = this.__data__;
    if (P instanceof Qe) {
      var F = P.__data__;
      if (!hr || F.length < r - 1)
        return F.push([g, w]), this.size = ++P.size, this;
      P = this.__data__ = new Tt(F);
    }
    return P.set(g, w), this.size = P.size, this;
  }
  ot.prototype.clear = yd, ot.prototype.delete = Ed, ot.prototype.get = vd, ot.prototype.has = wd, ot.prototype.set = _d;
  function Sd(g, w) {
    var P = fn(g), F = !P && Ud(g), ne = !P && !F && Ti(g), W = !P && !F && !ne && Gs(g), ae = P || F || ne || W, he = ae ? Be(g.length, String) : [], ye = he.length;
    for (var ie in g)
      Ye.call(g, ie) && !(ae && // Safari 9 has enumerable `arguments.length` in strict mode.
      (ie == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
      ne && (ie == "offset" || ie == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
      W && (ie == "buffer" || ie == "byteLength" || ie == "byteOffset") || // Skip index properties.
      Nd(ie, ye))) && he.push(ie);
    return he;
  }
  function cn(g, w) {
    for (var P = g.length; P--; )
      if (js(g[P][0], w))
        return P;
    return -1;
  }
  function Ad(g, w, P) {
    var F = w(g);
    return fn(g) ? F : it(F, P(g));
  }
  function mr(g) {
    return g == null ? g === void 0 ? y : A : At && At in Object(g) ? Id(g) : Ld(g);
  }
  function Ls(g) {
    return gr(g) && mr(g) == a;
  }
  function Us(g, w, P, F, ne) {
    return g === w ? !0 : g == null || w == null || !gr(g) && !gr(w) ? g !== g && w !== w : bd(g, w, P, F, Us, ne);
  }
  function bd(g, w, P, F, ne, W) {
    var ae = fn(g), he = fn(w), ye = ae ? l : st(g), ie = he ? l : st(w);
    ye = ye == a ? b : ye, ie = ie == a ? b : ie;
    var Fe = ye == b, qe = ie == b, _e = ye == ie;
    if (_e && Ti(g)) {
      if (!Ti(w))
        return !1;
      ae = !0, Fe = !1;
    }
    if (_e && !Fe)
      return W || (W = new ot()), ae || Gs(g) ? ks(g, w, P, F, ne, W) : Pd(g, w, ye, P, F, ne, W);
    if (!(P & i)) {
      var Ue = Fe && Ye.call(g, "__wrapped__"), ke = qe && Ye.call(w, "__wrapped__");
      if (Ue || ke) {
        var at = Ue ? g.value() : g, Ze = ke ? w.value() : w;
        return W || (W = new ot()), ne(at, Ze, P, F, W);
      }
    }
    return _e ? (W || (W = new ot()), Rd(g, w, P, F, ne, W)) : !1;
  }
  function Td(g) {
    if (!Hs(g) || Fd(g))
      return !1;
    var w = Bs(g) ? Wf : ee;
    return w.test(Ct(g));
  }
  function Cd(g) {
    return gr(g) && qs(g.length) && !!U[mr(g)];
  }
  function Od(g) {
    if (!xd(g))
      return Yf(g);
    var w = [];
    for (var P in Object(g))
      Ye.call(g, P) && P != "constructor" && w.push(P);
    return w;
  }
  function ks(g, w, P, F, ne, W) {
    var ae = P & i, he = g.length, ye = w.length;
    if (he != ye && !(ae && ye > he))
      return !1;
    var ie = W.get(g);
    if (ie && W.get(w))
      return ie == w;
    var Fe = -1, qe = !0, _e = P & o ? new ln() : void 0;
    for (W.set(g, w), W.set(w, g); ++Fe < he; ) {
      var Ue = g[Fe], ke = w[Fe];
      if (F)
        var at = ae ? F(ke, Ue, Fe, w, g, W) : F(Ue, ke, Fe, g, w, W);
      if (at !== void 0) {
        if (at)
          continue;
        qe = !1;
        break;
      }
      if (_e) {
        if (!ue(w, function(Ze, Ot) {
          if (!nn(_e, Ot) && (Ue === Ze || ne(Ue, Ze, P, F, W)))
            return _e.push(Ot);
        })) {
          qe = !1;
          break;
        }
      } else if (!(Ue === ke || ne(Ue, ke, P, F, W))) {
        qe = !1;
        break;
      }
    }
    return W.delete(g), W.delete(w), qe;
  }
  function Pd(g, w, P, F, ne, W, ae) {
    switch (P) {
      case M:
        if (g.byteLength != w.byteLength || g.byteOffset != w.byteOffset)
          return !1;
        g = g.buffer, w = w.buffer;
      case H:
        return !(g.byteLength != w.byteLength || !W(new Ns(g), new Ns(w)));
      case c:
      case u:
      case S:
        return js(+g, +w);
      case h:
        return g.name == w.name && g.message == w.message;
      case B:
      case j:
        return g == w + "";
      case E:
        var he = on;
      case q:
        var ye = F & i;
        if (he || (he = qf), g.size != w.size && !ye)
          return !1;
        var ie = ae.get(g);
        if (ie)
          return ie == w;
        F |= o, ae.set(g, w);
        var Fe = ks(he(g), he(w), F, ne, W, ae);
        return ae.delete(g), Fe;
      case le:
        if (bi)
          return bi.call(g) == bi.call(w);
    }
    return !1;
  }
  function Rd(g, w, P, F, ne, W) {
    var ae = P & i, he = Ms(g), ye = he.length, ie = Ms(w), Fe = ie.length;
    if (ye != Fe && !ae)
      return !1;
    for (var qe = ye; qe--; ) {
      var _e = he[qe];
      if (!(ae ? _e in w : Ye.call(w, _e)))
        return !1;
    }
    var Ue = W.get(g);
    if (Ue && W.get(w))
      return Ue == w;
    var ke = !0;
    W.set(g, w), W.set(w, g);
    for (var at = ae; ++qe < ye; ) {
      _e = he[qe];
      var Ze = g[_e], Ot = w[_e];
      if (F)
        var Ws = ae ? F(Ot, Ze, _e, w, g, W) : F(Ze, Ot, _e, g, w, W);
      if (!(Ws === void 0 ? Ze === Ot || ne(Ze, Ot, P, F, W) : Ws)) {
        ke = !1;
        break;
      }
      at || (at = _e == "constructor");
    }
    if (ke && !at) {
      var dn = g.constructor, hn = w.constructor;
      dn != hn && "constructor" in g && "constructor" in w && !(typeof dn == "function" && dn instanceof dn && typeof hn == "function" && hn instanceof hn) && (ke = !1);
    }
    return W.delete(g), W.delete(w), ke;
  }
  function Ms(g) {
    return Ad(g, jd, Dd);
  }
  function un(g, w) {
    var P = g.__data__;
    return $d(w) ? P[typeof w == "string" ? "string" : "hash"] : P.map;
  }
  function Bt(g, w) {
    var P = dr(g, w);
    return Td(P) ? P : void 0;
  }
  function Id(g) {
    var w = Ye.call(g, At), P = g[At];
    try {
      g[At] = void 0;
      var F = !0;
    } catch {
    }
    var ne = Is.call(g);
    return F && (w ? g[At] = P : delete g[At]), ne;
  }
  var Dd = Fs ? function(g) {
    return g == null ? [] : (g = Object(g), we(Fs(g), function(w) {
      return $s.call(g, w);
    }));
  } : Bd, st = mr;
  (wi && st(new wi(new ArrayBuffer(1))) != M || hr && st(new hr()) != E || _i && st(_i.resolve()) != N || Si && st(new Si()) != q || Ai && st(new Ai()) != z) && (st = function(g) {
    var w = mr(g), P = w == b ? g.constructor : void 0, F = P ? Ct(P) : "";
    if (F)
      switch (F) {
        case Xf:
          return M;
        case Jf:
          return E;
        case Kf:
          return N;
        case Qf:
          return q;
        case Zf:
          return z;
      }
    return w;
  });
  function Nd(g, w) {
    return w = w ?? s, !!w && (typeof g == "number" || de.test(g)) && g > -1 && g % 1 == 0 && g < w;
  }
  function $d(g) {
    var w = typeof g;
    return w == "string" || w == "number" || w == "symbol" || w == "boolean" ? g !== "__proto__" : g === null;
  }
  function Fd(g) {
    return !!Rs && Rs in g;
  }
  function xd(g) {
    var w = g && g.constructor, P = typeof w == "function" && w.prototype || sn;
    return g === P;
  }
  function Ld(g) {
    return Is.call(g);
  }
  function Ct(g) {
    if (g != null) {
      try {
        return Ps.call(g);
      } catch {
      }
      try {
        return g + "";
      } catch {
      }
    }
    return "";
  }
  function js(g, w) {
    return g === w || g !== g && w !== w;
  }
  var Ud = Ls(/* @__PURE__ */ function() {
    return arguments;
  }()) ? Ls : function(g) {
    return gr(g) && Ye.call(g, "callee") && !$s.call(g, "callee");
  }, fn = Array.isArray;
  function kd(g) {
    return g != null && qs(g.length) && !Bs(g);
  }
  var Ti = zf || qd;
  function Md(g, w) {
    return Us(g, w);
  }
  function Bs(g) {
    if (!Hs(g))
      return !1;
    var w = mr(g);
    return w == m || w == v || w == f || w == x;
  }
  function qs(g) {
    return typeof g == "number" && g > -1 && g % 1 == 0 && g <= s;
  }
  function Hs(g) {
    var w = typeof g;
    return g != null && (w == "object" || w == "function");
  }
  function gr(g) {
    return g != null && typeof g == "object";
  }
  var Gs = ge ? Ei(ge) : Cd;
  function jd(g) {
    return kd(g) ? Sd(g) : Od(g);
  }
  function Bd() {
    return [];
  }
  function qd() {
    return !1;
  }
  e.exports = Md;
})(Vn, Vn.exports);
var yw = Vn.exports;
Object.defineProperty(Zr, "__esModule", { value: !0 });
Zr.DownloadedUpdateHelper = void 0;
Zr.createTempUpdateFile = Sw;
const Ew = Vr, vw = Le, il = yw, Rt = _t, Or = Q;
class ww {
  constructor(t) {
    this.cacheDir = t, this._file = null, this._packageFile = null, this.versionInfo = null, this.fileInfo = null, this._downloadedFileInfo = null;
  }
  get downloadedFileInfo() {
    return this._downloadedFileInfo;
  }
  get file() {
    return this._file;
  }
  get packageFile() {
    return this._packageFile;
  }
  get cacheDirForPendingUpdate() {
    return Or.join(this.cacheDir, "pending");
  }
  async validateDownloadedPath(t, r, n, i) {
    if (this.versionInfo != null && this.file === t && this.fileInfo != null)
      return il(this.versionInfo, r) && il(this.fileInfo.info, n.info) && await (0, Rt.pathExists)(t) ? t : null;
    const o = await this.getValidCachedUpdateFile(n, i);
    return o === null ? null : (i.info(`Update has already been downloaded to ${t}).`), this._file = o, o);
  }
  async setDownloadedFile(t, r, n, i, o, s) {
    this._file = t, this._packageFile = r, this.versionInfo = n, this.fileInfo = i, this._downloadedFileInfo = {
      fileName: o,
      sha512: i.info.sha512,
      isAdminRightsRequired: i.info.isAdminRightsRequired === !0
    }, s && await (0, Rt.outputJson)(this.getUpdateInfoFile(), this._downloadedFileInfo);
  }
  async clear() {
    this._file = null, this._packageFile = null, this.versionInfo = null, this.fileInfo = null, await this.cleanCacheDirForPendingUpdate();
  }
  async cleanCacheDirForPendingUpdate() {
    try {
      await (0, Rt.emptyDir)(this.cacheDirForPendingUpdate);
    } catch {
    }
  }
  /**
   * Returns "update-info.json" which is created in the update cache directory's "pending" subfolder after the first update is downloaded.  If the update file does not exist then the cache is cleared and recreated.  If the update file exists then its properties are validated.
   * @param fileInfo
   * @param logger
   */
  async getValidCachedUpdateFile(t, r) {
    const n = this.getUpdateInfoFile();
    if (!await (0, Rt.pathExists)(n))
      return null;
    let o;
    try {
      o = await (0, Rt.readJson)(n);
    } catch (f) {
      let c = "No cached update info available";
      return f.code !== "ENOENT" && (await this.cleanCacheDirForPendingUpdate(), c += ` (error on read: ${f.message})`), r.info(c), null;
    }
    if (!((o == null ? void 0 : o.fileName) !== null))
      return r.warn("Cached update info is corrupted: no fileName, directory for cached update will be cleaned"), await this.cleanCacheDirForPendingUpdate(), null;
    if (t.info.sha512 !== o.sha512)
      return r.info(`Cached update sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${o.sha512}, expected: ${t.info.sha512}. Directory for cached update will be cleaned`), await this.cleanCacheDirForPendingUpdate(), null;
    const a = Or.join(this.cacheDirForPendingUpdate, o.fileName);
    if (!await (0, Rt.pathExists)(a))
      return r.info("Cached update file doesn't exist"), null;
    const l = await _w(a);
    return t.info.sha512 !== l ? (r.warn(`Sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${l}, expected: ${t.info.sha512}`), await this.cleanCacheDirForPendingUpdate(), null) : (this._downloadedFileInfo = o, a);
  }
  getUpdateInfoFile() {
    return Or.join(this.cacheDirForPendingUpdate, "update-info.json");
  }
}
Zr.DownloadedUpdateHelper = ww;
function _w(e, t = "sha512", r = "base64", n) {
  return new Promise((i, o) => {
    const s = (0, Ew.createHash)(t);
    s.on("error", o).setEncoding(r), (0, vw.createReadStream)(e, {
      ...n,
      highWaterMark: 1024 * 1024
      /* better to use more memory but hash faster */
    }).on("error", o).on("end", () => {
      s.end(), i(s.read());
    }).pipe(s, { end: !1 });
  });
}
async function Sw(e, t, r) {
  let n = 0, i = Or.join(t, e);
  for (let o = 0; o < 3; o++)
    try {
      return await (0, Rt.unlink)(i), i;
    } catch (s) {
      if (s.code === "ENOENT")
        return i;
      r.warn(`Error on remove temp update file: ${s}`), i = Or.join(t, `${n++}-${e}`);
    }
  return i;
}
var ci = {}, As = {};
Object.defineProperty(As, "__esModule", { value: !0 });
As.getAppCacheDir = bw;
const Gi = Q, Aw = wt;
function bw() {
  const e = (0, Aw.homedir)();
  let t;
  return process.platform === "win32" ? t = process.env.LOCALAPPDATA || Gi.join(e, "AppData", "Local") : process.platform === "darwin" ? t = Gi.join(e, "Library", "Caches") : t = process.env.XDG_CACHE_HOME || Gi.join(e, ".cache"), t;
}
Object.defineProperty(ci, "__esModule", { value: !0 });
ci.ElectronAppAdapter = void 0;
const ol = Q, Tw = As;
class Cw {
  constructor(t = pt.app) {
    this.app = t;
  }
  whenReady() {
    return this.app.whenReady();
  }
  get version() {
    return this.app.getVersion();
  }
  get name() {
    return this.app.getName();
  }
  get isPackaged() {
    return this.app.isPackaged === !0;
  }
  get appUpdateConfigPath() {
    return this.isPackaged ? ol.join(process.resourcesPath, "app-update.yml") : ol.join(this.app.getAppPath(), "dev-app-update.yml");
  }
  get userDataPath() {
    return this.app.getPath("userData");
  }
  get baseCachePath() {
    return (0, Tw.getAppCacheDir)();
  }
  quit() {
    this.app.quit();
  }
  relaunch() {
    this.app.relaunch();
  }
  onQuit(t) {
    this.app.once("quit", (r, n) => t(n));
  }
}
ci.ElectronAppAdapter = Cw;
var vf = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.ElectronHttpExecutor = e.NET_SESSION_NAME = void 0, e.getNetSession = r;
  const t = me;
  e.NET_SESSION_NAME = "electron-updater";
  function r() {
    return pt.session.fromPartition(e.NET_SESSION_NAME, {
      cache: !1
    });
  }
  class n extends t.HttpExecutor {
    constructor(o) {
      super(), this.proxyLoginCallback = o, this.cachedSession = null;
    }
    async download(o, s, a) {
      return await a.cancellationToken.createPromise((l, f, c) => {
        const u = {
          headers: a.headers || void 0,
          redirect: "manual"
        };
        (0, t.configureRequestUrl)(o, u), (0, t.configureRequestOptions)(u), this.doDownload(u, {
          destination: s,
          options: a,
          onCancel: c,
          callback: (h) => {
            h == null ? l(s) : f(h);
          },
          responseHandler: null
        }, 0);
      });
    }
    createRequest(o, s) {
      o.headers && o.headers.Host && (o.host = o.headers.Host, delete o.headers.Host), this.cachedSession == null && (this.cachedSession = r());
      const a = pt.net.request({
        ...o,
        session: this.cachedSession
      });
      return a.on("response", s), this.proxyLoginCallback != null && a.on("login", this.proxyLoginCallback), a;
    }
    addRedirectHandlers(o, s, a, l, f) {
      o.on("redirect", (c, u, h) => {
        o.abort(), l > this.maxRedirects ? a(this.createMaxRedirectError()) : f(t.HttpExecutor.prepareRedirectUrlOptions(h, s));
      });
    }
  }
  e.ElectronHttpExecutor = n;
})(vf);
var en = {}, je = {}, Ow = "[object Symbol]", wf = /[\\^$.*+?()[\]{}|]/g, Pw = RegExp(wf.source), Rw = typeof Te == "object" && Te && Te.Object === Object && Te, Iw = typeof self == "object" && self && self.Object === Object && self, Dw = Rw || Iw || Function("return this")(), Nw = Object.prototype, $w = Nw.toString, sl = Dw.Symbol, al = sl ? sl.prototype : void 0, ll = al ? al.toString : void 0;
function Fw(e) {
  if (typeof e == "string")
    return e;
  if (Lw(e))
    return ll ? ll.call(e) : "";
  var t = e + "";
  return t == "0" && 1 / e == -1 / 0 ? "-0" : t;
}
function xw(e) {
  return !!e && typeof e == "object";
}
function Lw(e) {
  return typeof e == "symbol" || xw(e) && $w.call(e) == Ow;
}
function Uw(e) {
  return e == null ? "" : Fw(e);
}
function kw(e) {
  return e = Uw(e), e && Pw.test(e) ? e.replace(wf, "\\$&") : e;
}
var Mw = kw;
Object.defineProperty(je, "__esModule", { value: !0 });
je.newBaseUrl = Bw;
je.newUrlFromBase = Go;
je.getChannelFilename = qw;
je.blockmapFiles = Hw;
const _f = ar, jw = Mw;
function Bw(e) {
  const t = new _f.URL(e);
  return t.pathname.endsWith("/") || (t.pathname += "/"), t;
}
function Go(e, t, r = !1) {
  const n = new _f.URL(e, t), i = t.search;
  return i != null && i.length !== 0 ? n.search = i : r && (n.search = `noCache=${Date.now().toString(32)}`), n;
}
function qw(e) {
  return `${e}.yml`;
}
function Hw(e, t, r) {
  const n = Go(`${e.pathname}.blockmap`, e);
  return [Go(`${e.pathname.replace(new RegExp(jw(r), "g"), t)}.blockmap`, e), n];
}
var fe = {};
Object.defineProperty(fe, "__esModule", { value: !0 });
fe.Provider = void 0;
fe.findFile = Vw;
fe.parseUpdateInfo = zw;
fe.getFileList = Sf;
fe.resolveFiles = Yw;
const Et = me, Gw = ve, cl = je;
class Ww {
  constructor(t) {
    this.runtimeOptions = t, this.requestHeaders = null, this.executor = t.executor;
  }
  get isUseMultipleRangeRequest() {
    return this.runtimeOptions.isUseMultipleRangeRequest !== !1;
  }
  getChannelFilePrefix() {
    if (this.runtimeOptions.platform === "linux") {
      const t = process.env.TEST_UPDATER_ARCH || process.arch;
      return "-linux" + (t === "x64" ? "" : `-${t}`);
    } else
      return this.runtimeOptions.platform === "darwin" ? "-mac" : "";
  }
  // due to historical reasons for windows we use channel name without platform specifier
  getDefaultChannelName() {
    return this.getCustomChannelName("latest");
  }
  getCustomChannelName(t) {
    return `${t}${this.getChannelFilePrefix()}`;
  }
  get fileExtraDownloadHeaders() {
    return null;
  }
  setRequestHeaders(t) {
    this.requestHeaders = t;
  }
  /**
   * Method to perform API request only to resolve update info, but not to download update.
   */
  httpRequest(t, r, n) {
    return this.executor.request(this.createRequestOptions(t, r), n);
  }
  createRequestOptions(t, r) {
    const n = {};
    return this.requestHeaders == null ? r != null && (n.headers = r) : n.headers = r == null ? this.requestHeaders : { ...this.requestHeaders, ...r }, (0, Et.configureRequestUrl)(t, n), n;
  }
}
fe.Provider = Ww;
function Vw(e, t, r) {
  if (e.length === 0)
    throw (0, Et.newError)("No files provided", "ERR_UPDATER_NO_FILES_PROVIDED");
  const n = e.find((i) => i.url.pathname.toLowerCase().endsWith(`.${t}`));
  return n ?? (r == null ? e[0] : e.find((i) => !r.some((o) => i.url.pathname.toLowerCase().endsWith(`.${o}`))));
}
function zw(e, t, r) {
  if (e == null)
    throw (0, Et.newError)(`Cannot parse update info from ${t} in the latest release artifacts (${r}): rawData: null`, "ERR_UPDATER_INVALID_UPDATE_INFO");
  let n;
  try {
    n = (0, Gw.load)(e);
  } catch (i) {
    throw (0, Et.newError)(`Cannot parse update info from ${t} in the latest release artifacts (${r}): ${i.stack || i.message}, rawData: ${e}`, "ERR_UPDATER_INVALID_UPDATE_INFO");
  }
  return n;
}
function Sf(e) {
  const t = e.files;
  if (t != null && t.length > 0)
    return t;
  if (e.path != null)
    return [
      {
        url: e.path,
        sha2: e.sha2,
        sha512: e.sha512
      }
    ];
  throw (0, Et.newError)(`No files provided: ${(0, Et.safeStringifyJson)(e)}`, "ERR_UPDATER_NO_FILES_PROVIDED");
}
function Yw(e, t, r = (n) => n) {
  const i = Sf(e).map((a) => {
    if (a.sha2 == null && a.sha512 == null)
      throw (0, Et.newError)(`Update info doesn't contain nor sha256 neither sha512 checksum: ${(0, Et.safeStringifyJson)(a)}`, "ERR_UPDATER_NO_CHECKSUM");
    return {
      url: (0, cl.newUrlFromBase)(r(a.url), t),
      info: a
    };
  }), o = e.packages, s = o == null ? null : o[process.arch] || o.ia32;
  return s != null && (i[0].packageInfo = {
    ...s,
    path: (0, cl.newUrlFromBase)(r(s.path), t).href
  }), i;
}
Object.defineProperty(en, "__esModule", { value: !0 });
en.GenericProvider = void 0;
const ul = me, Wi = je, Vi = fe;
class Xw extends Vi.Provider {
  constructor(t, r, n) {
    super(n), this.configuration = t, this.updater = r, this.baseUrl = (0, Wi.newBaseUrl)(this.configuration.url);
  }
  get channel() {
    const t = this.updater.channel || this.configuration.channel;
    return t == null ? this.getDefaultChannelName() : this.getCustomChannelName(t);
  }
  async getLatestVersion() {
    const t = (0, Wi.getChannelFilename)(this.channel), r = (0, Wi.newUrlFromBase)(t, this.baseUrl, this.updater.isAddNoCacheQuery);
    for (let n = 0; ; n++)
      try {
        return (0, Vi.parseUpdateInfo)(await this.httpRequest(r), t, r);
      } catch (i) {
        if (i instanceof ul.HttpError && i.statusCode === 404)
          throw (0, ul.newError)(`Cannot find channel "${t}" update info: ${i.stack || i.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
        if (i.code === "ECONNREFUSED" && n < 3) {
          await new Promise((o, s) => {
            try {
              setTimeout(o, 1e3 * n);
            } catch (a) {
              s(a);
            }
          });
          continue;
        }
        throw i;
      }
  }
  resolveFiles(t) {
    return (0, Vi.resolveFiles)(t, this.baseUrl);
  }
}
en.GenericProvider = Xw;
var ui = {}, fi = {};
Object.defineProperty(fi, "__esModule", { value: !0 });
fi.BitbucketProvider = void 0;
const fl = me, zi = je, Yi = fe;
class Jw extends Yi.Provider {
  constructor(t, r, n) {
    super({
      ...n,
      isUseMultipleRangeRequest: !1
    }), this.configuration = t, this.updater = r;
    const { owner: i, slug: o } = t;
    this.baseUrl = (0, zi.newBaseUrl)(`https://api.bitbucket.org/2.0/repositories/${i}/${o}/downloads`);
  }
  get channel() {
    return this.updater.channel || this.configuration.channel || "latest";
  }
  async getLatestVersion() {
    const t = new fl.CancellationToken(), r = (0, zi.getChannelFilename)(this.getCustomChannelName(this.channel)), n = (0, zi.newUrlFromBase)(r, this.baseUrl, this.updater.isAddNoCacheQuery);
    try {
      const i = await this.httpRequest(n, void 0, t);
      return (0, Yi.parseUpdateInfo)(i, r, n);
    } catch (i) {
      throw (0, fl.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${i.stack || i.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  resolveFiles(t) {
    return (0, Yi.resolveFiles)(t, this.baseUrl);
  }
  toString() {
    const { owner: t, slug: r } = this.configuration;
    return `Bitbucket (owner: ${t}, slug: ${r}, channel: ${this.channel})`;
  }
}
fi.BitbucketProvider = Jw;
var vt = {};
Object.defineProperty(vt, "__esModule", { value: !0 });
vt.GitHubProvider = vt.BaseGitHubProvider = void 0;
vt.computeReleaseNotes = bf;
const et = me, Qt = Ef, Kw = ar, Zt = je, Wo = fe, Xi = /\/tag\/([^/]+)$/;
class Af extends Wo.Provider {
  constructor(t, r, n) {
    super({
      ...n,
      /* because GitHib uses S3 */
      isUseMultipleRangeRequest: !1
    }), this.options = t, this.baseUrl = (0, Zt.newBaseUrl)((0, et.githubUrl)(t, r));
    const i = r === "github.com" ? "api.github.com" : r;
    this.baseApiUrl = (0, Zt.newBaseUrl)((0, et.githubUrl)(t, i));
  }
  computeGithubBasePath(t) {
    const r = this.options.host;
    return r && !["github.com", "api.github.com"].includes(r) ? `/api/v3${t}` : t;
  }
}
vt.BaseGitHubProvider = Af;
class Qw extends Af {
  constructor(t, r, n) {
    super(t, "github.com", n), this.options = t, this.updater = r;
  }
  get channel() {
    const t = this.updater.channel || this.options.channel;
    return t == null ? this.getDefaultChannelName() : this.getCustomChannelName(t);
  }
  async getLatestVersion() {
    var t, r, n, i, o;
    const s = new et.CancellationToken(), a = await this.httpRequest((0, Zt.newUrlFromBase)(`${this.basePath}.atom`, this.baseUrl), {
      accept: "application/xml, application/atom+xml, text/xml, */*"
    }, s), l = (0, et.parseXml)(a);
    let f = l.element("entry", !1, "No published versions on GitHub"), c = null;
    try {
      if (this.updater.allowPrerelease) {
        const S = ((t = this.updater) === null || t === void 0 ? void 0 : t.channel) || ((r = Qt.prerelease(this.updater.currentVersion)) === null || r === void 0 ? void 0 : r[0]) || null;
        if (S === null)
          c = Xi.exec(f.element("link").attribute("href"))[1];
        else
          for (const A of l.getElements("entry")) {
            const b = Xi.exec(A.element("link").attribute("href"));
            if (b === null)
              continue;
            const N = b[1], x = ((n = Qt.prerelease(N)) === null || n === void 0 ? void 0 : n[0]) || null, B = !S || ["alpha", "beta"].includes(S), q = x !== null && !["alpha", "beta"].includes(String(x));
            if (B && !q && !(S === "beta" && x === "alpha")) {
              c = N;
              break;
            }
            if (x && x === S) {
              c = N;
              break;
            }
          }
      } else {
        c = await this.getLatestTagName(s);
        for (const S of l.getElements("entry"))
          if (Xi.exec(S.element("link").attribute("href"))[1] === c) {
            f = S;
            break;
          }
      }
    } catch (S) {
      throw (0, et.newError)(`Cannot parse releases feed: ${S.stack || S.message},
XML:
${a}`, "ERR_UPDATER_INVALID_RELEASE_FEED");
    }
    if (c == null)
      throw (0, et.newError)("No published versions on GitHub", "ERR_UPDATER_NO_PUBLISHED_VERSIONS");
    let u, h = "", m = "";
    const v = async (S) => {
      h = (0, Zt.getChannelFilename)(S), m = (0, Zt.newUrlFromBase)(this.getBaseDownloadPath(String(c), h), this.baseUrl);
      const A = this.createRequestOptions(m);
      try {
        return await this.executor.request(A, s);
      } catch (b) {
        throw b instanceof et.HttpError && b.statusCode === 404 ? (0, et.newError)(`Cannot find ${h} in the latest release artifacts (${m}): ${b.stack || b.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : b;
      }
    };
    try {
      let S = this.channel;
      this.updater.allowPrerelease && (!((i = Qt.prerelease(c)) === null || i === void 0) && i[0]) && (S = this.getCustomChannelName(String((o = Qt.prerelease(c)) === null || o === void 0 ? void 0 : o[0]))), u = await v(S);
    } catch (S) {
      if (this.updater.allowPrerelease)
        u = await v(this.getDefaultChannelName());
      else
        throw S;
    }
    const E = (0, Wo.parseUpdateInfo)(u, h, m);
    return E.releaseName == null && (E.releaseName = f.elementValueOrEmpty("title")), E.releaseNotes == null && (E.releaseNotes = bf(this.updater.currentVersion, this.updater.fullChangelog, l, f)), {
      tag: c,
      ...E
    };
  }
  async getLatestTagName(t) {
    const r = this.options, n = r.host == null || r.host === "github.com" ? (0, Zt.newUrlFromBase)(`${this.basePath}/latest`, this.baseUrl) : new Kw.URL(`${this.computeGithubBasePath(`/repos/${r.owner}/${r.repo}/releases`)}/latest`, this.baseApiUrl);
    try {
      const i = await this.httpRequest(n, { Accept: "application/json" }, t);
      return i == null ? null : JSON.parse(i).tag_name;
    } catch (i) {
      throw (0, et.newError)(`Unable to find latest version on GitHub (${n}), please ensure a production release exists: ${i.stack || i.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  get basePath() {
    return `/${this.options.owner}/${this.options.repo}/releases`;
  }
  resolveFiles(t) {
    return (0, Wo.resolveFiles)(t, this.baseUrl, (r) => this.getBaseDownloadPath(t.tag, r.replace(/ /g, "-")));
  }
  getBaseDownloadPath(t, r) {
    return `${this.basePath}/download/${t}/${r}`;
  }
}
vt.GitHubProvider = Qw;
function dl(e) {
  const t = e.elementValueOrEmpty("content");
  return t === "No content." ? "" : t;
}
function bf(e, t, r, n) {
  if (!t)
    return dl(n);
  const i = [];
  for (const o of r.getElements("entry")) {
    const s = /\/tag\/v?([^/]+)$/.exec(o.element("link").attribute("href"))[1];
    Qt.lt(e, s) && i.push({
      version: s,
      note: dl(o)
    });
  }
  return i.sort((o, s) => Qt.rcompare(o.version, s.version));
}
var di = {};
Object.defineProperty(di, "__esModule", { value: !0 });
di.KeygenProvider = void 0;
const hl = me, Ji = je, Ki = fe;
class Zw extends Ki.Provider {
  constructor(t, r, n) {
    super({
      ...n,
      isUseMultipleRangeRequest: !1
    }), this.configuration = t, this.updater = r, this.defaultHostname = "api.keygen.sh";
    const i = this.configuration.host || this.defaultHostname;
    this.baseUrl = (0, Ji.newBaseUrl)(`https://${i}/v1/accounts/${this.configuration.account}/artifacts?product=${this.configuration.product}`);
  }
  get channel() {
    return this.updater.channel || this.configuration.channel || "stable";
  }
  async getLatestVersion() {
    const t = new hl.CancellationToken(), r = (0, Ji.getChannelFilename)(this.getCustomChannelName(this.channel)), n = (0, Ji.newUrlFromBase)(r, this.baseUrl, this.updater.isAddNoCacheQuery);
    try {
      const i = await this.httpRequest(n, {
        Accept: "application/vnd.api+json",
        "Keygen-Version": "1.1"
      }, t);
      return (0, Ki.parseUpdateInfo)(i, r, n);
    } catch (i) {
      throw (0, hl.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${i.stack || i.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  resolveFiles(t) {
    return (0, Ki.resolveFiles)(t, this.baseUrl);
  }
  toString() {
    const { account: t, product: r, platform: n } = this.configuration;
    return `Keygen (account: ${t}, product: ${r}, platform: ${n}, channel: ${this.channel})`;
  }
}
di.KeygenProvider = Zw;
var hi = {};
Object.defineProperty(hi, "__esModule", { value: !0 });
hi.PrivateGitHubProvider = void 0;
const Gt = me, e_ = ve, t_ = Q, pl = ar, ml = je, r_ = vt, n_ = fe;
class i_ extends r_.BaseGitHubProvider {
  constructor(t, r, n, i) {
    super(t, "api.github.com", i), this.updater = r, this.token = n;
  }
  createRequestOptions(t, r) {
    const n = super.createRequestOptions(t, r);
    return n.redirect = "manual", n;
  }
  async getLatestVersion() {
    const t = new Gt.CancellationToken(), r = (0, ml.getChannelFilename)(this.getDefaultChannelName()), n = await this.getLatestVersionInfo(t), i = n.assets.find((a) => a.name === r);
    if (i == null)
      throw (0, Gt.newError)(`Cannot find ${r} in the release ${n.html_url || n.name}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
    const o = new pl.URL(i.url);
    let s;
    try {
      s = (0, e_.load)(await this.httpRequest(o, this.configureHeaders("application/octet-stream"), t));
    } catch (a) {
      throw a instanceof Gt.HttpError && a.statusCode === 404 ? (0, Gt.newError)(`Cannot find ${r} in the latest release artifacts (${o}): ${a.stack || a.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : a;
    }
    return s.assets = n.assets, s;
  }
  get fileExtraDownloadHeaders() {
    return this.configureHeaders("application/octet-stream");
  }
  configureHeaders(t) {
    return {
      accept: t,
      authorization: `token ${this.token}`
    };
  }
  async getLatestVersionInfo(t) {
    const r = this.updater.allowPrerelease;
    let n = this.basePath;
    r || (n = `${n}/latest`);
    const i = (0, ml.newUrlFromBase)(n, this.baseUrl);
    try {
      const o = JSON.parse(await this.httpRequest(i, this.configureHeaders("application/vnd.github.v3+json"), t));
      return r ? o.find((s) => s.prerelease) || o[0] : o;
    } catch (o) {
      throw (0, Gt.newError)(`Unable to find latest version on GitHub (${i}), please ensure a production release exists: ${o.stack || o.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  get basePath() {
    return this.computeGithubBasePath(`/repos/${this.options.owner}/${this.options.repo}/releases`);
  }
  resolveFiles(t) {
    return (0, n_.getFileList)(t).map((r) => {
      const n = t_.posix.basename(r.url).replace(/ /g, "-"), i = t.assets.find((o) => o != null && o.name === n);
      if (i == null)
        throw (0, Gt.newError)(`Cannot find asset "${n}" in: ${JSON.stringify(t.assets, null, 2)}`, "ERR_UPDATER_ASSET_NOT_FOUND");
      return {
        url: new pl.URL(i.url),
        info: r
      };
    });
  }
}
hi.PrivateGitHubProvider = i_;
Object.defineProperty(ui, "__esModule", { value: !0 });
ui.isUrlProbablySupportMultiRangeRequests = Tf;
ui.createClient = c_;
const Cn = me, o_ = fi, gl = en, s_ = vt, a_ = di, l_ = hi;
function Tf(e) {
  return !e.includes("s3.amazonaws.com");
}
function c_(e, t, r) {
  if (typeof e == "string")
    throw (0, Cn.newError)("Please pass PublishConfiguration object", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
  const n = e.provider;
  switch (n) {
    case "github": {
      const i = e, o = (i.private ? process.env.GH_TOKEN || process.env.GITHUB_TOKEN : null) || i.token;
      return o == null ? new s_.GitHubProvider(i, t, r) : new l_.PrivateGitHubProvider(i, t, o, r);
    }
    case "bitbucket":
      return new o_.BitbucketProvider(e, t, r);
    case "keygen":
      return new a_.KeygenProvider(e, t, r);
    case "s3":
    case "spaces":
      return new gl.GenericProvider({
        provider: "generic",
        url: (0, Cn.getS3LikeProviderBaseUrl)(e),
        channel: e.channel || null
      }, t, {
        ...r,
        // https://github.com/minio/minio/issues/5285#issuecomment-350428955
        isUseMultipleRangeRequest: !1
      });
    case "generic": {
      const i = e;
      return new gl.GenericProvider(i, t, {
        ...r,
        isUseMultipleRangeRequest: i.useMultipleRangeRequest !== !1 && Tf(i.url)
      });
    }
    case "custom": {
      const i = e, o = i.updateProvider;
      if (!o)
        throw (0, Cn.newError)("Custom provider not specified", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
      return new o(i, t, r);
    }
    default:
      throw (0, Cn.newError)(`Unsupported provider: ${n}`, "ERR_UPDATER_UNSUPPORTED_PROVIDER");
  }
}
var pi = {}, tn = {}, fr = {}, Mt = {};
Object.defineProperty(Mt, "__esModule", { value: !0 });
Mt.OperationKind = void 0;
Mt.computeOperations = u_;
var Nt;
(function(e) {
  e[e.COPY = 0] = "COPY", e[e.DOWNLOAD = 1] = "DOWNLOAD";
})(Nt || (Mt.OperationKind = Nt = {}));
function u_(e, t, r) {
  const n = El(e.files), i = El(t.files);
  let o = null;
  const s = t.files[0], a = [], l = s.name, f = n.get(l);
  if (f == null)
    throw new Error(`no file ${l} in old blockmap`);
  const c = i.get(l);
  let u = 0;
  const { checksumToOffset: h, checksumToOldSize: m } = d_(n.get(l), f.offset, r);
  let v = s.offset;
  for (let E = 0; E < c.checksums.length; v += c.sizes[E], E++) {
    const S = c.sizes[E], A = c.checksums[E];
    let b = h.get(A);
    b != null && m.get(A) !== S && (r.warn(`Checksum ("${A}") matches, but size differs (old: ${m.get(A)}, new: ${S})`), b = void 0), b === void 0 ? (u++, o != null && o.kind === Nt.DOWNLOAD && o.end === v ? o.end += S : (o = {
      kind: Nt.DOWNLOAD,
      start: v,
      end: v + S
      // oldBlocks: null,
    }, yl(o, a, A, E))) : o != null && o.kind === Nt.COPY && o.end === b ? o.end += S : (o = {
      kind: Nt.COPY,
      start: b,
      end: b + S
      // oldBlocks: [checksum]
    }, yl(o, a, A, E));
  }
  return u > 0 && r.info(`File${s.name === "file" ? "" : " " + s.name} has ${u} changed blocks`), a;
}
const f_ = process.env.DIFFERENTIAL_DOWNLOAD_PLAN_BUILDER_VALIDATE_RANGES === "true";
function yl(e, t, r, n) {
  if (f_ && t.length !== 0) {
    const i = t[t.length - 1];
    if (i.kind === e.kind && e.start < i.end && e.start > i.start) {
      const o = [i.start, i.end, e.start, e.end].reduce((s, a) => s < a ? s : a);
      throw new Error(`operation (block index: ${n}, checksum: ${r}, kind: ${Nt[e.kind]}) overlaps previous operation (checksum: ${r}):
abs: ${i.start} until ${i.end} and ${e.start} until ${e.end}
rel: ${i.start - o} until ${i.end - o} and ${e.start - o} until ${e.end - o}`);
    }
  }
  t.push(e);
}
function d_(e, t, r) {
  const n = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
  let o = t;
  for (let s = 0; s < e.checksums.length; s++) {
    const a = e.checksums[s], l = e.sizes[s], f = i.get(a);
    if (f === void 0)
      n.set(a, o), i.set(a, l);
    else if (r.debug != null) {
      const c = f === l ? "(same size)" : `(size: ${f}, this size: ${l})`;
      r.debug(`${a} duplicated in blockmap ${c}, it doesn't lead to broken differential downloader, just corresponding block will be skipped)`);
    }
    o += l;
  }
  return { checksumToOffset: n, checksumToOldSize: i };
}
function El(e) {
  const t = /* @__PURE__ */ new Map();
  for (const r of e)
    t.set(r.name, r);
  return t;
}
Object.defineProperty(fr, "__esModule", { value: !0 });
fr.DataSplitter = void 0;
fr.copyData = Cf;
const On = me, h_ = Le, p_ = Gr, m_ = Mt, vl = Buffer.from(`\r
\r
`);
var ct;
(function(e) {
  e[e.INIT = 0] = "INIT", e[e.HEADER = 1] = "HEADER", e[e.BODY = 2] = "BODY";
})(ct || (ct = {}));
function Cf(e, t, r, n, i) {
  const o = (0, h_.createReadStream)("", {
    fd: r,
    autoClose: !1,
    start: e.start,
    // end is inclusive
    end: e.end - 1
  });
  o.on("error", n), o.once("end", i), o.pipe(t, {
    end: !1
  });
}
class g_ extends p_.Writable {
  constructor(t, r, n, i, o, s) {
    super(), this.out = t, this.options = r, this.partIndexToTaskIndex = n, this.partIndexToLength = o, this.finishHandler = s, this.partIndex = -1, this.headerListBuffer = null, this.readState = ct.INIT, this.ignoreByteCount = 0, this.remainingPartDataCount = 0, this.actualPartLength = 0, this.boundaryLength = i.length + 4, this.ignoreByteCount = this.boundaryLength - 2;
  }
  get isFinished() {
    return this.partIndex === this.partIndexToLength.length;
  }
  // noinspection JSUnusedGlobalSymbols
  _write(t, r, n) {
    if (this.isFinished) {
      console.error(`Trailing ignored data: ${t.length} bytes`);
      return;
    }
    this.handleData(t).then(n).catch(n);
  }
  async handleData(t) {
    let r = 0;
    if (this.ignoreByteCount !== 0 && this.remainingPartDataCount !== 0)
      throw (0, On.newError)("Internal error", "ERR_DATA_SPLITTER_BYTE_COUNT_MISMATCH");
    if (this.ignoreByteCount > 0) {
      const n = Math.min(this.ignoreByteCount, t.length);
      this.ignoreByteCount -= n, r = n;
    } else if (this.remainingPartDataCount > 0) {
      const n = Math.min(this.remainingPartDataCount, t.length);
      this.remainingPartDataCount -= n, await this.processPartData(t, 0, n), r = n;
    }
    if (r !== t.length) {
      if (this.readState === ct.HEADER) {
        const n = this.searchHeaderListEnd(t, r);
        if (n === -1)
          return;
        r = n, this.readState = ct.BODY, this.headerListBuffer = null;
      }
      for (; ; ) {
        if (this.readState === ct.BODY)
          this.readState = ct.INIT;
        else {
          this.partIndex++;
          let s = this.partIndexToTaskIndex.get(this.partIndex);
          if (s == null)
            if (this.isFinished)
              s = this.options.end;
            else
              throw (0, On.newError)("taskIndex is null", "ERR_DATA_SPLITTER_TASK_INDEX_IS_NULL");
          const a = this.partIndex === 0 ? this.options.start : this.partIndexToTaskIndex.get(this.partIndex - 1) + 1;
          if (a < s)
            await this.copyExistingData(a, s);
          else if (a > s)
            throw (0, On.newError)("prevTaskIndex must be < taskIndex", "ERR_DATA_SPLITTER_TASK_INDEX_ASSERT_FAILED");
          if (this.isFinished) {
            this.onPartEnd(), this.finishHandler();
            return;
          }
          if (r = this.searchHeaderListEnd(t, r), r === -1) {
            this.readState = ct.HEADER;
            return;
          }
        }
        const n = this.partIndexToLength[this.partIndex], i = r + n, o = Math.min(i, t.length);
        if (await this.processPartStarted(t, r, o), this.remainingPartDataCount = n - (o - r), this.remainingPartDataCount > 0)
          return;
        if (r = i + this.boundaryLength, r >= t.length) {
          this.ignoreByteCount = this.boundaryLength - (t.length - i);
          return;
        }
      }
    }
  }
  copyExistingData(t, r) {
    return new Promise((n, i) => {
      const o = () => {
        if (t === r) {
          n();
          return;
        }
        const s = this.options.tasks[t];
        if (s.kind !== m_.OperationKind.COPY) {
          i(new Error("Task kind must be COPY"));
          return;
        }
        Cf(s, this.out, this.options.oldFileFd, i, () => {
          t++, o();
        });
      };
      o();
    });
  }
  searchHeaderListEnd(t, r) {
    const n = t.indexOf(vl, r);
    if (n !== -1)
      return n + vl.length;
    const i = r === 0 ? t : t.slice(r);
    return this.headerListBuffer == null ? this.headerListBuffer = i : this.headerListBuffer = Buffer.concat([this.headerListBuffer, i]), -1;
  }
  onPartEnd() {
    const t = this.partIndexToLength[this.partIndex - 1];
    if (this.actualPartLength !== t)
      throw (0, On.newError)(`Expected length: ${t} differs from actual: ${this.actualPartLength}`, "ERR_DATA_SPLITTER_LENGTH_MISMATCH");
    this.actualPartLength = 0;
  }
  processPartStarted(t, r, n) {
    return this.partIndex !== 0 && this.onPartEnd(), this.processPartData(t, r, n);
  }
  processPartData(t, r, n) {
    this.actualPartLength += n - r;
    const i = this.out;
    return i.write(r === 0 && t.length === n ? t : t.slice(r, n)) ? Promise.resolve() : new Promise((o, s) => {
      i.on("error", s), i.once("drain", () => {
        i.removeListener("error", s), o();
      });
    });
  }
}
fr.DataSplitter = g_;
var mi = {};
Object.defineProperty(mi, "__esModule", { value: !0 });
mi.executeTasksUsingMultipleRangeRequests = y_;
mi.checkIsRangesSupported = zo;
const Vo = me, wl = fr, _l = Mt;
function y_(e, t, r, n, i) {
  const o = (s) => {
    if (s >= t.length) {
      e.fileMetadataBuffer != null && r.write(e.fileMetadataBuffer), r.end();
      return;
    }
    const a = s + 1e3;
    E_(e, {
      tasks: t,
      start: s,
      end: Math.min(t.length, a),
      oldFileFd: n
    }, r, () => o(a), i);
  };
  return o;
}
function E_(e, t, r, n, i) {
  let o = "bytes=", s = 0;
  const a = /* @__PURE__ */ new Map(), l = [];
  for (let u = t.start; u < t.end; u++) {
    const h = t.tasks[u];
    h.kind === _l.OperationKind.DOWNLOAD && (o += `${h.start}-${h.end - 1}, `, a.set(s, u), s++, l.push(h.end - h.start));
  }
  if (s <= 1) {
    const u = (h) => {
      if (h >= t.end) {
        n();
        return;
      }
      const m = t.tasks[h++];
      if (m.kind === _l.OperationKind.COPY)
        (0, wl.copyData)(m, r, t.oldFileFd, i, () => u(h));
      else {
        const v = e.createRequestOptions();
        v.headers.Range = `bytes=${m.start}-${m.end - 1}`;
        const E = e.httpExecutor.createRequest(v, (S) => {
          zo(S, i) && (S.pipe(r, {
            end: !1
          }), S.once("end", () => u(h)));
        });
        e.httpExecutor.addErrorAndTimeoutHandlers(E, i), E.end();
      }
    };
    u(t.start);
    return;
  }
  const f = e.createRequestOptions();
  f.headers.Range = o.substring(0, o.length - 2);
  const c = e.httpExecutor.createRequest(f, (u) => {
    if (!zo(u, i))
      return;
    const h = (0, Vo.safeGetHeader)(u, "content-type"), m = /^multipart\/.+?(?:; boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i.exec(h);
    if (m == null) {
      i(new Error(`Content-Type "multipart/byteranges" is expected, but got "${h}"`));
      return;
    }
    const v = new wl.DataSplitter(r, t, a, m[1] || m[2], l, n);
    v.on("error", i), u.pipe(v), u.on("end", () => {
      setTimeout(() => {
        c.abort(), i(new Error("Response ends without calling any handlers"));
      }, 1e4);
    });
  });
  e.httpExecutor.addErrorAndTimeoutHandlers(c, i), c.end();
}
function zo(e, t) {
  if (e.statusCode >= 400)
    return t((0, Vo.createHttpError)(e)), !1;
  if (e.statusCode !== 206) {
    const r = (0, Vo.safeGetHeader)(e, "accept-ranges");
    if (r == null || r === "none")
      return t(new Error(`Server doesn't support Accept-Ranges (response code ${e.statusCode})`)), !1;
  }
  return !0;
}
var gi = {};
Object.defineProperty(gi, "__esModule", { value: !0 });
gi.ProgressDifferentialDownloadCallbackTransform = void 0;
const v_ = Gr;
var er;
(function(e) {
  e[e.COPY = 0] = "COPY", e[e.DOWNLOAD = 1] = "DOWNLOAD";
})(er || (er = {}));
class w_ extends v_.Transform {
  constructor(t, r, n) {
    super(), this.progressDifferentialDownloadInfo = t, this.cancellationToken = r, this.onProgress = n, this.start = Date.now(), this.transferred = 0, this.delta = 0, this.expectedBytes = 0, this.index = 0, this.operationType = er.COPY, this.nextUpdate = this.start + 1e3;
  }
  _transform(t, r, n) {
    if (this.cancellationToken.cancelled) {
      n(new Error("cancelled"), null);
      return;
    }
    if (this.operationType == er.COPY) {
      n(null, t);
      return;
    }
    this.transferred += t.length, this.delta += t.length;
    const i = Date.now();
    i >= this.nextUpdate && this.transferred !== this.expectedBytes && this.transferred !== this.progressDifferentialDownloadInfo.grandTotal && (this.nextUpdate = i + 1e3, this.onProgress({
      total: this.progressDifferentialDownloadInfo.grandTotal,
      delta: this.delta,
      transferred: this.transferred,
      percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
      bytesPerSecond: Math.round(this.transferred / ((i - this.start) / 1e3))
    }), this.delta = 0), n(null, t);
  }
  beginFileCopy() {
    this.operationType = er.COPY;
  }
  beginRangeDownload() {
    this.operationType = er.DOWNLOAD, this.expectedBytes += this.progressDifferentialDownloadInfo.expectedByteCounts[this.index++];
  }
  endRangeDownload() {
    this.transferred !== this.progressDifferentialDownloadInfo.grandTotal && this.onProgress({
      total: this.progressDifferentialDownloadInfo.grandTotal,
      delta: this.delta,
      transferred: this.transferred,
      percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
      bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
    });
  }
  // Called when we are 100% done with the connection/download
  _flush(t) {
    if (this.cancellationToken.cancelled) {
      t(new Error("cancelled"));
      return;
    }
    this.onProgress({
      total: this.progressDifferentialDownloadInfo.grandTotal,
      delta: this.delta,
      transferred: this.transferred,
      percent: 100,
      bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
    }), this.delta = 0, this.transferred = 0, t(null);
  }
}
gi.ProgressDifferentialDownloadCallbackTransform = w_;
Object.defineProperty(tn, "__esModule", { value: !0 });
tn.DifferentialDownloader = void 0;
const wr = me, Qi = _t, __ = Le, S_ = fr, A_ = ar, Pn = Mt, Sl = mi, b_ = gi;
class T_ {
  // noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
  constructor(t, r, n) {
    this.blockAwareFileInfo = t, this.httpExecutor = r, this.options = n, this.fileMetadataBuffer = null, this.logger = n.logger;
  }
  createRequestOptions() {
    const t = {
      headers: {
        ...this.options.requestHeaders,
        accept: "*/*"
      }
    };
    return (0, wr.configureRequestUrl)(this.options.newUrl, t), (0, wr.configureRequestOptions)(t), t;
  }
  doDownload(t, r) {
    if (t.version !== r.version)
      throw new Error(`version is different (${t.version} - ${r.version}), full download is required`);
    const n = this.logger, i = (0, Pn.computeOperations)(t, r, n);
    n.debug != null && n.debug(JSON.stringify(i, null, 2));
    let o = 0, s = 0;
    for (const l of i) {
      const f = l.end - l.start;
      l.kind === Pn.OperationKind.DOWNLOAD ? o += f : s += f;
    }
    const a = this.blockAwareFileInfo.size;
    if (o + s + (this.fileMetadataBuffer == null ? 0 : this.fileMetadataBuffer.length) !== a)
      throw new Error(`Internal error, size mismatch: downloadSize: ${o}, copySize: ${s}, newSize: ${a}`);
    return n.info(`Full: ${Al(a)}, To download: ${Al(o)} (${Math.round(o / (a / 100))}%)`), this.downloadFile(i);
  }
  downloadFile(t) {
    const r = [], n = () => Promise.all(r.map((i) => (0, Qi.close)(i.descriptor).catch((o) => {
      this.logger.error(`cannot close file "${i.path}": ${o}`);
    })));
    return this.doDownloadFile(t, r).then(n).catch((i) => n().catch((o) => {
      try {
        this.logger.error(`cannot close files: ${o}`);
      } catch (s) {
        try {
          console.error(s);
        } catch {
        }
      }
      throw i;
    }).then(() => {
      throw i;
    }));
  }
  async doDownloadFile(t, r) {
    const n = await (0, Qi.open)(this.options.oldFile, "r");
    r.push({ descriptor: n, path: this.options.oldFile });
    const i = await (0, Qi.open)(this.options.newFile, "w");
    r.push({ descriptor: i, path: this.options.newFile });
    const o = (0, __.createWriteStream)(this.options.newFile, { fd: i });
    await new Promise((s, a) => {
      const l = [];
      let f;
      if (!this.options.isUseMultipleRangeRequest && this.options.onProgress) {
        const A = [];
        let b = 0;
        for (const x of t)
          x.kind === Pn.OperationKind.DOWNLOAD && (A.push(x.end - x.start), b += x.end - x.start);
        const N = {
          expectedByteCounts: A,
          grandTotal: b
        };
        f = new b_.ProgressDifferentialDownloadCallbackTransform(N, this.options.cancellationToken, this.options.onProgress), l.push(f);
      }
      const c = new wr.DigestTransform(this.blockAwareFileInfo.sha512);
      c.isValidateOnEnd = !1, l.push(c), o.on("finish", () => {
        o.close(() => {
          r.splice(1, 1);
          try {
            c.validate();
          } catch (A) {
            a(A);
            return;
          }
          s(void 0);
        });
      }), l.push(o);
      let u = null;
      for (const A of l)
        A.on("error", a), u == null ? u = A : u = u.pipe(A);
      const h = l[0];
      let m;
      if (this.options.isUseMultipleRangeRequest) {
        m = (0, Sl.executeTasksUsingMultipleRangeRequests)(this, t, h, n, a), m(0);
        return;
      }
      let v = 0, E = null;
      this.logger.info(`Differential download: ${this.options.newUrl}`);
      const S = this.createRequestOptions();
      S.redirect = "manual", m = (A) => {
        var b, N;
        if (A >= t.length) {
          this.fileMetadataBuffer != null && h.write(this.fileMetadataBuffer), h.end();
          return;
        }
        const x = t[A++];
        if (x.kind === Pn.OperationKind.COPY) {
          f && f.beginFileCopy(), (0, S_.copyData)(x, h, n, a, () => m(A));
          return;
        }
        const B = `bytes=${x.start}-${x.end - 1}`;
        S.headers.range = B, (N = (b = this.logger) === null || b === void 0 ? void 0 : b.debug) === null || N === void 0 || N.call(b, `download range: ${B}`), f && f.beginRangeDownload();
        const q = this.httpExecutor.createRequest(S, (j) => {
          j.on("error", a), j.on("aborted", () => {
            a(new Error("response has been aborted by the server"));
          }), j.statusCode >= 400 && a((0, wr.createHttpError)(j)), j.pipe(h, {
            end: !1
          }), j.once("end", () => {
            f && f.endRangeDownload(), ++v === 100 ? (v = 0, setTimeout(() => m(A), 1e3)) : m(A);
          });
        });
        q.on("redirect", (j, le, y) => {
          this.logger.info(`Redirect to ${C_(y)}`), E = y, (0, wr.configureRequestUrl)(new A_.URL(E), S), q.followRedirect();
        }), this.httpExecutor.addErrorAndTimeoutHandlers(q, a), q.end();
      }, m(0);
    });
  }
  async readRemoteBytes(t, r) {
    const n = Buffer.allocUnsafe(r + 1 - t), i = this.createRequestOptions();
    i.headers.range = `bytes=${t}-${r}`;
    let o = 0;
    if (await this.request(i, (s) => {
      s.copy(n, o), o += s.length;
    }), o !== n.length)
      throw new Error(`Received data length ${o} is not equal to expected ${n.length}`);
    return n;
  }
  request(t, r) {
    return new Promise((n, i) => {
      const o = this.httpExecutor.createRequest(t, (s) => {
        (0, Sl.checkIsRangesSupported)(s, i) && (s.on("error", i), s.on("aborted", () => {
          i(new Error("response has been aborted by the server"));
        }), s.on("data", r), s.on("end", () => n()));
      });
      this.httpExecutor.addErrorAndTimeoutHandlers(o, i), o.end();
    });
  }
}
tn.DifferentialDownloader = T_;
function Al(e, t = " KB") {
  return new Intl.NumberFormat("en").format((e / 1024).toFixed(2)) + t;
}
function C_(e) {
  const t = e.indexOf("?");
  return t < 0 ? e : e.substring(0, t);
}
Object.defineProperty(pi, "__esModule", { value: !0 });
pi.GenericDifferentialDownloader = void 0;
const O_ = tn;
class P_ extends O_.DifferentialDownloader {
  download(t, r) {
    return this.doDownload(t, r);
  }
}
pi.GenericDifferentialDownloader = P_;
var St = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.UpdaterSignal = e.UPDATE_DOWNLOADED = e.DOWNLOAD_PROGRESS = e.CancellationToken = void 0, e.addHandler = n;
  const t = me;
  Object.defineProperty(e, "CancellationToken", { enumerable: !0, get: function() {
    return t.CancellationToken;
  } }), e.DOWNLOAD_PROGRESS = "download-progress", e.UPDATE_DOWNLOADED = "update-downloaded";
  class r {
    constructor(o) {
      this.emitter = o;
    }
    /**
     * Emitted when an authenticating proxy is [asking for user credentials](https://github.com/electron/electron/blob/master/docs/api/client-request.md#event-login).
     */
    login(o) {
      n(this.emitter, "login", o);
    }
    progress(o) {
      n(this.emitter, e.DOWNLOAD_PROGRESS, o);
    }
    updateDownloaded(o) {
      n(this.emitter, e.UPDATE_DOWNLOADED, o);
    }
    updateCancelled(o) {
      n(this.emitter, "update-cancelled", o);
    }
  }
  e.UpdaterSignal = r;
  function n(i, o, s) {
    i.on(o, s);
  }
})(St);
Object.defineProperty(mt, "__esModule", { value: !0 });
mt.NoOpLogger = mt.AppUpdater = void 0;
const be = me, R_ = Vr, I_ = wt, D_ = Yn, Wt = _t, N_ = ve, Zi = ni, Pt = Q, It = Ef, bl = Zr, $_ = ci, Tl = vf, F_ = en, eo = ui, x_ = vc, L_ = je, U_ = pi, Vt = St;
class bs extends D_.EventEmitter {
  /**
   * Get the update channel. Doesn't return `channel` from the update configuration, only if was previously set.
   */
  get channel() {
    return this._channel;
  }
  /**
   * Set the update channel. Overrides `channel` in the update configuration.
   *
   * `allowDowngrade` will be automatically set to `true`. If this behavior is not suitable for you, simple set `allowDowngrade` explicitly after.
   */
  set channel(t) {
    if (this._channel != null) {
      if (typeof t != "string")
        throw (0, be.newError)(`Channel must be a string, but got: ${t}`, "ERR_UPDATER_INVALID_CHANNEL");
      if (t.length === 0)
        throw (0, be.newError)("Channel must be not an empty string", "ERR_UPDATER_INVALID_CHANNEL");
    }
    this._channel = t, this.allowDowngrade = !0;
  }
  /**
   *  Shortcut for explicitly adding auth tokens to request headers
   */
  addAuthHeader(t) {
    this.requestHeaders = Object.assign({}, this.requestHeaders, {
      authorization: t
    });
  }
  // noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
  get netSession() {
    return (0, Tl.getNetSession)();
  }
  /**
   * The logger. You can pass [electron-log](https://github.com/megahertz/electron-log), [winston](https://github.com/winstonjs/winston) or another logger with the following interface: `{ info(), warn(), error() }`.
   * Set it to `null` if you would like to disable a logging feature.
   */
  get logger() {
    return this._logger;
  }
  set logger(t) {
    this._logger = t ?? new Of();
  }
  // noinspection JSUnusedGlobalSymbols
  /**
   * test only
   * @private
   */
  set updateConfigPath(t) {
    this.clientPromise = null, this._appUpdateConfigPath = t, this.configOnDisk = new Zi.Lazy(() => this.loadUpdateConfig());
  }
  /**
   * Allows developer to override default logic for determining if an update is supported.
   * The default logic compares the `UpdateInfo` minimum system version against the `os.release()` with `semver` package
   */
  get isUpdateSupported() {
    return this._isUpdateSupported;
  }
  set isUpdateSupported(t) {
    t && (this._isUpdateSupported = t);
  }
  constructor(t, r) {
    super(), this.autoDownload = !0, this.autoInstallOnAppQuit = !0, this.autoRunAppAfterInstall = !0, this.allowPrerelease = !1, this.fullChangelog = !1, this.allowDowngrade = !1, this.disableWebInstaller = !1, this.disableDifferentialDownload = !1, this.forceDevUpdateConfig = !1, this._channel = null, this.downloadedUpdateHelper = null, this.requestHeaders = null, this._logger = console, this.signals = new Vt.UpdaterSignal(this), this._appUpdateConfigPath = null, this._isUpdateSupported = (o) => this.checkIfUpdateSupported(o), this.clientPromise = null, this.stagingUserIdPromise = new Zi.Lazy(() => this.getOrCreateStagingUserId()), this.configOnDisk = new Zi.Lazy(() => this.loadUpdateConfig()), this.checkForUpdatesPromise = null, this.downloadPromise = null, this.updateInfoAndProvider = null, this._testOnlyOptions = null, this.on("error", (o) => {
      this._logger.error(`Error: ${o.stack || o.message}`);
    }), r == null ? (this.app = new $_.ElectronAppAdapter(), this.httpExecutor = new Tl.ElectronHttpExecutor((o, s) => this.emit("login", o, s))) : (this.app = r, this.httpExecutor = null);
    const n = this.app.version, i = (0, It.parse)(n);
    if (i == null)
      throw (0, be.newError)(`App version is not a valid semver version: "${n}"`, "ERR_UPDATER_INVALID_VERSION");
    this.currentVersion = i, this.allowPrerelease = k_(i), t != null && (this.setFeedURL(t), typeof t != "string" && t.requestHeaders && (this.requestHeaders = t.requestHeaders));
  }
  //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
  getFeedURL() {
    return "Deprecated. Do not use it.";
  }
  /**
   * Configure update provider. If value is `string`, [GenericServerOptions](./publish.md#genericserveroptions) will be set with value as `url`.
   * @param options If you want to override configuration in the `app-update.yml`.
   */
  setFeedURL(t) {
    const r = this.createProviderRuntimeOptions();
    let n;
    typeof t == "string" ? n = new F_.GenericProvider({ provider: "generic", url: t }, this, {
      ...r,
      isUseMultipleRangeRequest: (0, eo.isUrlProbablySupportMultiRangeRequests)(t)
    }) : n = (0, eo.createClient)(t, this, r), this.clientPromise = Promise.resolve(n);
  }
  /**
   * Asks the server whether there is an update.
   * @returns null if the updater is disabled, otherwise info about the latest version
   */
  checkForUpdates() {
    if (!this.isUpdaterActive())
      return Promise.resolve(null);
    let t = this.checkForUpdatesPromise;
    if (t != null)
      return this._logger.info("Checking for update (already in progress)"), t;
    const r = () => this.checkForUpdatesPromise = null;
    return this._logger.info("Checking for update"), t = this.doCheckForUpdates().then((n) => (r(), n)).catch((n) => {
      throw r(), this.emit("error", n, `Cannot check for updates: ${(n.stack || n).toString()}`), n;
    }), this.checkForUpdatesPromise = t, t;
  }
  isUpdaterActive() {
    return this.app.isPackaged || this.forceDevUpdateConfig ? !0 : (this._logger.info("Skip checkForUpdates because application is not packed and dev update config is not forced"), !1);
  }
  // noinspection JSUnusedGlobalSymbols
  checkForUpdatesAndNotify(t) {
    return this.checkForUpdates().then((r) => r != null && r.downloadPromise ? (r.downloadPromise.then(() => {
      const n = bs.formatDownloadNotification(r.updateInfo.version, this.app.name, t);
      new pt.Notification(n).show();
    }), r) : (this._logger.debug != null && this._logger.debug("checkForUpdatesAndNotify called, downloadPromise is null"), r));
  }
  static formatDownloadNotification(t, r, n) {
    return n == null && (n = {
      title: "A new update is ready to install",
      body: "{appName} version {version} has been downloaded and will be automatically installed on exit"
    }), n = {
      title: n.title.replace("{appName}", r).replace("{version}", t),
      body: n.body.replace("{appName}", r).replace("{version}", t)
    }, n;
  }
  async isStagingMatch(t) {
    const r = t.stagingPercentage;
    let n = r;
    if (n == null)
      return !0;
    if (n = parseInt(n, 10), isNaN(n))
      return this._logger.warn(`Staging percentage is NaN: ${r}`), !0;
    n = n / 100;
    const i = await this.stagingUserIdPromise.value, s = be.UUID.parse(i).readUInt32BE(12) / 4294967295;
    return this._logger.info(`Staging percentage: ${n}, percentage: ${s}, user id: ${i}`), s < n;
  }
  computeFinalHeaders(t) {
    return this.requestHeaders != null && Object.assign(t, this.requestHeaders), t;
  }
  async isUpdateAvailable(t) {
    const r = (0, It.parse)(t.version);
    if (r == null)
      throw (0, be.newError)(`This file could not be downloaded, or the latest version (from update server) does not have a valid semver version: "${t.version}"`, "ERR_UPDATER_INVALID_VERSION");
    const n = this.currentVersion;
    if ((0, It.eq)(r, n) || !await Promise.resolve(this.isUpdateSupported(t)) || !await this.isStagingMatch(t))
      return !1;
    const o = (0, It.gt)(r, n), s = (0, It.lt)(r, n);
    return o ? !0 : this.allowDowngrade && s;
  }
  checkIfUpdateSupported(t) {
    const r = t == null ? void 0 : t.minimumSystemVersion, n = (0, I_.release)();
    if (r)
      try {
        if ((0, It.lt)(n, r))
          return this._logger.info(`Current OS version ${n} is less than the minimum OS version required ${r} for version ${n}`), !1;
      } catch (i) {
        this._logger.warn(`Failed to compare current OS version(${n}) with minimum OS version(${r}): ${(i.message || i).toString()}`);
      }
    return !0;
  }
  async getUpdateInfoAndProvider() {
    await this.app.whenReady(), this.clientPromise == null && (this.clientPromise = this.configOnDisk.value.then((n) => (0, eo.createClient)(n, this, this.createProviderRuntimeOptions())));
    const t = await this.clientPromise, r = await this.stagingUserIdPromise.value;
    return t.setRequestHeaders(this.computeFinalHeaders({ "x-user-staging-id": r })), {
      info: await t.getLatestVersion(),
      provider: t
    };
  }
  createProviderRuntimeOptions() {
    return {
      isUseMultipleRangeRequest: !0,
      platform: this._testOnlyOptions == null ? process.platform : this._testOnlyOptions.platform,
      executor: this.httpExecutor
    };
  }
  async doCheckForUpdates() {
    this.emit("checking-for-update");
    const t = await this.getUpdateInfoAndProvider(), r = t.info;
    if (!await this.isUpdateAvailable(r))
      return this._logger.info(`Update for version ${this.currentVersion.format()} is not available (latest version: ${r.version}, downgrade is ${this.allowDowngrade ? "allowed" : "disallowed"}).`), this.emit("update-not-available", r), {
        isUpdateAvailable: !1,
        versionInfo: r,
        updateInfo: r
      };
    this.updateInfoAndProvider = t, this.onUpdateAvailable(r);
    const n = new be.CancellationToken();
    return {
      isUpdateAvailable: !0,
      versionInfo: r,
      updateInfo: r,
      cancellationToken: n,
      downloadPromise: this.autoDownload ? this.downloadUpdate(n) : null
    };
  }
  onUpdateAvailable(t) {
    this._logger.info(`Found version ${t.version} (url: ${(0, be.asArray)(t.files).map((r) => r.url).join(", ")})`), this.emit("update-available", t);
  }
  /**
   * Start downloading update manually. You can use this method if `autoDownload` option is set to `false`.
   * @returns {Promise<Array<string>>} Paths to downloaded files.
   */
  downloadUpdate(t = new be.CancellationToken()) {
    const r = this.updateInfoAndProvider;
    if (r == null) {
      const i = new Error("Please check update first");
      return this.dispatchError(i), Promise.reject(i);
    }
    if (this.downloadPromise != null)
      return this._logger.info("Downloading update (already in progress)"), this.downloadPromise;
    this._logger.info(`Downloading update from ${(0, be.asArray)(r.info.files).map((i) => i.url).join(", ")}`);
    const n = (i) => {
      if (!(i instanceof be.CancellationError))
        try {
          this.dispatchError(i);
        } catch (o) {
          this._logger.warn(`Cannot dispatch error event: ${o.stack || o}`);
        }
      return i;
    };
    return this.downloadPromise = this.doDownloadUpdate({
      updateInfoAndProvider: r,
      requestHeaders: this.computeRequestHeaders(r.provider),
      cancellationToken: t,
      disableWebInstaller: this.disableWebInstaller,
      disableDifferentialDownload: this.disableDifferentialDownload
    }).catch((i) => {
      throw n(i);
    }).finally(() => {
      this.downloadPromise = null;
    }), this.downloadPromise;
  }
  dispatchError(t) {
    this.emit("error", t, (t.stack || t).toString());
  }
  dispatchUpdateDownloaded(t) {
    this.emit(Vt.UPDATE_DOWNLOADED, t);
  }
  async loadUpdateConfig() {
    return this._appUpdateConfigPath == null && (this._appUpdateConfigPath = this.app.appUpdateConfigPath), (0, N_.load)(await (0, Wt.readFile)(this._appUpdateConfigPath, "utf-8"));
  }
  computeRequestHeaders(t) {
    const r = t.fileExtraDownloadHeaders;
    if (r != null) {
      const n = this.requestHeaders;
      return n == null ? r : {
        ...r,
        ...n
      };
    }
    return this.computeFinalHeaders({ accept: "*/*" });
  }
  async getOrCreateStagingUserId() {
    const t = Pt.join(this.app.userDataPath, ".updaterId");
    try {
      const n = await (0, Wt.readFile)(t, "utf-8");
      if (be.UUID.check(n))
        return n;
      this._logger.warn(`Staging user id file exists, but content was invalid: ${n}`);
    } catch (n) {
      n.code !== "ENOENT" && this._logger.warn(`Couldn't read staging user ID, creating a blank one: ${n}`);
    }
    const r = be.UUID.v5((0, R_.randomBytes)(4096), be.UUID.OID);
    this._logger.info(`Generated new staging user ID: ${r}`);
    try {
      await (0, Wt.outputFile)(t, r);
    } catch (n) {
      this._logger.warn(`Couldn't write out staging user ID: ${n}`);
    }
    return r;
  }
  /** @internal */
  get isAddNoCacheQuery() {
    const t = this.requestHeaders;
    if (t == null)
      return !0;
    for (const r of Object.keys(t)) {
      const n = r.toLowerCase();
      if (n === "authorization" || n === "private-token")
        return !1;
    }
    return !0;
  }
  async getOrCreateDownloadHelper() {
    let t = this.downloadedUpdateHelper;
    if (t == null) {
      const r = (await this.configOnDisk.value).updaterCacheDirName, n = this._logger;
      r == null && n.error("updaterCacheDirName is not specified in app-update.yml Was app build using at least electron-builder 20.34.0?");
      const i = Pt.join(this.app.baseCachePath, r || this.app.name);
      n.debug != null && n.debug(`updater cache dir: ${i}`), t = new bl.DownloadedUpdateHelper(i), this.downloadedUpdateHelper = t;
    }
    return t;
  }
  async executeDownload(t) {
    const r = t.fileInfo, n = {
      headers: t.downloadUpdateOptions.requestHeaders,
      cancellationToken: t.downloadUpdateOptions.cancellationToken,
      sha2: r.info.sha2,
      sha512: r.info.sha512
    };
    this.listenerCount(Vt.DOWNLOAD_PROGRESS) > 0 && (n.onProgress = (b) => this.emit(Vt.DOWNLOAD_PROGRESS, b));
    const i = t.downloadUpdateOptions.updateInfoAndProvider.info, o = i.version, s = r.packageInfo;
    function a() {
      const b = decodeURIComponent(t.fileInfo.url.pathname);
      return b.endsWith(`.${t.fileExtension}`) ? Pt.basename(b) : t.fileInfo.info.url;
    }
    const l = await this.getOrCreateDownloadHelper(), f = l.cacheDirForPendingUpdate;
    await (0, Wt.mkdir)(f, { recursive: !0 });
    const c = a();
    let u = Pt.join(f, c);
    const h = s == null ? null : Pt.join(f, `package-${o}${Pt.extname(s.path) || ".7z"}`), m = async (b) => (await l.setDownloadedFile(u, h, i, r, c, b), await t.done({
      ...i,
      downloadedFile: u
    }), h == null ? [u] : [u, h]), v = this._logger, E = await l.validateDownloadedPath(u, i, r, v);
    if (E != null)
      return u = E, await m(!1);
    const S = async () => (await l.clear().catch(() => {
    }), await (0, Wt.unlink)(u).catch(() => {
    })), A = await (0, bl.createTempUpdateFile)(`temp-${c}`, f, v);
    try {
      await t.task(A, n, h, S), await (0, be.retry)(() => (0, Wt.rename)(A, u), 60, 500, 0, 0, (b) => b instanceof Error && /^EBUSY:/.test(b.message));
    } catch (b) {
      throw await S(), b instanceof be.CancellationError && (v.info("cancelled"), this.emit("update-cancelled", i)), b;
    }
    return v.info(`New version ${o} has been downloaded to ${u}`), await m(!0);
  }
  async differentialDownloadInstaller(t, r, n, i, o) {
    try {
      if (this._testOnlyOptions != null && !this._testOnlyOptions.isUseDifferentialDownload)
        return !0;
      const s = (0, L_.blockmapFiles)(t.url, this.app.version, r.updateInfoAndProvider.info.version);
      this._logger.info(`Download block maps (old: "${s[0]}", new: ${s[1]})`);
      const a = async (c) => {
        const u = await this.httpExecutor.downloadToBuffer(c, {
          headers: r.requestHeaders,
          cancellationToken: r.cancellationToken
        });
        if (u == null || u.length === 0)
          throw new Error(`Blockmap "${c.href}" is empty`);
        try {
          return JSON.parse((0, x_.gunzipSync)(u).toString());
        } catch (h) {
          throw new Error(`Cannot parse blockmap "${c.href}", error: ${h}`);
        }
      }, l = {
        newUrl: t.url,
        oldFile: Pt.join(this.downloadedUpdateHelper.cacheDir, o),
        logger: this._logger,
        newFile: n,
        isUseMultipleRangeRequest: i.isUseMultipleRangeRequest,
        requestHeaders: r.requestHeaders,
        cancellationToken: r.cancellationToken
      };
      this.listenerCount(Vt.DOWNLOAD_PROGRESS) > 0 && (l.onProgress = (c) => this.emit(Vt.DOWNLOAD_PROGRESS, c));
      const f = await Promise.all(s.map((c) => a(c)));
      return await new U_.GenericDifferentialDownloader(t.info, this.httpExecutor, l).download(f[0], f[1]), !1;
    } catch (s) {
      if (this._logger.error(`Cannot download differentially, fallback to full download: ${s.stack || s}`), this._testOnlyOptions != null)
        throw s;
      return !0;
    }
  }
}
mt.AppUpdater = bs;
function k_(e) {
  const t = (0, It.prerelease)(e);
  return t != null && t.length > 0;
}
class Of {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  info(t) {
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  warn(t) {
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error(t) {
  }
}
mt.NoOpLogger = Of;
Object.defineProperty(nt, "__esModule", { value: !0 });
nt.BaseUpdater = void 0;
const Cl = Wr, M_ = mt;
class j_ extends M_.AppUpdater {
  constructor(t, r) {
    super(t, r), this.quitAndInstallCalled = !1, this.quitHandlerAdded = !1;
  }
  quitAndInstall(t = !1, r = !1) {
    this._logger.info("Install on explicit quitAndInstall"), this.install(t, t ? r : this.autoRunAppAfterInstall) ? setImmediate(() => {
      pt.autoUpdater.emit("before-quit-for-update"), this.app.quit();
    }) : this.quitAndInstallCalled = !1;
  }
  executeDownload(t) {
    return super.executeDownload({
      ...t,
      done: (r) => (this.dispatchUpdateDownloaded(r), this.addQuitHandler(), Promise.resolve())
    });
  }
  get installerPath() {
    return this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.file;
  }
  // must be sync (because quit even handler is not async)
  install(t = !1, r = !1) {
    if (this.quitAndInstallCalled)
      return this._logger.warn("install call ignored: quitAndInstallCalled is set to true"), !1;
    const n = this.downloadedUpdateHelper, i = this.installerPath, o = n == null ? null : n.downloadedFileInfo;
    if (i == null || o == null)
      return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
    this.quitAndInstallCalled = !0;
    try {
      return this._logger.info(`Install: isSilent: ${t}, isForceRunAfter: ${r}`), this.doInstall({
        isSilent: t,
        isForceRunAfter: r,
        isAdminRightsRequired: o.isAdminRightsRequired
      });
    } catch (s) {
      return this.dispatchError(s), !1;
    }
  }
  addQuitHandler() {
    this.quitHandlerAdded || !this.autoInstallOnAppQuit || (this.quitHandlerAdded = !0, this.app.onQuit((t) => {
      if (this.quitAndInstallCalled) {
        this._logger.info("Update installer has already been triggered. Quitting application.");
        return;
      }
      if (!this.autoInstallOnAppQuit) {
        this._logger.info("Update will not be installed on quit because autoInstallOnAppQuit is set to false.");
        return;
      }
      if (t !== 0) {
        this._logger.info(`Update will be not installed on quit because application is quitting with exit code ${t}`);
        return;
      }
      this._logger.info("Auto install update on quit"), this.install(!0, !1);
    }));
  }
  wrapSudo() {
    const { name: t } = this.app, r = `"${t} would like to update"`, n = this.spawnSyncLog("which gksudo || which kdesudo || which pkexec || which beesu"), i = [n];
    return /kdesudo/i.test(n) ? (i.push("--comment", r), i.push("-c")) : /gksudo/i.test(n) ? i.push("--message", r) : /pkexec/i.test(n) && i.push("--disable-internal-agent"), i.join(" ");
  }
  spawnSyncLog(t, r = [], n = {}) {
    this._logger.info(`Executing: ${t} with args: ${r}`);
    const i = (0, Cl.spawnSync)(t, r, {
      env: { ...process.env, ...n },
      encoding: "utf-8",
      shell: !0
    }), { error: o, status: s, stdout: a, stderr: l } = i;
    if (o != null)
      throw this._logger.error(l), o;
    if (s != null && s !== 0)
      throw this._logger.error(l), new Error(`Command ${t} exited with code ${s}`);
    return a.trim();
  }
  /**
   * This handles both node 8 and node 10 way of emitting error when spawning a process
   *   - node 8: Throws the error
   *   - node 10: Emit the error(Need to listen with on)
   */
  // https://github.com/electron-userland/electron-builder/issues/1129
  // Node 8 sends errors: https://nodejs.org/dist/latest-v8.x/docs/api/errors.html#errors_common_system_errors
  async spawnLog(t, r = [], n = void 0, i = "ignore") {
    return this._logger.info(`Executing: ${t} with args: ${r}`), new Promise((o, s) => {
      try {
        const a = { stdio: i, env: n, detached: !0 }, l = (0, Cl.spawn)(t, r, a);
        l.on("error", (f) => {
          s(f);
        }), l.unref(), l.pid !== void 0 && o(!0);
      } catch (a) {
        s(a);
      }
    });
  }
}
nt.BaseUpdater = j_;
var kr = {}, rn = {};
Object.defineProperty(rn, "__esModule", { value: !0 });
rn.FileWithEmbeddedBlockMapDifferentialDownloader = void 0;
const zt = _t, B_ = tn, q_ = vc;
class H_ extends B_.DifferentialDownloader {
  async download() {
    const t = this.blockAwareFileInfo, r = t.size, n = r - (t.blockMapSize + 4);
    this.fileMetadataBuffer = await this.readRemoteBytes(n, r - 1);
    const i = Pf(this.fileMetadataBuffer.slice(0, this.fileMetadataBuffer.length - 4));
    await this.doDownload(await G_(this.options.oldFile), i);
  }
}
rn.FileWithEmbeddedBlockMapDifferentialDownloader = H_;
function Pf(e) {
  return JSON.parse((0, q_.inflateRawSync)(e).toString());
}
async function G_(e) {
  const t = await (0, zt.open)(e, "r");
  try {
    const r = (await (0, zt.fstat)(t)).size, n = Buffer.allocUnsafe(4);
    await (0, zt.read)(t, n, 0, n.length, r - n.length);
    const i = Buffer.allocUnsafe(n.readUInt32BE(0));
    return await (0, zt.read)(t, i, 0, i.length, r - n.length - i.length), await (0, zt.close)(t), Pf(i);
  } catch (r) {
    throw await (0, zt.close)(t), r;
  }
}
Object.defineProperty(kr, "__esModule", { value: !0 });
kr.AppImageUpdater = void 0;
const Ol = me, Pl = Wr, W_ = _t, V_ = Le, _r = Q, z_ = nt, Y_ = rn, X_ = fe, Rl = St;
class J_ extends z_.BaseUpdater {
  constructor(t, r) {
    super(t, r);
  }
  isUpdaterActive() {
    return process.env.APPIMAGE == null ? (process.env.SNAP == null ? this._logger.warn("APPIMAGE env is not defined, current application is not an AppImage") : this._logger.info("SNAP env is defined, updater is disabled"), !1) : super.isUpdaterActive();
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, X_.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "AppImage", ["rpm", "deb", "pacman"]);
    return this.executeDownload({
      fileExtension: "AppImage",
      fileInfo: n,
      downloadUpdateOptions: t,
      task: async (i, o) => {
        const s = process.env.APPIMAGE;
        if (s == null)
          throw (0, Ol.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
        (t.disableDifferentialDownload || await this.downloadDifferential(n, s, i, r, t)) && await this.httpExecutor.download(n.url, i, o), await (0, W_.chmod)(i, 493);
      }
    });
  }
  async downloadDifferential(t, r, n, i, o) {
    try {
      const s = {
        newUrl: t.url,
        oldFile: r,
        logger: this._logger,
        newFile: n,
        isUseMultipleRangeRequest: i.isUseMultipleRangeRequest,
        requestHeaders: o.requestHeaders,
        cancellationToken: o.cancellationToken
      };
      return this.listenerCount(Rl.DOWNLOAD_PROGRESS) > 0 && (s.onProgress = (a) => this.emit(Rl.DOWNLOAD_PROGRESS, a)), await new Y_.FileWithEmbeddedBlockMapDifferentialDownloader(t.info, this.httpExecutor, s).download(), !1;
    } catch (s) {
      return this._logger.error(`Cannot download differentially, fallback to full download: ${s.stack || s}`), process.platform === "linux";
    }
  }
  doInstall(t) {
    const r = process.env.APPIMAGE;
    if (r == null)
      throw (0, Ol.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
    (0, V_.unlinkSync)(r);
    let n;
    const i = _r.basename(r), o = this.installerPath;
    if (o == null)
      return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
    _r.basename(o) === i || !/\d+\.\d+\.\d+/.test(i) ? n = r : n = _r.join(_r.dirname(r), _r.basename(o)), (0, Pl.execFileSync)("mv", ["-f", o, n]), n !== r && this.emit("appimage-filename-updated", n);
    const s = {
      ...process.env,
      APPIMAGE_SILENT_INSTALL: "true"
    };
    return t.isForceRunAfter ? this.spawnLog(n, [], s) : (s.APPIMAGE_EXIT_AFTER_INSTALL = "true", (0, Pl.execFileSync)(n, [], { env: s })), !0;
  }
}
kr.AppImageUpdater = J_;
var Mr = {};
Object.defineProperty(Mr, "__esModule", { value: !0 });
Mr.DebUpdater = void 0;
const K_ = nt, Q_ = fe, Il = St;
class Z_ extends K_.BaseUpdater {
  constructor(t, r) {
    super(t, r);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, Q_.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "deb", ["AppImage", "rpm", "pacman"]);
    return this.executeDownload({
      fileExtension: "deb",
      fileInfo: n,
      downloadUpdateOptions: t,
      task: async (i, o) => {
        this.listenerCount(Il.DOWNLOAD_PROGRESS) > 0 && (o.onProgress = (s) => this.emit(Il.DOWNLOAD_PROGRESS, s)), await this.httpExecutor.download(n.url, i, o);
      }
    });
  }
  get installerPath() {
    var t, r;
    return (r = (t = super.installerPath) === null || t === void 0 ? void 0 : t.replace(/ /g, "\\ ")) !== null && r !== void 0 ? r : null;
  }
  doInstall(t) {
    const r = this.wrapSudo(), n = /pkexec/i.test(r) ? "" : '"', i = this.installerPath;
    if (i == null)
      return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
    const o = ["dpkg", "-i", i, "||", "apt-get", "install", "-f", "-y"];
    return this.spawnSyncLog(r, [`${n}/bin/bash`, "-c", `'${o.join(" ")}'${n}`]), t.isForceRunAfter && this.app.relaunch(), !0;
  }
}
Mr.DebUpdater = Z_;
var jr = {};
Object.defineProperty(jr, "__esModule", { value: !0 });
jr.PacmanUpdater = void 0;
const eS = nt, Dl = St, tS = fe;
class rS extends eS.BaseUpdater {
  constructor(t, r) {
    super(t, r);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, tS.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "pacman", ["AppImage", "deb", "rpm"]);
    return this.executeDownload({
      fileExtension: "pacman",
      fileInfo: n,
      downloadUpdateOptions: t,
      task: async (i, o) => {
        this.listenerCount(Dl.DOWNLOAD_PROGRESS) > 0 && (o.onProgress = (s) => this.emit(Dl.DOWNLOAD_PROGRESS, s)), await this.httpExecutor.download(n.url, i, o);
      }
    });
  }
  get installerPath() {
    var t, r;
    return (r = (t = super.installerPath) === null || t === void 0 ? void 0 : t.replace(/ /g, "\\ ")) !== null && r !== void 0 ? r : null;
  }
  doInstall(t) {
    const r = this.wrapSudo(), n = /pkexec/i.test(r) ? "" : '"', i = this.installerPath;
    if (i == null)
      return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
    const o = ["pacman", "-U", "--noconfirm", i];
    return this.spawnSyncLog(r, [`${n}/bin/bash`, "-c", `'${o.join(" ")}'${n}`]), t.isForceRunAfter && this.app.relaunch(), !0;
  }
}
jr.PacmanUpdater = rS;
var Br = {};
Object.defineProperty(Br, "__esModule", { value: !0 });
Br.RpmUpdater = void 0;
const nS = nt, Nl = St, iS = fe;
class oS extends nS.BaseUpdater {
  constructor(t, r) {
    super(t, r);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, iS.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "rpm", ["AppImage", "deb", "pacman"]);
    return this.executeDownload({
      fileExtension: "rpm",
      fileInfo: n,
      downloadUpdateOptions: t,
      task: async (i, o) => {
        this.listenerCount(Nl.DOWNLOAD_PROGRESS) > 0 && (o.onProgress = (s) => this.emit(Nl.DOWNLOAD_PROGRESS, s)), await this.httpExecutor.download(n.url, i, o);
      }
    });
  }
  get installerPath() {
    var t, r;
    return (r = (t = super.installerPath) === null || t === void 0 ? void 0 : t.replace(/ /g, "\\ ")) !== null && r !== void 0 ? r : null;
  }
  doInstall(t) {
    const r = this.wrapSudo(), n = /pkexec/i.test(r) ? "" : '"', i = this.spawnSyncLog("which zypper"), o = this.installerPath;
    if (o == null)
      return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
    let s;
    return i ? s = [i, "--no-refresh", "install", "--allow-unsigned-rpm", "-y", "-f", o] : s = [this.spawnSyncLog("which dnf || which yum"), "-y", "install", o], this.spawnSyncLog(r, [`${n}/bin/bash`, "-c", `'${s.join(" ")}'${n}`]), t.isForceRunAfter && this.app.relaunch(), !0;
  }
}
Br.RpmUpdater = oS;
var qr = {};
Object.defineProperty(qr, "__esModule", { value: !0 });
qr.MacUpdater = void 0;
const $l = me, to = _t, sS = Le, Fl = Q, aS = wc, lS = mt, cS = fe, xl = Wr, Ll = Vr;
class uS extends lS.AppUpdater {
  constructor(t, r) {
    super(t, r), this.nativeUpdater = pt.autoUpdater, this.squirrelDownloadedUpdate = !1, this.nativeUpdater.on("error", (n) => {
      this._logger.warn(n), this.emit("error", n);
    }), this.nativeUpdater.on("update-downloaded", () => {
      this.squirrelDownloadedUpdate = !0, this.debug("nativeUpdater.update-downloaded");
    });
  }
  debug(t) {
    this._logger.debug != null && this._logger.debug(t);
  }
  closeServerIfExists() {
    this.server && (this.debug("Closing proxy server"), this.server.close((t) => {
      t && this.debug("proxy server wasn't already open, probably attempted closing again as a safety check before quit");
    }));
  }
  async doDownloadUpdate(t) {
    let r = t.updateInfoAndProvider.provider.resolveFiles(t.updateInfoAndProvider.info);
    const n = this._logger, i = "sysctl.proc_translated";
    let o = !1;
    try {
      this.debug("Checking for macOS Rosetta environment"), o = (0, xl.execFileSync)("sysctl", [i], { encoding: "utf8" }).includes(`${i}: 1`), n.info(`Checked for macOS Rosetta environment (isRosetta=${o})`);
    } catch (u) {
      n.warn(`sysctl shell command to check for macOS Rosetta environment failed: ${u}`);
    }
    let s = !1;
    try {
      this.debug("Checking for arm64 in uname");
      const h = (0, xl.execFileSync)("uname", ["-a"], { encoding: "utf8" }).includes("ARM");
      n.info(`Checked 'uname -a': arm64=${h}`), s = s || h;
    } catch (u) {
      n.warn(`uname shell command to check for arm64 failed: ${u}`);
    }
    s = s || process.arch === "arm64" || o;
    const a = (u) => {
      var h;
      return u.url.pathname.includes("arm64") || ((h = u.info.url) === null || h === void 0 ? void 0 : h.includes("arm64"));
    };
    s && r.some(a) ? r = r.filter((u) => s === a(u)) : r = r.filter((u) => !a(u));
    const l = (0, cS.findFile)(r, "zip", ["pkg", "dmg"]);
    if (l == null)
      throw (0, $l.newError)(`ZIP file not provided: ${(0, $l.safeStringifyJson)(r)}`, "ERR_UPDATER_ZIP_FILE_NOT_FOUND");
    const f = t.updateInfoAndProvider.provider, c = "update.zip";
    return this.executeDownload({
      fileExtension: "zip",
      fileInfo: l,
      downloadUpdateOptions: t,
      task: async (u, h) => {
        const m = Fl.join(this.downloadedUpdateHelper.cacheDir, c), v = () => (0, to.pathExistsSync)(m) ? !t.disableDifferentialDownload : (n.info("Unable to locate previous update.zip for differential download (is this first install?), falling back to full download"), !1);
        let E = !0;
        v() && (E = await this.differentialDownloadInstaller(l, t, u, f, c)), E && await this.httpExecutor.download(l.url, u, h);
      },
      done: async (u) => {
        if (!t.disableDifferentialDownload)
          try {
            const h = Fl.join(this.downloadedUpdateHelper.cacheDir, c);
            await (0, to.copyFile)(u.downloadedFile, h);
          } catch (h) {
            this._logger.warn(`Unable to copy file for caching for future differential downloads: ${h.message}`);
          }
        return this.updateDownloaded(l, u);
      }
    });
  }
  async updateDownloaded(t, r) {
    var n;
    const i = r.downloadedFile, o = (n = t.info.size) !== null && n !== void 0 ? n : (await (0, to.stat)(i)).size, s = this._logger, a = `fileToProxy=${t.url.href}`;
    this.closeServerIfExists(), this.debug(`Creating proxy server for native Squirrel.Mac (${a})`), this.server = (0, aS.createServer)(), this.debug(`Proxy server for native Squirrel.Mac is created (${a})`), this.server.on("close", () => {
      s.info(`Proxy server for native Squirrel.Mac is closed (${a})`);
    });
    const l = (f) => {
      const c = f.address();
      return typeof c == "string" ? c : `http://127.0.0.1:${c == null ? void 0 : c.port}`;
    };
    return await new Promise((f, c) => {
      const u = (0, Ll.randomBytes)(64).toString("base64").replace(/\//g, "_").replace(/\+/g, "-"), h = Buffer.from(`autoupdater:${u}`, "ascii"), m = `/${(0, Ll.randomBytes)(64).toString("hex")}.zip`;
      this.server.on("request", (v, E) => {
        const S = v.url;
        if (s.info(`${S} requested`), S === "/") {
          if (!v.headers.authorization || v.headers.authorization.indexOf("Basic ") === -1) {
            E.statusCode = 401, E.statusMessage = "Invalid Authentication Credentials", E.end(), s.warn("No authenthication info");
            return;
          }
          const N = v.headers.authorization.split(" ")[1], x = Buffer.from(N, "base64").toString("ascii"), [B, q] = x.split(":");
          if (B !== "autoupdater" || q !== u) {
            E.statusCode = 401, E.statusMessage = "Invalid Authentication Credentials", E.end(), s.warn("Invalid authenthication credentials");
            return;
          }
          const j = Buffer.from(`{ "url": "${l(this.server)}${m}" }`);
          E.writeHead(200, { "Content-Type": "application/json", "Content-Length": j.length }), E.end(j);
          return;
        }
        if (!S.startsWith(m)) {
          s.warn(`${S} requested, but not supported`), E.writeHead(404), E.end();
          return;
        }
        s.info(`${m} requested by Squirrel.Mac, pipe ${i}`);
        let A = !1;
        E.on("finish", () => {
          A || (this.nativeUpdater.removeListener("error", c), f([]));
        });
        const b = (0, sS.createReadStream)(i);
        b.on("error", (N) => {
          try {
            E.end();
          } catch (x) {
            s.warn(`cannot end response: ${x}`);
          }
          A = !0, this.nativeUpdater.removeListener("error", c), c(new Error(`Cannot pipe "${i}": ${N}`));
        }), E.writeHead(200, {
          "Content-Type": "application/zip",
          "Content-Length": o
        }), b.pipe(E);
      }), this.debug(`Proxy server for native Squirrel.Mac is starting to listen (${a})`), this.server.listen(0, "127.0.0.1", () => {
        this.debug(`Proxy server for native Squirrel.Mac is listening (address=${l(this.server)}, ${a})`), this.nativeUpdater.setFeedURL({
          url: l(this.server),
          headers: {
            "Cache-Control": "no-cache",
            Authorization: `Basic ${h.toString("base64")}`
          }
        }), this.dispatchUpdateDownloaded(r), this.autoInstallOnAppQuit ? (this.nativeUpdater.once("error", c), this.nativeUpdater.checkForUpdates()) : f([]);
      });
    });
  }
  handleUpdateDownloaded() {
    this.autoRunAppAfterInstall ? this.nativeUpdater.quitAndInstall() : this.app.quit(), this.closeServerIfExists();
  }
  quitAndInstall() {
    this.squirrelDownloadedUpdate ? this.handleUpdateDownloaded() : (this.nativeUpdater.on("update-downloaded", () => this.handleUpdateDownloaded()), this.autoInstallOnAppQuit || this.nativeUpdater.checkForUpdates());
  }
}
qr.MacUpdater = uS;
var Hr = {}, Ts = {};
Object.defineProperty(Ts, "__esModule", { value: !0 });
Ts.verifySignature = dS;
const Ul = me, Rf = Wr, fS = wt, kl = Q;
function dS(e, t, r) {
  return new Promise((n, i) => {
    const o = t.replace(/'/g, "''");
    r.info(`Verifying signature ${o}`), (0, Rf.execFile)('set "PSModulePath=" & chcp 65001 >NUL & powershell.exe', ["-NoProfile", "-NonInteractive", "-InputFormat", "None", "-Command", `"Get-AuthenticodeSignature -LiteralPath '${o}' | ConvertTo-Json -Compress"`], {
      shell: !0,
      timeout: 20 * 1e3
    }, (s, a, l) => {
      var f;
      try {
        if (s != null || l) {
          ro(r, s, l, i), n(null);
          return;
        }
        const c = hS(a);
        if (c.Status === 0) {
          try {
            const v = kl.normalize(c.Path), E = kl.normalize(t);
            if (r.info(`LiteralPath: ${v}. Update Path: ${E}`), v !== E) {
              ro(r, new Error(`LiteralPath of ${v} is different than ${E}`), l, i), n(null);
              return;
            }
          } catch (v) {
            r.warn(`Unable to verify LiteralPath of update asset due to missing data.Path. Skipping this step of validation. Message: ${(f = v.message) !== null && f !== void 0 ? f : v.stack}`);
          }
          const h = (0, Ul.parseDn)(c.SignerCertificate.Subject);
          let m = !1;
          for (const v of e) {
            const E = (0, Ul.parseDn)(v);
            if (E.size ? m = Array.from(E.keys()).every((A) => E.get(A) === h.get(A)) : v === h.get("CN") && (r.warn(`Signature validated using only CN ${v}. Please add your full Distinguished Name (DN) to publisherNames configuration`), m = !0), m) {
              n(null);
              return;
            }
          }
        }
        const u = `publisherNames: ${e.join(" | ")}, raw info: ` + JSON.stringify(c, (h, m) => h === "RawData" ? void 0 : m, 2);
        r.warn(`Sign verification failed, installer signed with incorrect certificate: ${u}`), n(u);
      } catch (c) {
        ro(r, c, null, i), n(null);
        return;
      }
    });
  });
}
function hS(e) {
  const t = JSON.parse(e);
  delete t.PrivateKey, delete t.IsOSBinary, delete t.SignatureType;
  const r = t.SignerCertificate;
  return r != null && (delete r.Archived, delete r.Extensions, delete r.Handle, delete r.HasPrivateKey, delete r.SubjectName), t;
}
function ro(e, t, r, n) {
  if (pS()) {
    e.warn(`Cannot execute Get-AuthenticodeSignature: ${t || r}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
    return;
  }
  try {
    (0, Rf.execFileSync)("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "ConvertTo-Json test"], { timeout: 10 * 1e3 });
  } catch (i) {
    e.warn(`Cannot execute ConvertTo-Json: ${i.message}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
    return;
  }
  t != null && n(t), r && n(new Error(`Cannot execute Get-AuthenticodeSignature, stderr: ${r}. Failing signature validation due to unknown stderr.`));
}
function pS() {
  const e = fS.release();
  return e.startsWith("6.") && !e.startsWith("6.3");
}
Object.defineProperty(Hr, "__esModule", { value: !0 });
Hr.NsisUpdater = void 0;
const Rn = me, Ml = Q, mS = nt, gS = rn, jl = St, yS = fe, ES = _t, vS = Ts, Bl = ar;
class wS extends mS.BaseUpdater {
  constructor(t, r) {
    super(t, r), this._verifyUpdateCodeSignature = (n, i) => (0, vS.verifySignature)(n, i, this._logger);
  }
  /**
   * The verifyUpdateCodeSignature. You can pass [win-verify-signature](https://github.com/beyondkmp/win-verify-trust) or another custom verify function: ` (publisherName: string[], path: string) => Promise<string | null>`.
   * The default verify function uses [windowsExecutableCodeSignatureVerifier](https://github.com/electron-userland/electron-builder/blob/master/packages/electron-updater/src/windowsExecutableCodeSignatureVerifier.ts)
   */
  get verifyUpdateCodeSignature() {
    return this._verifyUpdateCodeSignature;
  }
  set verifyUpdateCodeSignature(t) {
    t && (this._verifyUpdateCodeSignature = t);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, yS.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "exe");
    return this.executeDownload({
      fileExtension: "exe",
      downloadUpdateOptions: t,
      fileInfo: n,
      task: async (i, o, s, a) => {
        const l = n.packageInfo, f = l != null && s != null;
        if (f && t.disableWebInstaller)
          throw (0, Rn.newError)(`Unable to download new version ${t.updateInfoAndProvider.info.version}. Web Installers are disabled`, "ERR_UPDATER_WEB_INSTALLER_DISABLED");
        !f && !t.disableWebInstaller && this._logger.warn("disableWebInstaller is set to false, you should set it to true if you do not plan on using a web installer. This will default to true in a future version."), (f || t.disableDifferentialDownload || await this.differentialDownloadInstaller(n, t, i, r, Rn.CURRENT_APP_INSTALLER_FILE_NAME)) && await this.httpExecutor.download(n.url, i, o);
        const c = await this.verifySignature(i);
        if (c != null)
          throw await a(), (0, Rn.newError)(`New version ${t.updateInfoAndProvider.info.version} is not signed by the application owner: ${c}`, "ERR_UPDATER_INVALID_SIGNATURE");
        if (f && await this.differentialDownloadWebPackage(t, l, s, r))
          try {
            await this.httpExecutor.download(new Bl.URL(l.path), s, {
              headers: t.requestHeaders,
              cancellationToken: t.cancellationToken,
              sha512: l.sha512
            });
          } catch (u) {
            try {
              await (0, ES.unlink)(s);
            } catch {
            }
            throw u;
          }
      }
    });
  }
  // $certificateInfo = (Get-AuthenticodeSignature 'xxx\yyy.exe'
  // | where {$_.Status.Equals([System.Management.Automation.SignatureStatus]::Valid) -and $_.SignerCertificate.Subject.Contains("CN=siemens.com")})
  // | Out-String ; if ($certificateInfo) { exit 0 } else { exit 1 }
  async verifySignature(t) {
    let r;
    try {
      if (r = (await this.configOnDisk.value).publisherName, r == null)
        return null;
    } catch (n) {
      if (n.code === "ENOENT")
        return null;
      throw n;
    }
    return await this._verifyUpdateCodeSignature(Array.isArray(r) ? r : [r], t);
  }
  doInstall(t) {
    const r = this.installerPath;
    if (r == null)
      return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
    const n = ["--updated"];
    t.isSilent && n.push("/S"), t.isForceRunAfter && n.push("--force-run"), this.installDirectory && n.push(`/D=${this.installDirectory}`);
    const i = this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.packageFile;
    i != null && n.push(`--package-file=${i}`);
    const o = () => {
      this.spawnLog(Ml.join(process.resourcesPath, "elevate.exe"), [r].concat(n)).catch((s) => this.dispatchError(s));
    };
    return t.isAdminRightsRequired ? (this._logger.info("isAdminRightsRequired is set to true, run installer using elevate.exe"), o(), !0) : (this.spawnLog(r, n).catch((s) => {
      const a = s.code;
      this._logger.info(`Cannot run installer: error code: ${a}, error message: "${s.message}", will be executed again using elevate if EACCES, and will try to use electron.shell.openItem if ENOENT`), a === "UNKNOWN" || a === "EACCES" ? o() : a === "ENOENT" ? pt.shell.openPath(r).catch((l) => this.dispatchError(l)) : this.dispatchError(s);
    }), !0);
  }
  async differentialDownloadWebPackage(t, r, n, i) {
    if (r.blockMapSize == null)
      return !0;
    try {
      const o = {
        newUrl: new Bl.URL(r.path),
        oldFile: Ml.join(this.downloadedUpdateHelper.cacheDir, Rn.CURRENT_APP_PACKAGE_FILE_NAME),
        logger: this._logger,
        newFile: n,
        requestHeaders: this.requestHeaders,
        isUseMultipleRangeRequest: i.isUseMultipleRangeRequest,
        cancellationToken: t.cancellationToken
      };
      this.listenerCount(jl.DOWNLOAD_PROGRESS) > 0 && (o.onProgress = (s) => this.emit(jl.DOWNLOAD_PROGRESS, s)), await new gS.FileWithEmbeddedBlockMapDifferentialDownloader(r, this.httpExecutor, o).download();
    } catch (o) {
      return this._logger.error(`Cannot download differentially, fallback to full download: ${o.stack || o}`), process.platform === "win32";
    }
    return !1;
  }
}
Hr.NsisUpdater = wS;
(function(e) {
  var t = Te && Te.__createBinding || (Object.create ? function(S, A, b, N) {
    N === void 0 && (N = b);
    var x = Object.getOwnPropertyDescriptor(A, b);
    (!x || ("get" in x ? !A.__esModule : x.writable || x.configurable)) && (x = { enumerable: !0, get: function() {
      return A[b];
    } }), Object.defineProperty(S, N, x);
  } : function(S, A, b, N) {
    N === void 0 && (N = b), S[N] = A[b];
  }), r = Te && Te.__exportStar || function(S, A) {
    for (var b in S) b !== "default" && !Object.prototype.hasOwnProperty.call(A, b) && t(A, S, b);
  };
  Object.defineProperty(e, "__esModule", { value: !0 }), e.NsisUpdater = e.MacUpdater = e.RpmUpdater = e.PacmanUpdater = e.DebUpdater = e.AppImageUpdater = e.Provider = e.NoOpLogger = e.AppUpdater = e.BaseUpdater = void 0;
  const n = _t, i = Q;
  var o = nt;
  Object.defineProperty(e, "BaseUpdater", { enumerable: !0, get: function() {
    return o.BaseUpdater;
  } });
  var s = mt;
  Object.defineProperty(e, "AppUpdater", { enumerable: !0, get: function() {
    return s.AppUpdater;
  } }), Object.defineProperty(e, "NoOpLogger", { enumerable: !0, get: function() {
    return s.NoOpLogger;
  } });
  var a = fe;
  Object.defineProperty(e, "Provider", { enumerable: !0, get: function() {
    return a.Provider;
  } });
  var l = kr;
  Object.defineProperty(e, "AppImageUpdater", { enumerable: !0, get: function() {
    return l.AppImageUpdater;
  } });
  var f = Mr;
  Object.defineProperty(e, "DebUpdater", { enumerable: !0, get: function() {
    return f.DebUpdater;
  } });
  var c = jr;
  Object.defineProperty(e, "PacmanUpdater", { enumerable: !0, get: function() {
    return c.PacmanUpdater;
  } });
  var u = Br;
  Object.defineProperty(e, "RpmUpdater", { enumerable: !0, get: function() {
    return u.RpmUpdater;
  } });
  var h = qr;
  Object.defineProperty(e, "MacUpdater", { enumerable: !0, get: function() {
    return h.MacUpdater;
  } });
  var m = Hr;
  Object.defineProperty(e, "NsisUpdater", { enumerable: !0, get: function() {
    return m.NsisUpdater;
  } }), r(St, e);
  let v;
  function E() {
    if (process.platform === "win32")
      v = new Hr.NsisUpdater();
    else if (process.platform === "darwin")
      v = new qr.MacUpdater();
    else {
      v = new kr.AppImageUpdater();
      try {
        const S = i.join(process.resourcesPath, "package-type");
        if (!(0, n.existsSync)(S))
          return v;
        console.info("Checking for beta autoupdate feature for deb/rpm distributions");
        const A = (0, n.readFileSync)(S).toString().trim();
        switch (console.info("Found package-type:", A), A) {
          case "deb":
            v = new Mr.DebUpdater();
            break;
          case "rpm":
            v = new Br.RpmUpdater();
            break;
          case "pacman":
            v = new jr.PacmanUpdater();
            break;
          default:
            break;
        }
      } catch (S) {
        console.warn("Unable to detect 'package-type' for autoUpdater (beta rpm/deb support). If you'd like to expand support, please consider contributing to electron-builder", S.message);
      }
    }
    return v;
  }
  Object.defineProperty(e, "autoUpdater", {
    enumerable: !0,
    get: () => v || E()
  });
})(Me);
var Fn = { exports: {} }, no = { exports: {} }, ql;
function If() {
  return ql || (ql = 1, function(e) {
    let t = {};
    try {
      t = require("electron");
    } catch {
    }
    t.ipcRenderer && r(t), e.exports = r;
    function r({ contextBridge: n, ipcRenderer: i }) {
      if (!i)
        return;
      i.on("__ELECTRON_LOG_IPC__", (s, a) => {
        window.postMessage({ cmd: "message", ...a });
      }), i.invoke("__ELECTRON_LOG__", { cmd: "getOptions" }).catch((s) => console.error(new Error(
        `electron-log isn't initialized in the main process. Please call log.initialize() before. ${s.message}`
      )));
      const o = {
        sendToMain(s) {
          try {
            i.send("__ELECTRON_LOG__", s);
          } catch (a) {
            console.error("electronLog.sendToMain ", a, "data:", s), i.send("__ELECTRON_LOG__", {
              cmd: "errorHandler",
              error: { message: a == null ? void 0 : a.message, stack: a == null ? void 0 : a.stack },
              errorName: "sendToMain"
            });
          }
        },
        log(...s) {
          o.sendToMain({ data: s, level: "info" });
        }
      };
      for (const s of ["error", "warn", "info", "verbose", "debug", "silly"])
        o[s] = (...a) => o.sendToMain({
          data: a,
          level: s
        });
      if (n && process.contextIsolated)
        try {
          n.exposeInMainWorld("__electronLog", o);
        } catch {
        }
      typeof window == "object" ? window.__electronLog = o : __electronLog = o;
    }
  }(no)), no.exports;
}
var io = { exports: {} }, oo, Hl;
function _S() {
  if (Hl) return oo;
  Hl = 1, oo = e;
  function e(t) {
    return Object.defineProperties(r, {
      defaultLabel: { value: "", writable: !0 },
      labelPadding: { value: !0, writable: !0 },
      maxLabelLength: { value: 0, writable: !0 },
      labelLength: {
        get() {
          switch (typeof r.labelPadding) {
            case "boolean":
              return r.labelPadding ? r.maxLabelLength : 0;
            case "number":
              return r.labelPadding;
            default:
              return 0;
          }
        }
      }
    });
    function r(n) {
      r.maxLabelLength = Math.max(r.maxLabelLength, n.length);
      const i = {};
      for (const o of t.levels)
        i[o] = (...s) => t.logData(s, { level: o, scope: n });
      return i.log = i.info, i;
    }
  }
  return oo;
}
var so, Gl;
function SS() {
  if (Gl) return so;
  Gl = 1;
  class e {
    constructor({ processMessage: r }) {
      this.processMessage = r, this.buffer = [], this.enabled = !1, this.begin = this.begin.bind(this), this.commit = this.commit.bind(this), this.reject = this.reject.bind(this);
    }
    addMessage(r) {
      this.buffer.push(r);
    }
    begin() {
      this.enabled = [];
    }
    commit() {
      this.enabled = !1, this.buffer.forEach((r) => this.processMessage(r)), this.buffer = [];
    }
    reject() {
      this.enabled = !1, this.buffer = [];
    }
  }
  return so = e, so;
}
var ao, Wl;
function Df() {
  if (Wl) return ao;
  Wl = 1;
  const e = _S(), t = SS(), n = class n {
    constructor({
      allowUnknownLevel: o = !1,
      dependencies: s = {},
      errorHandler: a,
      eventLogger: l,
      initializeFn: f,
      isDev: c = !1,
      levels: u = ["error", "warn", "info", "verbose", "debug", "silly"],
      logId: h,
      transportFactories: m = {},
      variables: v
    } = {}) {
      V(this, "dependencies", {});
      V(this, "errorHandler", null);
      V(this, "eventLogger", null);
      V(this, "functions", {});
      V(this, "hooks", []);
      V(this, "isDev", !1);
      V(this, "levels", null);
      V(this, "logId", null);
      V(this, "scope", null);
      V(this, "transports", {});
      V(this, "variables", {});
      this.addLevel = this.addLevel.bind(this), this.create = this.create.bind(this), this.initialize = this.initialize.bind(this), this.logData = this.logData.bind(this), this.processMessage = this.processMessage.bind(this), this.allowUnknownLevel = o, this.buffering = new t(this), this.dependencies = s, this.initializeFn = f, this.isDev = c, this.levels = u, this.logId = h, this.scope = e(this), this.transportFactories = m, this.variables = v || {};
      for (const E of this.levels)
        this.addLevel(E, !1);
      this.log = this.info, this.functions.log = this.log, this.errorHandler = a, a == null || a.setOptions({ ...s, logFn: this.error }), this.eventLogger = l, l == null || l.setOptions({ ...s, logger: this });
      for (const [E, S] of Object.entries(m))
        this.transports[E] = S(this, s);
      n.instances[h] = this;
    }
    static getInstance({ logId: o }) {
      return this.instances[o] || this.instances.default;
    }
    addLevel(o, s = this.levels.length) {
      s !== !1 && this.levels.splice(s, 0, o), this[o] = (...a) => this.logData(a, { level: o }), this.functions[o] = this[o];
    }
    catchErrors(o) {
      return this.processMessage(
        {
          data: ["log.catchErrors is deprecated. Use log.errorHandler instead"],
          level: "warn"
        },
        { transports: ["console"] }
      ), this.errorHandler.startCatching(o);
    }
    create(o) {
      return typeof o == "string" && (o = { logId: o }), new n({
        dependencies: this.dependencies,
        errorHandler: this.errorHandler,
        initializeFn: this.initializeFn,
        isDev: this.isDev,
        transportFactories: this.transportFactories,
        variables: { ...this.variables },
        ...o
      });
    }
    compareLevels(o, s, a = this.levels) {
      const l = a.indexOf(o), f = a.indexOf(s);
      return f === -1 || l === -1 ? !0 : f <= l;
    }
    initialize(o = {}) {
      this.initializeFn({ logger: this, ...this.dependencies, ...o });
    }
    logData(o, s = {}) {
      this.buffering.enabled ? this.buffering.addMessage({ data: o, date: /* @__PURE__ */ new Date(), ...s }) : this.processMessage({ data: o, ...s });
    }
    processMessage(o, { transports: s = this.transports } = {}) {
      if (o.cmd === "errorHandler") {
        this.errorHandler.handle(o.error, {
          errorName: o.errorName,
          processType: "renderer",
          showDialog: !!o.showDialog
        });
        return;
      }
      let a = o.level;
      this.allowUnknownLevel || (a = this.levels.includes(o.level) ? o.level : "info");
      const l = {
        date: /* @__PURE__ */ new Date(),
        logId: this.logId,
        ...o,
        level: a,
        variables: {
          ...this.variables,
          ...o.variables
        }
      };
      for (const [f, c] of this.transportEntries(s))
        if (!(typeof c != "function" || c.level === !1) && this.compareLevels(c.level, o.level))
          try {
            const u = this.hooks.reduce((h, m) => h && m(h, c, f), l);
            u && c({ ...u, data: [...u.data] });
          } catch (u) {
            this.processInternalErrorFn(u);
          }
    }
    processInternalErrorFn(o) {
    }
    transportEntries(o = this.transports) {
      return (Array.isArray(o) ? o : Object.entries(o)).map((a) => {
        switch (typeof a) {
          case "string":
            return this.transports[a] ? [a, this.transports[a]] : null;
          case "function":
            return [a.name, a];
          default:
            return Array.isArray(a) ? a : null;
        }
      }).filter(Boolean);
    }
  };
  V(n, "instances", {});
  let r = n;
  return ao = r, ao;
}
var lo, Vl;
function AS() {
  if (Vl) return lo;
  Vl = 1;
  const e = console.error;
  class t {
    constructor({ logFn: n = null } = {}) {
      V(this, "logFn", null);
      V(this, "onError", null);
      V(this, "showDialog", !1);
      V(this, "preventDefault", !0);
      this.handleError = this.handleError.bind(this), this.handleRejection = this.handleRejection.bind(this), this.startCatching = this.startCatching.bind(this), this.logFn = n;
    }
    handle(n, {
      logFn: i = this.logFn,
      errorName: o = "",
      onError: s = this.onError,
      showDialog: a = this.showDialog
    } = {}) {
      try {
        (s == null ? void 0 : s({ error: n, errorName: o, processType: "renderer" })) !== !1 && i({ error: n, errorName: o, showDialog: a });
      } catch {
        e(n);
      }
    }
    setOptions({ logFn: n, onError: i, preventDefault: o, showDialog: s }) {
      typeof n == "function" && (this.logFn = n), typeof i == "function" && (this.onError = i), typeof o == "boolean" && (this.preventDefault = o), typeof s == "boolean" && (this.showDialog = s);
    }
    startCatching({ onError: n, showDialog: i } = {}) {
      this.isActive || (this.isActive = !0, this.setOptions({ onError: n, showDialog: i }), window.addEventListener("error", (o) => {
        var s;
        this.preventDefault && ((s = o.preventDefault) == null || s.call(o)), this.handleError(o.error || o);
      }), window.addEventListener("unhandledrejection", (o) => {
        var s;
        this.preventDefault && ((s = o.preventDefault) == null || s.call(o)), this.handleRejection(o.reason || o);
      }));
    }
    handleError(n) {
      this.handle(n, { errorName: "Unhandled" });
    }
    handleRejection(n) {
      const i = n instanceof Error ? n : new Error(JSON.stringify(n));
      this.handle(i, { errorName: "Unhandled rejection" });
    }
  }
  return lo = t, lo;
}
var co, zl;
function jt() {
  if (zl) return co;
  zl = 1, co = { transform: e };
  function e({
    logger: t,
    message: r,
    transport: n,
    initialData: i = (r == null ? void 0 : r.data) || [],
    transforms: o = n == null ? void 0 : n.transforms
  }) {
    return o.reduce((s, a) => typeof a == "function" ? a({ data: s, logger: t, message: r, transport: n }) : s, i);
  }
  return co;
}
var uo, Yl;
function bS() {
  if (Yl) return uo;
  Yl = 1;
  const { transform: e } = jt();
  uo = r;
  const t = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    verbose: console.info,
    debug: console.debug,
    silly: console.debug,
    log: console.log
  };
  function r(i) {
    return Object.assign(o, {
      format: "{h}:{i}:{s}.{ms}{scope} › {text}",
      transforms: [n],
      writeFn({ message: { level: s, data: a } }) {
        const l = t[s] || t.info;
        setTimeout(() => l(...a));
      }
    });
    function o(s) {
      o.writeFn({
        message: { ...s, data: e({ logger: i, message: s, transport: o }) }
      });
    }
  }
  function n({
    data: i = [],
    logger: o = {},
    message: s = {},
    transport: a = {}
  }) {
    if (typeof a.format == "function")
      return a.format({
        data: i,
        level: (s == null ? void 0 : s.level) || "info",
        logger: o,
        message: s,
        transport: a
      });
    if (typeof a.format != "string")
      return i;
    i.unshift(a.format), typeof i[1] == "string" && i[1].match(/%[1cdfiOos]/) && (i = [`${i[0]}${i[1]}`, ...i.slice(2)]);
    const l = s.date || /* @__PURE__ */ new Date();
    return i[0] = i[0].replace(/\{(\w+)}/g, (f, c) => {
      var u, h;
      switch (c) {
        case "level":
          return s.level;
        case "logId":
          return s.logId;
        case "scope": {
          const m = s.scope || ((u = o.scope) == null ? void 0 : u.defaultLabel);
          return m ? ` (${m})` : "";
        }
        case "text":
          return "";
        case "y":
          return l.getFullYear().toString(10);
        case "m":
          return (l.getMonth() + 1).toString(10).padStart(2, "0");
        case "d":
          return l.getDate().toString(10).padStart(2, "0");
        case "h":
          return l.getHours().toString(10).padStart(2, "0");
        case "i":
          return l.getMinutes().toString(10).padStart(2, "0");
        case "s":
          return l.getSeconds().toString(10).padStart(2, "0");
        case "ms":
          return l.getMilliseconds().toString(10).padStart(3, "0");
        case "iso":
          return l.toISOString();
        default:
          return ((h = s.variables) == null ? void 0 : h[c]) || f;
      }
    }).trim(), i;
  }
  return uo;
}
var fo, Xl;
function TS() {
  if (Xl) return fo;
  Xl = 1;
  const { transform: e } = jt();
  fo = r;
  const t = /* @__PURE__ */ new Set([Promise, WeakMap, WeakSet]);
  function r(o) {
    return Object.assign(s, {
      depth: 5,
      transforms: [i]
    });
    function s(a) {
      if (!window.__electronLog) {
        o.processMessage(
          {
            data: ["electron-log: logger isn't initialized in the main process"],
            level: "error"
          },
          { transports: ["console"] }
        );
        return;
      }
      try {
        const l = e({
          initialData: a,
          logger: o,
          message: a,
          transport: s
        });
        __electronLog.sendToMain(l);
      } catch (l) {
        o.transports.console({
          data: ["electronLog.transports.ipc", l, "data:", a.data],
          level: "error"
        });
      }
    }
  }
  function n(o) {
    return Object(o) !== o;
  }
  function i({
    data: o,
    depth: s,
    seen: a = /* @__PURE__ */ new WeakSet(),
    transport: l = {}
  } = {}) {
    const f = s || l.depth || 5;
    return a.has(o) ? "[Circular]" : f < 1 ? n(o) ? o : Array.isArray(o) ? "[Array]" : `[${typeof o}]` : ["function", "symbol"].includes(typeof o) ? o.toString() : n(o) ? o : t.has(o.constructor) ? `[${o.constructor.name}]` : Array.isArray(o) ? o.map((c) => i({
      data: c,
      depth: f - 1,
      seen: a
    })) : o instanceof Date ? o.toISOString() : o instanceof Error ? o.stack : o instanceof Map ? new Map(
      Array.from(o).map(([c, u]) => [
        i({ data: c, depth: f - 1, seen: a }),
        i({ data: u, depth: f - 1, seen: a })
      ])
    ) : o instanceof Set ? new Set(
      Array.from(o).map(
        (c) => i({ data: c, depth: f - 1, seen: a })
      )
    ) : (a.add(o), Object.fromEntries(
      Object.entries(o).map(
        ([c, u]) => [
          c,
          i({ data: u, depth: f - 1, seen: a })
        ]
      )
    ));
  }
  return fo;
}
var Jl;
function CS() {
  return Jl || (Jl = 1, function(e) {
    const t = Df(), r = AS(), n = bS(), i = TS();
    typeof process == "object" && process.type === "browser" && console.warn(
      "electron-log/renderer is loaded in the main process. It could cause unexpected behaviour."
    ), e.exports = o(), e.exports.Logger = t, e.exports.default = e.exports;
    function o() {
      const s = new t({
        allowUnknownLevel: !0,
        errorHandler: new r(),
        initializeFn: () => {
        },
        logId: "default",
        transportFactories: {
          console: n,
          ipc: i
        },
        variables: {
          processType: "renderer"
        }
      });
      return s.errorHandler.setOptions({
        logFn({ error: a, errorName: l, showDialog: f }) {
          s.transports.console({
            data: [l, a].filter(Boolean),
            level: "error"
          }), s.transports.ipc({
            cmd: "errorHandler",
            error: {
              cause: a == null ? void 0 : a.cause,
              code: a == null ? void 0 : a.code,
              name: a == null ? void 0 : a.name,
              message: a == null ? void 0 : a.message,
              stack: a == null ? void 0 : a.stack
            },
            errorName: l,
            logId: s.logId,
            showDialog: f
          });
        }
      }), typeof window == "object" && window.addEventListener("message", (a) => {
        const { cmd: l, logId: f, ...c } = a.data || {}, u = t.getInstance({ logId: f });
        l === "message" && u.processMessage(c, { transports: ["console"] });
      }), new Proxy(s, {
        get(a, l) {
          return typeof a[l] < "u" ? a[l] : (...f) => s.logData(f, { level: l });
        }
      });
    }
  }(io)), io.exports;
}
var ho, Kl;
function OS() {
  if (Kl) return ho;
  Kl = 1;
  const e = Le, t = Q;
  ho = {
    findAndReadPackageJson: r,
    tryReadJsonAt: n
  };
  function r() {
    return n(s()) || n(o()) || n(process.resourcesPath, "app.asar") || n(process.resourcesPath, "app") || n(process.cwd()) || { name: void 0, version: void 0 };
  }
  function n(...a) {
    if (a[0])
      try {
        const l = t.join(...a), f = i("package.json", l);
        if (!f)
          return;
        const c = JSON.parse(e.readFileSync(f, "utf8")), u = (c == null ? void 0 : c.productName) || (c == null ? void 0 : c.name);
        return !u || u.toLowerCase() === "electron" ? void 0 : u ? { name: u, version: c == null ? void 0 : c.version } : void 0;
      } catch {
        return;
      }
  }
  function i(a, l) {
    let f = l;
    for (; ; ) {
      const c = t.parse(f), u = c.root, h = c.dir;
      if (e.existsSync(t.join(f, a)))
        return t.resolve(t.join(f, a));
      if (f === u)
        return null;
      f = h;
    }
  }
  function o() {
    const a = process.argv.filter((f) => f.indexOf("--user-data-dir=") === 0);
    return a.length === 0 || typeof a[0] != "string" ? null : a[0].replace("--user-data-dir=", "");
  }
  function s() {
    var a;
    try {
      return (a = require.main) == null ? void 0 : a.filename;
    } catch {
      return;
    }
  }
  return ho;
}
var po, Ql;
function Nf() {
  if (Ql) return po;
  Ql = 1;
  const e = Wr, t = wt, r = Q, n = OS();
  class i {
    constructor() {
      V(this, "appName");
      V(this, "appPackageJson");
      V(this, "platform", process.platform);
    }
    getAppLogPath(s = this.getAppName()) {
      return this.platform === "darwin" ? r.join(this.getSystemPathHome(), "Library/Logs", s) : r.join(this.getAppUserDataPath(s), "logs");
    }
    getAppName() {
      var a;
      const s = this.appName || ((a = this.getAppPackageJson()) == null ? void 0 : a.name);
      if (!s)
        throw new Error(
          "electron-log can't determine the app name. It tried these methods:\n1. Use `electron.app.name`\n2. Use productName or name from the nearest package.json`\nYou can also set it through log.transports.file.setAppName()"
        );
      return s;
    }
    /**
     * @private
     * @returns {undefined}
     */
    getAppPackageJson() {
      return typeof this.appPackageJson != "object" && (this.appPackageJson = n.findAndReadPackageJson()), this.appPackageJson;
    }
    getAppUserDataPath(s = this.getAppName()) {
      return s ? r.join(this.getSystemPathAppData(), s) : void 0;
    }
    getAppVersion() {
      var s;
      return (s = this.getAppPackageJson()) == null ? void 0 : s.version;
    }
    getElectronLogPath() {
      return this.getAppLogPath();
    }
    getMacOsVersion() {
      const s = Number(t.release().split(".")[0]);
      return s <= 19 ? `10.${s - 4}` : s - 9;
    }
    /**
     * @protected
     * @returns {string}
     */
    getOsVersion() {
      let s = t.type().replace("_", " "), a = t.release();
      return s === "Darwin" && (s = "macOS", a = this.getMacOsVersion()), `${s} ${a}`;
    }
    /**
     * @return {PathVariables}
     */
    getPathVariables() {
      const s = this.getAppName(), a = this.getAppVersion(), l = this;
      return {
        appData: this.getSystemPathAppData(),
        appName: s,
        appVersion: a,
        get electronDefaultDir() {
          return l.getElectronLogPath();
        },
        home: this.getSystemPathHome(),
        libraryDefaultDir: this.getAppLogPath(s),
        libraryTemplate: this.getAppLogPath("{appName}"),
        temp: this.getSystemPathTemp(),
        userData: this.getAppUserDataPath(s)
      };
    }
    getSystemPathAppData() {
      const s = this.getSystemPathHome();
      switch (this.platform) {
        case "darwin":
          return r.join(s, "Library/Application Support");
        case "win32":
          return process.env.APPDATA || r.join(s, "AppData/Roaming");
        default:
          return process.env.XDG_CONFIG_HOME || r.join(s, ".config");
      }
    }
    getSystemPathHome() {
      var s;
      return ((s = t.homedir) == null ? void 0 : s.call(t)) || process.env.HOME;
    }
    getSystemPathTemp() {
      return t.tmpdir();
    }
    getVersions() {
      return {
        app: `${this.getAppName()} ${this.getAppVersion()}`,
        electron: void 0,
        os: this.getOsVersion()
      };
    }
    isDev() {
      return process.env.NODE_ENV === "development" || process.env.ELECTRON_IS_DEV === "1";
    }
    isElectron() {
      return !!process.versions.electron;
    }
    onAppEvent(s, a) {
    }
    onAppReady(s) {
      s();
    }
    onEveryWebContentsEvent(s, a) {
    }
    /**
     * Listen to async messages sent from opposite process
     * @param {string} channel
     * @param {function} listener
     */
    onIpc(s, a) {
    }
    onIpcInvoke(s, a) {
    }
    /**
     * @param {string} url
     * @param {Function} [logFunction]
     */
    openUrl(s, a = console.error) {
      const f = { darwin: "open", win32: "start", linux: "xdg-open" }[process.platform] || "xdg-open";
      e.exec(`${f} ${s}`, {}, (c) => {
        c && a(c);
      });
    }
    setAppName(s) {
      this.appName = s;
    }
    setPlatform(s) {
      this.platform = s;
    }
    setPreloadFileForSessions({
      filePath: s,
      // eslint-disable-line no-unused-vars
      includeFutureSession: a = !0,
      // eslint-disable-line no-unused-vars
      getSessions: l = () => []
      // eslint-disable-line no-unused-vars
    }) {
    }
    /**
     * Sent a message to opposite process
     * @param {string} channel
     * @param {any} message
     */
    sendIpc(s, a) {
    }
    showErrorBox(s, a) {
    }
  }
  return po = i, po;
}
var mo, Zl;
function PS() {
  if (Zl) return mo;
  Zl = 1;
  const e = Q, t = Nf();
  class r extends t {
    /**
     * @param {object} options
     * @param {typeof Electron} [options.electron]
     */
    constructor({ electron: o } = {}) {
      super();
      /**
       * @type {typeof Electron}
       */
      V(this, "electron");
      this.electron = o;
    }
    getAppName() {
      var s, a;
      let o;
      try {
        o = this.appName || ((s = this.electron.app) == null ? void 0 : s.name) || ((a = this.electron.app) == null ? void 0 : a.getName());
      } catch {
      }
      return o || super.getAppName();
    }
    getAppUserDataPath(o) {
      return this.getPath("userData") || super.getAppUserDataPath(o);
    }
    getAppVersion() {
      var s;
      let o;
      try {
        o = (s = this.electron.app) == null ? void 0 : s.getVersion();
      } catch {
      }
      return o || super.getAppVersion();
    }
    getElectronLogPath() {
      return this.getPath("logs") || super.getElectronLogPath();
    }
    /**
     * @private
     * @param {any} name
     * @returns {string|undefined}
     */
    getPath(o) {
      var s;
      try {
        return (s = this.electron.app) == null ? void 0 : s.getPath(o);
      } catch {
        return;
      }
    }
    getVersions() {
      return {
        app: `${this.getAppName()} ${this.getAppVersion()}`,
        electron: `Electron ${process.versions.electron}`,
        os: this.getOsVersion()
      };
    }
    getSystemPathAppData() {
      return this.getPath("appData") || super.getSystemPathAppData();
    }
    isDev() {
      var o;
      return ((o = this.electron.app) == null ? void 0 : o.isPackaged) !== void 0 ? !this.electron.app.isPackaged : typeof process.execPath == "string" ? e.basename(process.execPath).toLowerCase().startsWith("electron") : super.isDev();
    }
    onAppEvent(o, s) {
      var a;
      return (a = this.electron.app) == null || a.on(o, s), () => {
        var l;
        (l = this.electron.app) == null || l.off(o, s);
      };
    }
    onAppReady(o) {
      var s, a, l;
      (s = this.electron.app) != null && s.isReady() ? o() : (a = this.electron.app) != null && a.once ? (l = this.electron.app) == null || l.once("ready", o) : o();
    }
    onEveryWebContentsEvent(o, s) {
      var l, f, c;
      return (f = (l = this.electron.webContents) == null ? void 0 : l.getAllWebContents()) == null || f.forEach((u) => {
        u.on(o, s);
      }), (c = this.electron.app) == null || c.on("web-contents-created", a), () => {
        var u, h;
        (u = this.electron.webContents) == null || u.getAllWebContents().forEach((m) => {
          m.off(o, s);
        }), (h = this.electron.app) == null || h.off("web-contents-created", a);
      };
      function a(u, h) {
        h.on(o, s);
      }
    }
    /**
     * Listen to async messages sent from opposite process
     * @param {string} channel
     * @param {function} listener
     */
    onIpc(o, s) {
      var a;
      (a = this.electron.ipcMain) == null || a.on(o, s);
    }
    onIpcInvoke(o, s) {
      var a, l;
      (l = (a = this.electron.ipcMain) == null ? void 0 : a.handle) == null || l.call(a, o, s);
    }
    /**
     * @param {string} url
     * @param {Function} [logFunction]
     */
    openUrl(o, s = console.error) {
      var a;
      (a = this.electron.shell) == null || a.openExternal(o).catch(s);
    }
    setPreloadFileForSessions({
      filePath: o,
      includeFutureSession: s = !0,
      getSessions: a = () => {
        var l;
        return [(l = this.electron.session) == null ? void 0 : l.defaultSession];
      }
    }) {
      for (const f of a().filter(Boolean))
        l(f);
      s && this.onAppEvent("session-created", (f) => {
        l(f);
      });
      function l(f) {
        typeof f.registerPreloadScript == "function" ? f.registerPreloadScript({
          filePath: o,
          id: "electron-log-preload",
          type: "frame"
        }) : f.setPreloads([...f.getPreloads(), o]);
      }
    }
    /**
     * Sent a message to opposite process
     * @param {string} channel
     * @param {any} message
     */
    sendIpc(o, s) {
      var a, l;
      (l = (a = this.electron.BrowserWindow) == null ? void 0 : a.getAllWindows()) == null || l.forEach((f) => {
        var c, u;
        ((c = f.webContents) == null ? void 0 : c.isDestroyed()) === !1 && ((u = f.webContents) == null ? void 0 : u.isCrashed()) === !1 && f.webContents.send(o, s);
      });
    }
    showErrorBox(o, s) {
      var a;
      (a = this.electron.dialog) == null || a.showErrorBox(o, s);
    }
  }
  return mo = r, mo;
}
var go, ec;
function RS() {
  if (ec) return go;
  ec = 1;
  const e = Le, t = wt, r = Q, n = If();
  let i = !1, o = !1;
  go = {
    initialize({
      externalApi: l,
      getSessions: f,
      includeFutureSession: c,
      logger: u,
      preload: h = !0,
      spyRendererConsole: m = !1
    }) {
      l.onAppReady(() => {
        try {
          h && s({
            externalApi: l,
            getSessions: f,
            includeFutureSession: c,
            logger: u,
            preloadOption: h
          }), m && a({ externalApi: l, logger: u });
        } catch (v) {
          u.warn(v);
        }
      });
    }
  };
  function s({
    externalApi: l,
    getSessions: f,
    includeFutureSession: c,
    logger: u,
    preloadOption: h
  }) {
    let m = typeof h == "string" ? h : void 0;
    if (i) {
      u.warn(new Error("log.initialize({ preload }) already called").stack);
      return;
    }
    i = !0;
    try {
      m = r.resolve(
        __dirname,
        "../renderer/electron-log-preload.js"
      );
    } catch {
    }
    if (!m || !e.existsSync(m)) {
      m = r.join(
        l.getAppUserDataPath() || t.tmpdir(),
        "electron-log-preload.js"
      );
      const v = `
      try {
        (${n.toString()})(require('electron'));
      } catch(e) {
        console.error(e);
      }
    `;
      e.writeFileSync(m, v, "utf8");
    }
    l.setPreloadFileForSessions({
      filePath: m,
      includeFutureSession: c,
      getSessions: f
    });
  }
  function a({ externalApi: l, logger: f }) {
    if (o) {
      f.warn(
        new Error("log.initialize({ spyRendererConsole }) already called").stack
      );
      return;
    }
    o = !0;
    const c = ["debug", "info", "warn", "error"];
    l.onEveryWebContentsEvent(
      "console-message",
      (u, h, m) => {
        f.processMessage({
          data: [m],
          level: c[h],
          variables: { processType: "renderer" }
        });
      }
    );
  }
  return go;
}
var yo, tc;
function IS() {
  if (tc) return yo;
  tc = 1;
  class e {
    constructor({
      externalApi: n,
      logFn: i = void 0,
      onError: o = void 0,
      showDialog: s = void 0
    } = {}) {
      V(this, "externalApi");
      V(this, "isActive", !1);
      V(this, "logFn");
      V(this, "onError");
      V(this, "showDialog", !0);
      this.createIssue = this.createIssue.bind(this), this.handleError = this.handleError.bind(this), this.handleRejection = this.handleRejection.bind(this), this.setOptions({ externalApi: n, logFn: i, onError: o, showDialog: s }), this.startCatching = this.startCatching.bind(this), this.stopCatching = this.stopCatching.bind(this);
    }
    handle(n, {
      logFn: i = this.logFn,
      onError: o = this.onError,
      processType: s = "browser",
      showDialog: a = this.showDialog,
      errorName: l = ""
    } = {}) {
      var f;
      n = t(n);
      try {
        if (typeof o == "function") {
          const c = ((f = this.externalApi) == null ? void 0 : f.getVersions()) || {}, u = this.createIssue;
          if (o({
            createIssue: u,
            error: n,
            errorName: l,
            processType: s,
            versions: c
          }) === !1)
            return;
        }
        l ? i(l, n) : i(n), a && !l.includes("rejection") && this.externalApi && this.externalApi.showErrorBox(
          `A JavaScript error occurred in the ${s} process`,
          n.stack
        );
      } catch {
        console.error(n);
      }
    }
    setOptions({ externalApi: n, logFn: i, onError: o, showDialog: s }) {
      typeof n == "object" && (this.externalApi = n), typeof i == "function" && (this.logFn = i), typeof o == "function" && (this.onError = o), typeof s == "boolean" && (this.showDialog = s);
    }
    startCatching({ onError: n, showDialog: i } = {}) {
      this.isActive || (this.isActive = !0, this.setOptions({ onError: n, showDialog: i }), process.on("uncaughtException", this.handleError), process.on("unhandledRejection", this.handleRejection));
    }
    stopCatching() {
      this.isActive = !1, process.removeListener("uncaughtException", this.handleError), process.removeListener("unhandledRejection", this.handleRejection);
    }
    createIssue(n, i) {
      var o;
      (o = this.externalApi) == null || o.openUrl(
        `${n}?${new URLSearchParams(i).toString()}`
      );
    }
    handleError(n) {
      this.handle(n, { errorName: "Unhandled" });
    }
    handleRejection(n) {
      const i = n instanceof Error ? n : new Error(JSON.stringify(n));
      this.handle(i, { errorName: "Unhandled rejection" });
    }
  }
  function t(r) {
    if (r instanceof Error)
      return r;
    if (r && typeof r == "object") {
      if (r.message)
        return Object.assign(new Error(r.message), r);
      try {
        return new Error(JSON.stringify(r));
      } catch (n) {
        return new Error(`Couldn't normalize error ${String(r)}: ${n}`);
      }
    }
    return new Error(`Can't normalize error ${String(r)}`);
  }
  return yo = e, yo;
}
var Eo, rc;
function DS() {
  if (rc) return Eo;
  rc = 1;
  class e {
    constructor(r = {}) {
      V(this, "disposers", []);
      V(this, "format", "{eventSource}#{eventName}:");
      V(this, "formatters", {
        app: {
          "certificate-error": ({ args: r }) => this.arrayToObject(r.slice(1, 4), [
            "url",
            "error",
            "certificate"
          ]),
          "child-process-gone": ({ args: r }) => r.length === 1 ? r[0] : r,
          "render-process-gone": ({ args: [r, n] }) => n && typeof n == "object" ? { ...n, ...this.getWebContentsDetails(r) } : []
        },
        webContents: {
          "console-message": ({ args: [r, n, i, o] }) => {
            if (!(r < 3))
              return { message: n, source: `${o}:${i}` };
          },
          "did-fail-load": ({ args: r }) => this.arrayToObject(r, [
            "errorCode",
            "errorDescription",
            "validatedURL",
            "isMainFrame",
            "frameProcessId",
            "frameRoutingId"
          ]),
          "did-fail-provisional-load": ({ args: r }) => this.arrayToObject(r, [
            "errorCode",
            "errorDescription",
            "validatedURL",
            "isMainFrame",
            "frameProcessId",
            "frameRoutingId"
          ]),
          "plugin-crashed": ({ args: r }) => this.arrayToObject(r, ["name", "version"]),
          "preload-error": ({ args: r }) => this.arrayToObject(r, ["preloadPath", "error"])
        }
      });
      V(this, "events", {
        app: {
          "certificate-error": !0,
          "child-process-gone": !0,
          "render-process-gone": !0
        },
        webContents: {
          // 'console-message': true,
          "did-fail-load": !0,
          "did-fail-provisional-load": !0,
          "plugin-crashed": !0,
          "preload-error": !0,
          unresponsive: !0
        }
      });
      V(this, "externalApi");
      V(this, "level", "error");
      V(this, "scope", "");
      this.setOptions(r);
    }
    setOptions({
      events: r,
      externalApi: n,
      level: i,
      logger: o,
      format: s,
      formatters: a,
      scope: l
    }) {
      typeof r == "object" && (this.events = r), typeof n == "object" && (this.externalApi = n), typeof i == "string" && (this.level = i), typeof o == "object" && (this.logger = o), (typeof s == "string" || typeof s == "function") && (this.format = s), typeof a == "object" && (this.formatters = a), typeof l == "string" && (this.scope = l);
    }
    startLogging(r = {}) {
      this.setOptions(r), this.disposeListeners();
      for (const n of this.getEventNames(this.events.app))
        this.disposers.push(
          this.externalApi.onAppEvent(n, (...i) => {
            this.handleEvent({ eventSource: "app", eventName: n, handlerArgs: i });
          })
        );
      for (const n of this.getEventNames(this.events.webContents))
        this.disposers.push(
          this.externalApi.onEveryWebContentsEvent(
            n,
            (...i) => {
              this.handleEvent(
                { eventSource: "webContents", eventName: n, handlerArgs: i }
              );
            }
          )
        );
    }
    stopLogging() {
      this.disposeListeners();
    }
    arrayToObject(r, n) {
      const i = {};
      return n.forEach((o, s) => {
        i[o] = r[s];
      }), r.length > n.length && (i.unknownArgs = r.slice(n.length)), i;
    }
    disposeListeners() {
      this.disposers.forEach((r) => r()), this.disposers = [];
    }
    formatEventLog({ eventName: r, eventSource: n, handlerArgs: i }) {
      var u;
      const [o, ...s] = i;
      if (typeof this.format == "function")
        return this.format({ args: s, event: o, eventName: r, eventSource: n });
      const a = (u = this.formatters[n]) == null ? void 0 : u[r];
      let l = s;
      if (typeof a == "function" && (l = a({ args: s, event: o, eventName: r, eventSource: n })), !l)
        return;
      const f = {};
      return Array.isArray(l) ? f.args = l : typeof l == "object" && Object.assign(f, l), n === "webContents" && Object.assign(f, this.getWebContentsDetails(o == null ? void 0 : o.sender)), [this.format.replace("{eventSource}", n === "app" ? "App" : "WebContents").replace("{eventName}", r), f];
    }
    getEventNames(r) {
      return !r || typeof r != "object" ? [] : Object.entries(r).filter(([n, i]) => i).map(([n]) => n);
    }
    getWebContentsDetails(r) {
      if (!(r != null && r.loadURL))
        return {};
      try {
        return {
          webContents: {
            id: r.id,
            url: r.getURL()
          }
        };
      } catch {
        return {};
      }
    }
    handleEvent({ eventName: r, eventSource: n, handlerArgs: i }) {
      var s;
      const o = this.formatEventLog({ eventName: r, eventSource: n, handlerArgs: i });
      if (o) {
        const a = this.scope ? this.logger.scope(this.scope) : this.logger;
        (s = a == null ? void 0 : a[this.level]) == null || s.call(a, ...o);
      }
    }
  }
  return Eo = e, Eo;
}
var vo, nc;
function $f() {
  if (nc) return vo;
  nc = 1;
  const { transform: e } = jt();
  vo = {
    concatFirstStringElements: t,
    formatScope: n,
    formatText: o,
    formatVariables: i,
    timeZoneFromOffset: r,
    format({ message: s, logger: a, transport: l, data: f = s == null ? void 0 : s.data }) {
      switch (typeof l.format) {
        case "string":
          return e({
            message: s,
            logger: a,
            transforms: [i, n, o],
            transport: l,
            initialData: [l.format, ...f]
          });
        case "function":
          return l.format({
            data: f,
            level: (s == null ? void 0 : s.level) || "info",
            logger: a,
            message: s,
            transport: l
          });
        default:
          return f;
      }
    }
  };
  function t({ data: s }) {
    return typeof s[0] != "string" || typeof s[1] != "string" || s[0].match(/%[1cdfiOos]/) ? s : [`${s[0]} ${s[1]}`, ...s.slice(2)];
  }
  function r(s) {
    const a = Math.abs(s), l = s > 0 ? "-" : "+", f = Math.floor(a / 60).toString().padStart(2, "0"), c = (a % 60).toString().padStart(2, "0");
    return `${l}${f}:${c}`;
  }
  function n({ data: s, logger: a, message: l }) {
    const { defaultLabel: f, labelLength: c } = (a == null ? void 0 : a.scope) || {}, u = s[0];
    let h = l.scope;
    h || (h = f);
    let m;
    return h === "" ? m = c > 0 ? "".padEnd(c + 3) : "" : typeof h == "string" ? m = ` (${h})`.padEnd(c + 3) : m = "", s[0] = u.replace("{scope}", m), s;
  }
  function i({ data: s, message: a }) {
    let l = s[0];
    if (typeof l != "string")
      return s;
    l = l.replace("{level}]", `${a.level}]`.padEnd(6, " "));
    const f = a.date || /* @__PURE__ */ new Date();
    return s[0] = l.replace(/\{(\w+)}/g, (c, u) => {
      var h;
      switch (u) {
        case "level":
          return a.level || "info";
        case "logId":
          return a.logId;
        case "y":
          return f.getFullYear().toString(10);
        case "m":
          return (f.getMonth() + 1).toString(10).padStart(2, "0");
        case "d":
          return f.getDate().toString(10).padStart(2, "0");
        case "h":
          return f.getHours().toString(10).padStart(2, "0");
        case "i":
          return f.getMinutes().toString(10).padStart(2, "0");
        case "s":
          return f.getSeconds().toString(10).padStart(2, "0");
        case "ms":
          return f.getMilliseconds().toString(10).padStart(3, "0");
        case "z":
          return r(f.getTimezoneOffset());
        case "iso":
          return f.toISOString();
        default:
          return ((h = a.variables) == null ? void 0 : h[u]) || c;
      }
    }).trim(), s;
  }
  function o({ data: s }) {
    const a = s[0];
    if (typeof a != "string")
      return s;
    if (a.lastIndexOf("{text}") === a.length - 6)
      return s[0] = a.replace(/\s?{text}/, ""), s[0] === "" && s.shift(), s;
    const f = a.split("{text}");
    let c = [];
    return f[0] !== "" && c.push(f[0]), c = c.concat(s.slice(1)), f[1] !== "" && c.push(f[1]), c;
  }
  return vo;
}
var wo = { exports: {} }, ic;
function yi() {
  return ic || (ic = 1, function(e) {
    const t = zn;
    e.exports = {
      serialize: n,
      maxDepth({ data: i, transport: o, depth: s = (o == null ? void 0 : o.depth) ?? 6 }) {
        if (!i)
          return i;
        if (s < 1)
          return Array.isArray(i) ? "[array]" : typeof i == "object" && i ? "[object]" : i;
        if (Array.isArray(i))
          return i.map((l) => e.exports.maxDepth({
            data: l,
            depth: s - 1
          }));
        if (typeof i != "object" || i && typeof i.toISOString == "function")
          return i;
        if (i === null)
          return null;
        if (i instanceof Error)
          return i;
        const a = {};
        for (const l in i)
          Object.prototype.hasOwnProperty.call(i, l) && (a[l] = e.exports.maxDepth({
            data: i[l],
            depth: s - 1
          }));
        return a;
      },
      toJSON({ data: i }) {
        return JSON.parse(JSON.stringify(i, r()));
      },
      toString({ data: i, transport: o }) {
        const s = (o == null ? void 0 : o.inspectOptions) || {}, a = i.map((l) => {
          if (l !== void 0)
            try {
              const f = JSON.stringify(l, r(), "  ");
              return f === void 0 ? void 0 : JSON.parse(f);
            } catch {
              return l;
            }
        });
        return t.formatWithOptions(s, ...a);
      }
    };
    function r(i = {}) {
      const o = /* @__PURE__ */ new WeakSet();
      return function(s, a) {
        if (typeof a == "object" && a !== null) {
          if (o.has(a))
            return;
          o.add(a);
        }
        return n(s, a, i);
      };
    }
    function n(i, o, s = {}) {
      const a = (s == null ? void 0 : s.serializeMapAndSet) !== !1;
      return o instanceof Error ? o.stack : o && (typeof o == "function" ? `[function] ${o.toString()}` : o instanceof Date ? o.toISOString() : a && o instanceof Map && Object.fromEntries ? Object.fromEntries(o) : a && o instanceof Set && Array.from ? Array.from(o) : o);
    }
  }(wo)), wo.exports;
}
var _o, oc;
function Cs() {
  if (oc) return _o;
  oc = 1, _o = {
    transformStyles: n,
    applyAnsiStyles({ data: i }) {
      return n(i, t, r);
    },
    removeStyles({ data: i }) {
      return n(i, () => "");
    }
  };
  const e = {
    unset: "\x1B[0m",
    black: "\x1B[30m",
    red: "\x1B[31m",
    green: "\x1B[32m",
    yellow: "\x1B[33m",
    blue: "\x1B[34m",
    magenta: "\x1B[35m",
    cyan: "\x1B[36m",
    white: "\x1B[37m",
    gray: "\x1B[90m"
  };
  function t(i) {
    const o = i.replace(/color:\s*(\w+).*/, "$1").toLowerCase();
    return e[o] || "";
  }
  function r(i) {
    return i + e.unset;
  }
  function n(i, o, s) {
    const a = {};
    return i.reduce((l, f, c, u) => {
      if (a[c])
        return l;
      if (typeof f == "string") {
        let h = c, m = !1;
        f = f.replace(/%[1cdfiOos]/g, (v) => {
          if (h += 1, v !== "%c")
            return v;
          const E = u[h];
          return typeof E == "string" ? (a[h] = !0, m = !0, o(E, f)) : v;
        }), m && s && (f = s(f));
      }
      return l.push(f), l;
    }, []);
  }
  return _o;
}
var So, sc;
function NS() {
  if (sc) return So;
  sc = 1;
  const {
    concatFirstStringElements: e,
    format: t
  } = $f(), { maxDepth: r, toJSON: n } = yi(), {
    applyAnsiStyles: i,
    removeStyles: o
  } = Cs(), { transform: s } = jt(), a = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    verbose: console.info,
    debug: console.debug,
    silly: console.debug,
    log: console.log
  };
  So = c;
  const f = `%c{h}:{i}:{s}.{ms}{scope}%c ${process.platform === "win32" ? ">" : "›"} {text}`;
  Object.assign(c, {
    DEFAULT_FORMAT: f
  });
  function c(E) {
    return Object.assign(S, {
      colorMap: {
        error: "red",
        warn: "yellow",
        info: "cyan",
        verbose: "unset",
        debug: "gray",
        silly: "gray",
        default: "unset"
      },
      format: f,
      level: "silly",
      transforms: [
        u,
        t,
        m,
        e,
        r,
        n
      ],
      useStyles: process.env.FORCE_STYLES,
      writeFn({ message: A }) {
        (a[A.level] || a.info)(...A.data);
      }
    });
    function S(A) {
      const b = s({ logger: E, message: A, transport: S });
      S.writeFn({
        message: { ...A, data: b }
      });
    }
  }
  function u({ data: E, message: S, transport: A }) {
    return typeof A.format != "string" || !A.format.includes("%c") ? E : [
      `color:${v(S.level, A)}`,
      "color:unset",
      ...E
    ];
  }
  function h(E, S) {
    if (typeof E == "boolean")
      return E;
    const b = S === "error" || S === "warn" ? process.stderr : process.stdout;
    return b && b.isTTY;
  }
  function m(E) {
    const { message: S, transport: A } = E;
    return (h(A.useStyles, S.level) ? i : o)(E);
  }
  function v(E, S) {
    return S.colorMap[E] || S.colorMap.default;
  }
  return So;
}
var Ao, ac;
function Ff() {
  if (ac) return Ao;
  ac = 1;
  const e = Yn, t = Le, r = wt;
  class n extends e {
    constructor({
      path: a,
      writeOptions: l = { encoding: "utf8", flag: "a", mode: 438 },
      writeAsync: f = !1
    }) {
      super();
      V(this, "asyncWriteQueue", []);
      V(this, "bytesWritten", 0);
      V(this, "hasActiveAsyncWriting", !1);
      V(this, "path", null);
      V(this, "initialSize");
      V(this, "writeOptions", null);
      V(this, "writeAsync", !1);
      this.path = a, this.writeOptions = l, this.writeAsync = f;
    }
    get size() {
      return this.getSize();
    }
    clear() {
      try {
        return t.writeFileSync(this.path, "", {
          mode: this.writeOptions.mode,
          flag: "w"
        }), this.reset(), !0;
      } catch (a) {
        return a.code === "ENOENT" ? !0 : (this.emit("error", a, this), !1);
      }
    }
    crop(a) {
      try {
        const l = i(this.path, a || 4096);
        this.clear(), this.writeLine(`[log cropped]${r.EOL}${l}`);
      } catch (l) {
        this.emit(
          "error",
          new Error(`Couldn't crop file ${this.path}. ${l.message}`),
          this
        );
      }
    }
    getSize() {
      if (this.initialSize === void 0)
        try {
          const a = t.statSync(this.path);
          this.initialSize = a.size;
        } catch {
          this.initialSize = 0;
        }
      return this.initialSize + this.bytesWritten;
    }
    increaseBytesWrittenCounter(a) {
      this.bytesWritten += Buffer.byteLength(a, this.writeOptions.encoding);
    }
    isNull() {
      return !1;
    }
    nextAsyncWrite() {
      const a = this;
      if (this.hasActiveAsyncWriting || this.asyncWriteQueue.length === 0)
        return;
      const l = this.asyncWriteQueue.join("");
      this.asyncWriteQueue = [], this.hasActiveAsyncWriting = !0, t.writeFile(this.path, l, this.writeOptions, (f) => {
        a.hasActiveAsyncWriting = !1, f ? a.emit(
          "error",
          new Error(`Couldn't write to ${a.path}. ${f.message}`),
          this
        ) : a.increaseBytesWrittenCounter(l), a.nextAsyncWrite();
      });
    }
    reset() {
      this.initialSize = void 0, this.bytesWritten = 0;
    }
    toString() {
      return this.path;
    }
    writeLine(a) {
      if (a += r.EOL, this.writeAsync) {
        this.asyncWriteQueue.push(a), this.nextAsyncWrite();
        return;
      }
      try {
        t.writeFileSync(this.path, a, this.writeOptions), this.increaseBytesWrittenCounter(a);
      } catch (l) {
        this.emit(
          "error",
          new Error(`Couldn't write to ${this.path}. ${l.message}`),
          this
        );
      }
    }
  }
  Ao = n;
  function i(o, s) {
    const a = Buffer.alloc(s), l = t.statSync(o), f = Math.min(l.size, s), c = Math.max(0, l.size - s), u = t.openSync(o, "r"), h = t.readSync(u, a, 0, f, c);
    return t.closeSync(u), a.toString("utf8", 0, h);
  }
  return Ao;
}
var bo, lc;
function $S() {
  if (lc) return bo;
  lc = 1;
  const e = Ff();
  class t extends e {
    clear() {
    }
    crop() {
    }
    getSize() {
      return 0;
    }
    isNull() {
      return !0;
    }
    writeLine() {
    }
  }
  return bo = t, bo;
}
var To, cc;
function FS() {
  if (cc) return To;
  cc = 1;
  const e = Yn, t = Le, r = Q, n = Ff(), i = $S();
  class o extends e {
    constructor() {
      super();
      V(this, "store", {});
      this.emitError = this.emitError.bind(this);
    }
    /**
     * Provide a File object corresponding to the filePath
     * @param {string} filePath
     * @param {WriteOptions} [writeOptions]
     * @param {boolean} [writeAsync]
     * @return {File}
     */
    provide({ filePath: l, writeOptions: f = {}, writeAsync: c = !1 }) {
      let u;
      try {
        if (l = r.resolve(l), this.store[l])
          return this.store[l];
        u = this.createFile({ filePath: l, writeOptions: f, writeAsync: c });
      } catch (h) {
        u = new i({ path: l }), this.emitError(h, u);
      }
      return u.on("error", this.emitError), this.store[l] = u, u;
    }
    /**
     * @param {string} filePath
     * @param {WriteOptions} writeOptions
     * @param {boolean} async
     * @return {File}
     * @private
     */
    createFile({ filePath: l, writeOptions: f, writeAsync: c }) {
      return this.testFileWriting({ filePath: l, writeOptions: f }), new n({ path: l, writeOptions: f, writeAsync: c });
    }
    /**
     * @param {Error} error
     * @param {File} file
     * @private
     */
    emitError(l, f) {
      this.emit("error", l, f);
    }
    /**
     * @param {string} filePath
     * @param {WriteOptions} writeOptions
     * @private
     */
    testFileWriting({ filePath: l, writeOptions: f }) {
      t.mkdirSync(r.dirname(l), { recursive: !0 }), t.writeFileSync(l, "", { flag: "a", mode: f.mode });
    }
  }
  return To = o, To;
}
var Co, uc;
function xS() {
  if (uc) return Co;
  uc = 1;
  const e = Le, t = wt, r = Q, n = FS(), { transform: i } = jt(), { removeStyles: o } = Cs(), {
    format: s,
    concatFirstStringElements: a
  } = $f(), { toString: l } = yi();
  Co = c;
  const f = new n();
  function c(h, { registry: m = f, externalApi: v } = {}) {
    let E;
    return m.listenerCount("error") < 1 && m.on("error", (B, q) => {
      b(`Can't write to ${q}`, B);
    }), Object.assign(S, {
      fileName: u(h.variables.processType),
      format: "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}",
      getFile: N,
      inspectOptions: { depth: 5 },
      level: "silly",
      maxSize: 1024 ** 2,
      readAllLogs: x,
      sync: !0,
      transforms: [o, s, a, l],
      writeOptions: { flag: "a", mode: 438, encoding: "utf8" },
      archiveLogFn(B) {
        const q = B.toString(), j = r.parse(q);
        try {
          e.renameSync(q, r.join(j.dir, `${j.name}.old${j.ext}`));
        } catch (le) {
          b("Could not rotate log", le);
          const y = Math.round(S.maxSize / 4);
          B.crop(Math.min(y, 256 * 1024));
        }
      },
      resolvePathFn(B) {
        return r.join(B.libraryDefaultDir, B.fileName);
      },
      setAppName(B) {
        h.dependencies.externalApi.setAppName(B);
      }
    });
    function S(B) {
      const q = N(B);
      S.maxSize > 0 && q.size > S.maxSize && (S.archiveLogFn(q), q.reset());
      const le = i({ logger: h, message: B, transport: S });
      q.writeLine(le);
    }
    function A() {
      E || (E = Object.create(
        Object.prototype,
        {
          ...Object.getOwnPropertyDescriptors(
            v.getPathVariables()
          ),
          fileName: {
            get() {
              return S.fileName;
            },
            enumerable: !0
          }
        }
      ), typeof S.archiveLog == "function" && (S.archiveLogFn = S.archiveLog, b("archiveLog is deprecated. Use archiveLogFn instead")), typeof S.resolvePath == "function" && (S.resolvePathFn = S.resolvePath, b("resolvePath is deprecated. Use resolvePathFn instead")));
    }
    function b(B, q = null, j = "error") {
      const le = [`electron-log.transports.file: ${B}`];
      q && le.push(q), h.transports.console({ data: le, date: /* @__PURE__ */ new Date(), level: j });
    }
    function N(B) {
      A();
      const q = S.resolvePathFn(E, B);
      return m.provide({
        filePath: q,
        writeAsync: !S.sync,
        writeOptions: S.writeOptions
      });
    }
    function x({ fileFilter: B = (q) => q.endsWith(".log") } = {}) {
      A();
      const q = r.dirname(S.resolvePathFn(E));
      return e.existsSync(q) ? e.readdirSync(q).map((j) => r.join(q, j)).filter(B).map((j) => {
        try {
          return {
            path: j,
            lines: e.readFileSync(j, "utf8").split(t.EOL)
          };
        } catch {
          return null;
        }
      }).filter(Boolean) : [];
    }
  }
  function u(h = process.type) {
    switch (h) {
      case "renderer":
        return "renderer.log";
      case "worker":
        return "worker.log";
      default:
        return "main.log";
    }
  }
  return Co;
}
var Oo, fc;
function LS() {
  if (fc) return Oo;
  fc = 1;
  const { maxDepth: e, toJSON: t } = yi(), { transform: r } = jt();
  Oo = n;
  function n(i, { externalApi: o }) {
    return Object.assign(s, {
      depth: 3,
      eventId: "__ELECTRON_LOG_IPC__",
      level: i.isDev ? "silly" : !1,
      transforms: [t, e]
    }), o != null && o.isElectron() ? s : void 0;
    function s(a) {
      var l;
      ((l = a == null ? void 0 : a.variables) == null ? void 0 : l.processType) !== "renderer" && (o == null || o.sendIpc(s.eventId, {
        ...a,
        data: r({ logger: i, message: a, transport: s })
      }));
    }
  }
  return Oo;
}
var Po, dc;
function US() {
  if (dc) return Po;
  dc = 1;
  const e = wc, t = Qd, { transform: r } = jt(), { removeStyles: n } = Cs(), { toJSON: i, maxDepth: o } = yi();
  Po = s;
  function s(a) {
    return Object.assign(l, {
      client: { name: "electron-application" },
      depth: 6,
      level: !1,
      requestOptions: {},
      transforms: [n, i, o],
      makeBodyFn({ message: f }) {
        return JSON.stringify({
          client: l.client,
          data: f.data,
          date: f.date.getTime(),
          level: f.level,
          scope: f.scope,
          variables: f.variables
        });
      },
      processErrorFn({ error: f }) {
        a.processMessage(
          {
            data: [`electron-log: can't POST ${l.url}`, f],
            level: "warn"
          },
          { transports: ["console", "file"] }
        );
      },
      sendRequestFn({ serverUrl: f, requestOptions: c, body: u }) {
        const m = (f.startsWith("https:") ? t : e).request(f, {
          method: "POST",
          ...c,
          headers: {
            "Content-Type": "application/json",
            "Content-Length": u.length,
            ...c.headers
          }
        });
        return m.write(u), m.end(), m;
      }
    });
    function l(f) {
      if (!l.url)
        return;
      const c = l.makeBodyFn({
        logger: a,
        message: { ...f, data: r({ logger: a, message: f, transport: l }) },
        transport: l
      }), u = l.sendRequestFn({
        serverUrl: l.url,
        requestOptions: l.requestOptions,
        body: Buffer.from(c, "utf8")
      });
      u.on("error", (h) => l.processErrorFn({
        error: h,
        logger: a,
        message: f,
        request: u,
        transport: l
      }));
    }
  }
  return Po;
}
var Ro, hc;
function xf() {
  if (hc) return Ro;
  hc = 1;
  const e = Df(), t = IS(), r = DS(), n = NS(), i = xS(), o = LS(), s = US();
  Ro = a;
  function a({ dependencies: l, initializeFn: f }) {
    var u;
    const c = new e({
      dependencies: l,
      errorHandler: new t(),
      eventLogger: new r(),
      initializeFn: f,
      isDev: (u = l.externalApi) == null ? void 0 : u.isDev(),
      logId: "default",
      transportFactories: {
        console: n,
        file: i,
        ipc: o,
        remote: s
      },
      variables: {
        processType: "main"
      }
    });
    return c.default = c, c.Logger = e, c.processInternalErrorFn = (h) => {
      c.transports.console.writeFn({
        message: {
          data: ["Unhandled electron-log error", h],
          level: "error"
        }
      });
    }, c;
  }
  return Ro;
}
var Io, pc;
function kS() {
  if (pc) return Io;
  pc = 1;
  const e = pt, t = PS(), { initialize: r } = RS(), n = xf(), i = new t({ electron: e }), o = n({
    dependencies: { externalApi: i },
    initializeFn: r
  });
  Io = o, i.onIpc("__ELECTRON_LOG__", (a, l) => {
    l.scope && o.Logger.getInstance(l).scope(l.scope);
    const f = new Date(l.date);
    s({
      ...l,
      date: f.getTime() ? f : /* @__PURE__ */ new Date()
    });
  }), i.onIpcInvoke("__ELECTRON_LOG__", (a, { cmd: l = "", logId: f }) => {
    switch (l) {
      case "getOptions":
        return {
          levels: o.Logger.getInstance({ logId: f }).levels,
          logId: f
        };
      default:
        return s({ data: [`Unknown cmd '${l}'`], level: "error" }), {};
    }
  });
  function s(a) {
    var l;
    (l = o.Logger.getInstance(a)) == null || l.processMessage(a);
  }
  return Io;
}
var Do, mc;
function MS() {
  if (mc) return Do;
  mc = 1;
  const e = Nf(), t = xf(), r = new e();
  return Do = t({
    dependencies: { externalApi: r }
  }), Do;
}
const jS = typeof process > "u" || process.type === "renderer" || process.type === "worker", BS = typeof process == "object" && process.type === "browser";
jS ? (If(), Fn.exports = CS()) : BS ? Fn.exports = kS() : Fn.exports = MS();
var qS = Fn.exports;
const Lf = /* @__PURE__ */ Zd(qS);
Me.autoUpdater.logger = Lf;
Me.autoUpdater.autoDownload = !1;
Me.autoUpdater.autoInstallOnAppQuit = !0;
Lf.transports.file.level = "info";
zd(import.meta.url);
const Os = xe.dirname(Xd(import.meta.url));
process.env.APP_ROOT = xe.join(Os, "..");
const Yo = process.env.VITE_DEV_SERVER_URL, fA = xe.join(process.env.APP_ROOT, "dist-electron"), Uf = xe.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = Yo ? xe.join(process.env.APP_ROOT, "public") : Uf;
let X;
function kf() {
  X = new gc({
    width: 1200,
    height: 780,
    minWidth: 1200,
    minHeight: 780,
    webPreferences: {
      nodeIntegration: !0,
      nodeIntegrationInWorker: !1,
      contextIsolation: !0,
      enableBlinkFeatures: "WebRTC",
      preload: xe.join(Os, "preload.mjs"),
      devTools: !0,
      webSecurity: !1
    },
    frame: !1
  }), X.webContents.on("did-finish-load", () => {
    X == null || X.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), Yo ? X.loadURL(Yo) : X.loadFile(xe.join(Uf, "frontend/index.html")), X.webContents.openDevTools(), X.on("enter-full-screen", () => {
    X.webContents.send("fullscreen-changed", !0);
  }), X.on("leave-full-screen", () => {
    X.webContents.send("fullscreen-changed", !1);
  }), Me.autoUpdater.on("update-available", (e) => {
    X && X.webContents.send("update-status", { status: "available", info: e });
  }), Me.autoUpdater.on("update-not-available", (e) => {
    X && X.webContents.send("update-status", { status: "not-available", info: e });
  }), Me.autoUpdater.on("download-progress", (e) => {
    X && X.webContents.send("update-status", { status: "progress", progress: e });
  }), Me.autoUpdater.on("update-downloaded", (e) => {
    X && X.webContents.send("update-status", { status: "downloaded", info: e });
  }), Me.autoUpdater.on("error", (e) => {
    X && X.webContents.send("update-status", { status: "error", error: e.message });
  });
}
xt.on("window-all-closed", () => {
  process.platform !== "darwin" && (xt.quit(), X = null);
});
xt.on("activate", () => {
  gc.getAllWindows().length === 0 && kf();
});
xt.whenReady().then(() => {
  Wd.handle("local", (e) => {
    const t = e.url.slice(8);
    return Vd.fetch(Yd.pathToFileURL(xe.join(Os, t)).toString());
  });
});
rt.on("window-minimize", () => {
  X && X.minimize();
});
rt.on("window-maximize", () => {
  X && (X.isMaximized() ? X.unmaximize() : X.maximize());
});
rt.on("window-close", () => {
  X && X.close();
});
rt.handle("window-is-maximized", () => X ? X.isMaximized() : !1);
const Pr = xe.join(xt.getAppPath(), "map-cache"), Mf = xe.join(Pr, "index.json");
async function jf() {
  try {
    const e = await Xt.readFile(Mf, "utf-8");
    return JSON.parse(e);
  } catch {
    return {};
  }
}
rt.handle("map-cache:save", async (e, t, r, n) => {
  async function i() {
    await Xt.mkdir(Pr, { recursive: !0 });
  }
  async function o(f) {
    await Xt.writeFile(Mf, JSON.stringify(f, null, 2), "utf-8");
  }
  await i();
  const s = await jf(), a = s[t];
  if (a && a !== r) {
    const f = xe.join(Pr, `${t}-${a}.bin`);
    await Xt.rm(f, { force: !0 }).catch(() => {
    });
  }
  const l = xe.join(Pr, `${t}-${r}.bin`);
  await Xt.writeFile(l, new Uint8Array(n)), s[t] = r, await o(s);
});
rt.handle("map-cache:load", async (e, t, r) => {
  if ((await jf())[t] !== r) return;
  const i = xe.join(Pr, `${t}-${r}.bin`);
  try {
    return (await Xt.readFile(i)).buffer;
  } catch {
    return;
  }
});
rt.handle("check-for-update", () => xt.isPackaged ? Me.autoUpdater.checkForUpdates() : "dev-mode");
rt.handle("start-download-update", () => {
  Me.autoUpdater.downloadUpdate();
});
rt.handle("quit-and-install", () => {
  Me.autoUpdater.quitAndInstall();
});
xt.whenReady().then(kf);
export {
  fA as MAIN_DIST,
  Uf as RENDERER_DIST,
  Yo as VITE_DEV_SERVER_URL
};
