import axios from 'axios';

export const getSensores = async () => {
  const res = await axios.get('http://192.168.63.246:8000/api/sensores-json');
  return res.data;
};