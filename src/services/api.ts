import axios from "axios";

const hostName = window.location.hostname;

export const api = axios.create({
  baseURL: `http://${hostName}:3333`,
});
