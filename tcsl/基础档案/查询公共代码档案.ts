import dotenv from 'dotenv';
import { accessToken } from '../授权获取/授权令牌获取';
import { axiosInstance } from '../../lib/axiosInstance';

export const getPubCode = async (typeId: number) => {
  dotenv.config();
  const token = await accessToken();
  const res = await axiosInstance.post(
    'https://cysms.wuuxiang.com/api/datatransfer/getPubCode',
    {},
    {
      headers: {
        accessid: process.env.ACCESS_ID,
        granttype: 'client',
        access_token: token,
      },
      params: {
        centerId: process.env.CENTER_ID,
        typeId: typeId,
      },
    }
  );
  return res.data.data;
};
