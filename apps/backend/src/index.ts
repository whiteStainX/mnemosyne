import 'dotenv/config';
import express from 'express';

import http from 'http';
import { Server } from 'socket.io';
import Docker from 'dockerode';

const app = express();
app.use(express.static('public'));
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for now
  },
});

const socketPath = process.env.DOCKER_SOCKET_PATH;
const docker = new Docker(socketPath ? { socketPath } : {});

app.get('/', (req, res) => {
  res.send('<h1>Mnemosyne Broker</h1>');
});

io.on('connection', (socket) => {
  console.log('a user connected');

  let container: Docker.Container | undefined;

  docker.createContainer(
    {
      Image: 'mnemosyne-os',
      Tty: true,
      Cmd: ['/bin/bash'],
      OpenStdin: true,
      StdinOnce: false,
    },
    (err, cont) => {
      if (err) {
        console.error(err);
        socket.emit('error', 'Failed to create container');
        return;
      }

      container = cont;

      if (!container) {
        socket.emit('error', 'Failed to create container');
        return;
      }

      container.attach(
        { stream: true, stdin: true, stdout: true, stderr: true },
        (err, stream) => {
          if (err || !stream) {
            console.error(err || 'No stream');
            socket.emit('error', 'Failed to attach to container');
            return;
          }

          // Pipe container output to socket
          stream.on('data', (chunk) => {
            socket.emit('output', chunk.toString('utf8'));
          });

          // Pipe socket input to container
          socket.on('input', (data) => {
            stream.write(data);
          });

          container?.start((err) => {
            if (err) {
              console.error(err);
              socket.emit('error', 'Failed to start container');
            }
          });
        }
      );
    }
  );

  socket.on('disconnect', () => {
    console.log('user disconnected');
    if (container) {
      container.stop(() => {
        container?.remove(() => {
          console.log('container removed');
        });
      });
    }
  });
});

server.listen(3001, () => {
  console.log('listening on *:3001');
});