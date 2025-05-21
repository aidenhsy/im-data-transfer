import { axiosInstance } from '../../lib/axiosInstance';
import { accessToken } from '../授权获取/授权令牌获取';
import dotenv from 'dotenv';

export const getEmpAccessShops = async () => {
  dotenv.config();
  const token = await accessToken();
  const res = await axiosInstance.post(
    'https://cysms.wuuxiang.com/api/datatransfer/getEmpAccessShops',
    {},
    {
      headers: {
        accessid: process.env.ACCESS_ID,
        granttype: 'client',
        access_token: token,
      },
      params: {
        centerId: process.env.CENTER_ID,
      },
    }
  );
  return res.data.data;
};
