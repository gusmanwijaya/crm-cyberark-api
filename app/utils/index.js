const { StatusCodes } = require("http-status-codes");

module.exports = {
  formatResponse: (res, statusCode, message, data) =>
    res.status(statusCode).json({
      statusCode,
      message,
      data,
    }),
  formatErrors: (res, error) =>
    res.status(error.status || StatusCodes.INTERNAL_SERVER_ERROR).json({
      statusCode: error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      message: error.message || "Nampaknya terjadi kesalahan di API",
      error,
    }),
};
