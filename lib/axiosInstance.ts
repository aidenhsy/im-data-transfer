import axios from 'axios';
import JSONBig from 'json-bigint';

export const axiosInstance = axios.create({
  transformResponse: [
    (data) => {
      try {
        return JSONBig({ storeAsString: true }).parse(data);
      } catch (e) {
        return data;
      }
    },
  ],
});
