import { io } from 'socket.io-client';

// Connect using origin so proxy / socket.io handles connection automatically
const socket = io('/', {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1000,
  auth: {
    token: localStorage.getItem('oneplay1_token')
  }
});

export default socket;
