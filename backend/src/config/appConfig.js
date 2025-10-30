const parseOrigins = (origins) => {
  if (!origins) {
    return ['http://localhost:5173'];
  }

  return origins.split(',').map((origin) => origin.trim());
};

module.exports = {
  port: Number.parseInt(process.env.PORT || '3000', 10),
  allowedOrigins: parseOrigins(process.env.ALLOWED_ORIGINS),
};
