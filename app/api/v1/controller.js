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
  bulkRequests: async (req, res) => {
    try {
      const { FromDate, ToDate, Username, Address, Reason } = req.body;
      const { authorization } = req.headers;
      const splitUsername = Username.split(";");
      const splitAddress = Address.split(";");

      const _tempAddress = [];
      for (let index = 0; index < splitAddress.length; index++) {
        const elementAddress = splitAddress[index];

        let response = await axios.get(`${API_URL}/API/Accounts`, {
          params: {
            search: elementAddress,
          },
          headers: {
            Authorization: authorization,
          },
        });

        _tempAddress.push(response.data.value);
      }

      const _newTempAddress = [];
      for (const iteratorAddress of _tempAddress) {
        for (const iteratorUsername of splitUsername) {
          _newTempAddress.push(
            iteratorAddress.filter(
              (value) => value.userName == iteratorUsername
            )[0]
          );
        }
      }

      const arrayAddress = [];
      for (const iterator of _newTempAddress) {
        if (iterator != null && Object.keys(iterator).length > 0) {
          arrayAddress.push(iterator);
        }
      }

      const _temp = [];
      for (const iterator of arrayAddress) {
        let response = await axios.get(
          `${API_URL}/api/ExtendedAccounts/${iterator.id}`,
          {
            headers: {
              Authorization: authorization,
            },
          }
        );

        const _tempRole = ["ReasonRequired", "Waiting"];

        if (!_tempRole.includes(response.data.Details.DualControlStatus)) {
          _temp.push({
            accountId: iterator.id,
            username: iterator.userName,
            address: iterator.address,
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
