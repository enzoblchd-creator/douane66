import { io } from "socket.io-client";

// LE LIEN QUE TU VIENS DE COPIER SUR RENDER :
const URL = "https://douane66.onrender.com";

export const socket = io(URL, {
  autoConnect: false,
});