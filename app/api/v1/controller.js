require("dotenv").config();
const axios = require("axios");
const { StatusCodes } = require("http-status-codes");
const { API_URL } = process.env;
const { formatErrors, formatResponse } = require("../../utils");
const { rootPath } = require("../../configs");
const csv = require("csvtojson");
const fs = require("fs");

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
  bulkRequests: async (req, res) => {
    try {
      const { FromDate, ToDate, Username, Address, Reason } = req.body;
      const { authorization } = req.headers;

      let splitUsername;
      let splitAddress;

      if (!req.file) {
        splitUsername = Username.split(";");
        splitAddress = Address.split(";");
      } else {
        const { filename } = req.file;
        const filePath = `${rootPath}/public/uploads/${filename}`;

        const jsonArray = await csv().fromFile(filePath);

        splitUsername = jsonArray[0]?.Username.replaceAll("-", ";").split(";");
        splitAddress = jsonArray[0]?.Address.replaceAll("-", ";").split(";");

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      const _tempAddress = [];
      for (let index = 0; index < splitAddress.length; index++) {
        const elementAddress = splitAddress[index];

        let response = await axios.get(`${API_URL}/API/Accounts`, {
          params: {
            search: elementAddress,
            searchType: "startswith",
          },
          headers: {
            Authorization: authorization,
          },
        });

        _tempAddress.push(response.data.value);
      }

      const _tempFilterAddress = [];
      for (const iteratorTempAddress of _tempAddress) {
        for (const iterator of iteratorTempAddress) {
          if (
            splitAddress.length > 0 &&
            splitAddress.includes(iterator.address)
          ) {
            _tempFilterAddress.push({ ...iterator });
          }
        }
      }

      const _newTempAddress = [];
      for (const iteratorAddress of _tempFilterAddress) {
        if (
          splitUsername.length > 0 &&
          splitUsername.includes(iteratorAddress.userName)
        ) {
          _newTempAddress.push({ ...iteratorAddress });
        }
      }

      const _temp = [];
      for (const iterator of _newTempAddress) {
        let response = await axios.get(
          `${API_URL}/api/ExtendedAccounts/${iterator.id}`,
          {
            headers: {
              Authorization: authorization,
            },
          }
        );

        const _tempRole = ["ReasonRequired", "Waiting", "Confirmed"];

        if (!_tempRole.includes(response.data.Details.DualControlStatus)) {
          _temp.push({
            accountId: iterator.id,
            username: iterator.userName,
            address: iterator.address.includes(",")
              ? iterator.address.split(",")[0]
              : iterator.address,
            conComp:
              response.data.ActionsToDisplay.ConnectionDisplay
                .DefaultConnectionComponent,
          });
        }
      }

      let templateForm = {
        TicketingSystemName: "",
        TicketId: "",
        MultipleAccessRequired: true,
        AdditionalInfo: {},
        UseConnect: true,
        ConnectionParams: {
          AllowMappingLocalDrives: {
            value: "Yes",
            ShouldSave: false,
          },
        },
      };

      const _tempForm = [];
      for (const iterator of _temp) {
        _tempForm.push({
          ...templateForm,
          AccountId: iterator.accountId,
          Reason,
          FromDate,
          ToDate,
          ConnectionComponent: iterator.conComp,
        });
      }

      for (const iterator of _tempForm) {
        await axios.post(`${API_URL}/api/MyRequests`, iterator, {
          headers: {
            Authorization: authorization,
          },
        });
      }

      return formatResponse(
        res,
        StatusCodes.CREATED,
        "Berhasil melakukan bulk requests.",
        _tempForm
      );
    } catch (error) {
      return formatErrors(res, error);
    }
  },
  deleteMyRequest: async (req, res) => {
    try {
      const { requestId } = req.params;
      const { authorization } = req.headers;
      const url = `${API_URL}/API/myrequests/${requestId}`;

      const response = await axios.delete(url, {
        headers: {
          Authorization: authorization,
        },
      });

      return formatResponse(
        res,
        StatusCodes.OK,
        "Berhasil menghapus data my request",
        response.data
      );
    } catch (error) {
      return formatErrors(res, error);
    }
  },
  bulkDeletes: async (req, res) => {
    try {
      const url = `${API_URL}/api/MyRequests`;
      const { authorization } = req.headers;

      const response = await axios.get(url, {
        headers: {
          Authorization: authorization,
        },
      });

      const _temp = [];

      if (response.data.MyRequests.length > 0) {
        for (const iterator of response.data.MyRequests) {
          _temp.push(iterator.RequestID);
        }

        if (_temp.length > 0) {
          for (const iteratorTemp of _temp) {
            await axios.delete(`${API_URL}/API/myrequests/${iteratorTemp}`, {
              headers: {
                Authorization: authorization,
              },
            });
          }
        }

        return formatResponse(
          res,
          StatusCodes.OK,
          "Berhasil melakukan bulk deletes.",
          _temp
        );
      } else {
        return formatResponse(
          res,
          StatusCodes.BAD_REQUEST,
          "Data my requests sudah kosong.",
          []
        );
      }
    } catch (error) {
      return formatErrors(res, error);
    }
  },
};
