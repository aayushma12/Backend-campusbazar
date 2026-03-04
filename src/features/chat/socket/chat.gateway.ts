import { Server as SocketServer } from 'socket.io';

let ioRef: SocketServer | null = null;

export const setChatSocketServer = (io: SocketServer) => {
    ioRef = io;
};

export const getChatSocketServer = () => ioRef;
