
function analytics() {
  return function (req, res, next) {
    console.log(`[A] Request from ${req.ip} for ${req.originalUrl} on route ${req.route} (xhr: ${req.xhr}) (referrer: ${req.get('referrer')})`);
    next();
  };
}

module.exports = analytics;
