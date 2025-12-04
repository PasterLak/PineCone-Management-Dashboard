#include "http_client.hpp"

#include <stdio.h>
#include <string.h>

HTTPClient::HTTPClient() {}

HTTPClient::~HTTPClient() { closeConnection(); }

bool HTTPClient::connectToServer(const char* server_ip, uint16_t port) {
  printf("[HTTP] Creating socket...\r\n");
  socket_fd = socket(AF_INET, SOCK_STREAM, 0);
  printf("[HTTP] Socket fd: %d\r\n", socket_fd);

  if (socket_fd < 0) {
    printf("[HTTP] ERROR: Socket creation failed\r\n");
    return false;
  }

  printf("[HTTP] Setting up server address %s:%d\r\n", server_ip, port);
  struct sockaddr_in server_addr;
  server_addr.sin_family = AF_INET;
  server_addr.sin_port = htons(port);
  server_addr.sin_addr.s_addr = inet_addr(server_ip);

  printf("[HTTP] Connecting...\r\n");
  int result =
      ::connect(socket_fd, (struct sockaddr*)&server_addr, sizeof(server_addr));
  printf("[HTTP] Connect result: %d\r\n", result);

  if (result < 0) {
    printf("[HTTP] ERROR: Connection to %s:%d failed\r\n", server_ip, port);
    closeConnection();
    return false;
  }

  printf("[HTTP] Connected successfully!\r\n");
  return true;
}

bool HTTPClient::sendRequest(const char* method, const char* path,
                             const char* host, uint16_t port,
                             const char* body) {
  char request[768];
  int content_length = body ? strlen(body) : 0;

  if (body) {
    snprintf(request, sizeof(request),
             "%s %s HTTP/1.1\r\n"
             "Host: %s:%d\r\n"
             "Content-Type: application/json\r\n"
             "Content-Length: %d\r\n"
             "Connection: close\r\n"
             "\r\n"
             "%s",
             method, path, host, port, content_length, body);
  } else {
    snprintf(request, sizeof(request),
             "%s %s HTTP/1.1\r\n"
             "Host: %s:%d\r\n"
             "Connection: close\r\n"
             "\r\n",
             method, path, host, port);
  }

  if (write(socket_fd, request, strlen(request)) < 0) {
    printf("[HTTP] ERROR: Sending failed\r\n");
    return false;
  }

  printf("[HTTP] Sent: %s\r\n", body ? body : "(no body)");
  return true;
}

bool HTTPClient::receiveResponse() {
  int total_bytes = 0;
  int bytes;

  while ((bytes = read(socket_fd, response_buffer + total_bytes,
                       sizeof(response_buffer) - total_bytes - 1)) > 0) {
    total_bytes += bytes;
    if (total_bytes >= (int)(sizeof(response_buffer) - 1)) {
      break;
    }
  }

  if (total_bytes <= 0) {
    printf("[HTTP] ERROR: No response received\r\n");
    return false;
  }

  response_buffer[total_bytes] = '\0';
  return true;
}

void HTTPClient::closeConnection() {
  if (socket_fd >= 0) {
    close(socket_fd);
    socket_fd = -1;
  }
}

bool HTTPClient::post(const char* server_ip, uint16_t port, const char* path,
                      const char* json_payload) {
  if (!connectToServer(server_ip, port)) {
    return false;
  }

  if (!sendRequest("POST", path, server_ip, port, json_payload)) {
    closeConnection();
    return false;
  }

  if (!receiveResponse()) {
    closeConnection();
    return false;
  }

  closeConnection();
  return true;
}

const char* HTTPClient::getResponseBody() {
  // Find JSON body (after \r\n\r\n)
  const char* body = strstr(response_buffer, "\r\n\r\n");
  if (body) {
    return body + 4;  // Skip \r\n\r\n
  }
  return nullptr;
}
