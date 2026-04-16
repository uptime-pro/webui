"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import type {
  HeartbeatEvent,
  Monitor,
  MonitorStatusEvent,
} from "@/types/monitor";
import { monitorKeys } from "./use-monitors";

const WS_URL = `${process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001"}/ws`;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const qc = useQueryClient();
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          event: string;
          data: unknown;
        };

        if (msg.event === "heartbeat") {
          const data = msg.data as HeartbeatEvent;
          qc.invalidateQueries({
            queryKey: monitorKeys.heartbeats(data.monitorId),
          });
          qc.setQueryData<Monitor[]>(monitorKeys.list(), (old) =>
            old?.map((m) =>
              m.id === data.monitorId
                ? { ...m, lastStatus: data.status, lastPing: data.ping }
                : m,
            ),
          );
        }

        if (msg.event === "monitorStatus") {
          const data = msg.data as MonitorStatusEvent;
          qc.invalidateQueries({
            queryKey: monitorKeys.detail(data.monitorId),
          });
          qc.invalidateQueries({ queryKey: monitorKeys.list() });
        }
      } catch {
        /* ignore parse errors */
      }
    };

    ws.onerror = () => {
      ws.close();
    };

    ws.onclose = () => {
      wsRef.current = null;
      reconnectTimeout.current = setTimeout(connect, 3000);
    };
  }, [qc]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [connect]);
}
