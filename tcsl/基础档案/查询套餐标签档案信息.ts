import { axiosInstance } from '../../lib/axiosInstance';
import dotenv from 'dotenv';
import { accessToken } from '../授权获取/授权令牌获取';

export const getpackagelabels = async () => {
  dotenv.config();
  const params = {
    centerId: process.env.CENTER_ID,
  };
  const token = await accessToken();
  const res = await axiosInstance.post(
    'https://cysms.wuuxiang.com/api/datatransfer/getpackagelabels',
    {},
    {
      headers: {
        accessid: process.env.ACCESS_ID,
        granttype: 'client',
        access_token: token,
      },
      params: params,
    }
  );
  return res.data.data;
};
