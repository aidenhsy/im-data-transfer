import axios from 'axios';
import dotenv from 'dotenv';

export const accessToken = async () => {
  dotenv.config();
  const res = await axios.post(
    'https://cysms.wuuxiang.com/api/auth/accesstoken',
    {},
    {
      params: {
        appid: process.env.APP_ID,
        accessid: process.env.ACCESS_ID,
        response_type: 'token',
      },
    }
  );
  return res.data.access_token;
};
