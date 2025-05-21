import dotenv from 'dotenv';
import { axiosInstance } from '../../lib/axiosInstance';
import { accessToken } from '../授权获取/授权令牌获取';

export const getDutyInfo = async (pageNo: number) => {
  dotenv.config();
  const token = await accessToken();
  const res = await axiosInstance.post(
    'https://cysms.wuuxiang.com/api/datatransfer/getDutyInfo',
    {},
    {
      headers: {
        accessid: process.env.ACCESS_ID,
        granttype: 'client',
        access_token: token,
      },
      params: {
        centerId: process.env.CENTER_ID,
        pageSize: 50,
        pageNo: pageNo,
      },
    }
  );
  return res.data.data;
};
