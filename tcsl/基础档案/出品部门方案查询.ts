import { accessToken } from '../授权获取/授权令牌获取';
import { axiosInstance } from '../../lib/axiosInstance';
import dotenv from 'dotenv';

export const getitemdeptplan = async (shopId: number) => {
  dotenv.config();
  const params = {
    centerId: process.env.CENTER_ID,
    shopId: shopId,
  };
  const token = await accessToken();
  const res = await axiosInstance.post(
    'https://cysms.wuuxiang.com/api/datatransfer/getitemdeptplan',
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
