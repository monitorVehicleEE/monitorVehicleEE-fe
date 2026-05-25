const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

class WebSocketService {
  constructor() {
    this.connections = new Map();
    this.reconnectAttempts = new Map();
    this.manuallyClosed = new Set();
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  connect(channel, onMessage, onOpen, onClose, onError) {
    const url = `${WS_BASE_URL}/ws/${channel}`;
    return this.createConnection(channel, url, onMessage, onOpen, onClose, onError);
  }

  connectToCamera(cameraId, onMessage, onOpen, onClose, onError) {
    const channel = `stream-${cameraId}`;
    const url = `${WS_BASE_URL}/ws/stream/${cameraId}`;
    return this.createConnection(channel, url, onMessage, onOpen, onClose, onError);
  }

  createConnection(channel, url, onMessage, onOpen, onClose, onError) {
    // Close existing connection if any
    this.disconnect(channel);
    this.manuallyClosed.delete(channel);

    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log(`WebSocket connected: ${channel}`);
      this.reconnectAttempts.set(channel, 0);
      if (onOpen) onOpen();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.onclose = () => {
      console.log(`WebSocket disconnected: ${channel}`);
      this.connections.delete(channel);
      if (onClose) onClose();

      if (this.manuallyClosed.has(channel)) {
        this.manuallyClosed.delete(channel);
        return;
      }

      // Attempt reconnection
      this.attemptReconnect(channel, url, onMessage, onOpen, onClose, onError);
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error (${channel}):`, error);
      if (onError) onError(error);
    };

    this.connections.set(channel, ws);
    return ws;
  }

  attemptReconnect(channel, url, onMessage, onOpen, onClose, onError) {
    const attempts = this.reconnectAttempts.get(channel) || 0;

    if (attempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnect attempts reached for ${channel}`);
      return;
    }

    this.reconnectAttempts.set(channel, attempts + 1);

    setTimeout(() => {
      console.log(`Attempting to reconnect ${channel} (${attempts + 1}/${this.maxReconnectAttempts})`);
      this.createConnection(channel, url, onMessage, onOpen, onClose, onError);
    }, this.reconnectDelay);
  }

  disconnect(channel) {
    const ws = this.connections.get(channel);
    if (ws) {
      this.manuallyClosed.add(channel);
      ws.close();
      this.connections.delete(channel);
    }
  }

  disconnectAll() {
    this.connections.forEach((ws, channel) => {
      this.manuallyClosed.add(channel);
      ws.close();
    });
    this.connections.clear();
  }

  send(channel, message) {
    const ws = this.connections.get(channel);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  ping(channel) {
    return this.send(channel, { type: 'ping', timestamp: new Date().toISOString() });
  }
}

const websocketService = new WebSocketService();
export default websocketService;
