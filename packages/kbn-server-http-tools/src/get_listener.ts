/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import http from 'http';
import https from 'https';
import { getServerTLSOptions } from './get_tls_options';
import type { IHttpConfig, ServerListener } from './types';

interface GetServerListenerOptions {
  configureTLS?: boolean;
}

export function getServerListener(
  config: IHttpConfig,
  options: GetServerListenerOptions = {}
): ServerListener {
  return configureHttp1Listener(config, options);
}

const configureHttp1Listener = (
  config: IHttpConfig,
  { configureTLS = true }: GetServerListenerOptions = {}
): ServerListener => {
  const useTLS = configureTLS && config.ssl.enabled;
  const tlsOptions = useTLS ? getServerTLSOptions(config.ssl) : undefined;

  const listener = useTLS
    ? https.createServer({
        ...tlsOptions,
        keepAliveTimeout: config.keepaliveTimeout,
      })
    : http.createServer({
        keepAliveTimeout: config.keepaliveTimeout,
      });

  listener.setTimeout(config.socketTimeout);
  listener.on('timeout', (socket) => {
    socket.destroy();
  });
  listener.on('clientError', (err, socket) => {
    if (socket.writable) {
      socket.end(Buffer.from('HTTP/1.1 400 Bad Request\r\n\r\n', 'ascii'));
    } else {
      socket.destroy(err);
    }
  });

  return listener;
};
