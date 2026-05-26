const { AuditLog } = require("../models/Misc");

const audit = (action, resource) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = async (data) => {
    if (res.statusCode < 400) {
      try {
        await AuditLog.create({
          institution: req.user?.institution || null,
          user: req.user?._id,
          action,
          resource,
          resourceId: req.params?.id || data?.data?._id || null,
          details: { method: req.method, body: req.body, params: req.params },
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        });
      } catch (_) {
        /* non-blocking */
      }
    }
    return originalJson(data);
  };
  next();
};

module.exports = { audit };
