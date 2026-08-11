import { useEffect, useState, useRef, useCallback } from 'react';
import { RecognitionResult } from '../types';

export function useWebSocket(url: string = 'ws://localhost:8000/ws/monitor') {
  const [isConnected, setIsConnected] = useState(false);
  const [violations, setViolations] = useState<RecognitionResult[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket Connected to AI Service');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'violation' || data.violationType) {
            setViolations((prev) => [data, ...prev.slice(0, 49)]);
          }
        } catch (e) {
          console.error('Failed to parse WS message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket Disconnected. Reconnecting in 3s...');
        setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket Error:', err);
        ws.close();
      };

      wsRef.current = ws;
    } catch (e) {
      console.error('WebSocket Connection Error:', e);
    }
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  return { isConnected, violations, clearViolations: () => setViolations([]) };
}
