module.exports = (req, res, next) => {
  const roleId = Number(req.user?.role_id);

  const role = String(
    req.user?.role || ""
  )
    .trim()
    .toLowerCase();

  if (
    roleId !== 1 &&
    role !== "admin"
  ) {
    return res.status(403).json({
      message:
        "Akses hanya untuk Administrator."
    });
  }

  next();
};