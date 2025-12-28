import { io } from "socket.io-client";

// On se connecte au port 3001 (Le Serveur)
export const socket = io("http://localhost:3001", {
  autoConnect: false, // On ne connecte que quand le joueur clique
});