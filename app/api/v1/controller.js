require("dotenv").config();
const axios = require("axios");
const { StatusCodes } = require("http-status-codes");
const { API_URL } = process.env;
const { formatErrors, formatResponse } = require("../../utils");

module.exports = {
  signIn: async (req, res) => {
    try {
      const { username, password } = req.body;

      const url = `${API_URL}/API/auth/LDAP/Logon`;
      const data = {
        username,
        password,
      };

      const response = await axios.post(url, data);

      return formatResponse(
        res,
        StatusCodes.OK,
        "Sign in berhasil",
        response.data
      );
    } catch (error) {
      return formatErrors(res, error);
    }
  },
  getMyRequests: async (req, res) => {
    try {
      const url = `${API_URL}/api/MyRequests`;
      const { authorization } = req.headers;

      const response = await axios.get(url, {
        headers: {
          Authorization: authorization,
        },
      });

      return formatResponse(
        res,
        StatusCodes.OK,
        "Berhasil mendapatkan data MyRequests",
        response.data
      );
    } catch (error) {
      return formatErrors(res, error);
    }
  },
  getAllAccounts: async (req, res) => {
    try {
      const {
        search,
        searchType = "startswith",
        sort,
        offset = 0,
        limit = 1000,
        filter,
      } = req.query;
      const { authorization } = req.headers;
      const url = `${API_URL}/API/Accounts`;

      const response = await axios.get(url, {
        params: {
          search,
          searchType,
          sort,
          offset,
          limit,
          filter,
        },
        headers: {
          Authorization: authorization,
        },
      });

      return formatResponse(
        res,
        StatusCodes.OK,
        "Berhasil mendapatkan data Accounts",
        response.data
      );
    } catch (error) {
      return formatErrors(res, error);
    }
  },
  getExtendedAccounts: async (req, res) => {
    try {
      const { accountId } = req.params;
      const { authorization } = req.headers;
      const url = `${API_URL}/api/ExtendedAccounts/${accountId}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: authorization,
        },
      });

      return formatResponse(
        res,
        StatusCodes.OK,
        "Berhasil mendapatkan data ExtendedAccounts",
        response.data
      );
    } catch (error) {
      return formatErrors(res, error);
    }
  },
};
