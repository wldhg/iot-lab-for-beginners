#include "ConnectPoint.h"

#define RES_BUFFER_SIZE   4096
#define DEBUG_HTTP        false
#define REQ_DEFAULT_PORT  80

ConnectPoint::ConnectPoint(const char host[]) {
  _host = host;
  _port = REQ_DEFAULT_PORT;
  _bufferLocked = false;
  if (!Serial.available()) {
    Serial.begin(115200);
  }
}

ConnectPoint::ConnectPoint(const char host[], int port) {
  _host = host;
  _port = port;
  _bufferLocked = false;
  if (!Serial.available()) {
    Serial.begin(115200);
  }
}

void ConnectPoint::_println(const char line[]) {
  _wc.println(line);
  DEBUG_HTTP && Serial.println(line);
}

String ConnectPoint::_getSeparator(String res) {
  if (res.indexOf("\r\n") != -1) {
    return String("\r\n");
  } else if (res.indexOf("\r") != -1) {
    return String("\r");
  }
  return String("\n");
}

bool ConnectPoint::_isSuccessful(String res) {
  String sep = _getSeparator(res);
  int from = 0;
  String line;
  while (from < res.length()) {
    int to = res.indexOf(sep, from + 1);
    if (to != -1) {
      line = res.substring(from, to);
      line.trim();
    } else {
      break;
    }
    if (line.indexOf("HTTP/") == 0) {
      char s[64];
      int i;
      sscanf(line.c_str(), "HTTP/1.1 %d %s", &i, s);
      if (i == 200) {
        return true;
      } else {
        return false;
      }
    }
    from = to;
  }
  return false;
}

DynamicJsonDocument* ConnectPoint::_parseData(String res) {
  String sep = _getSeparator(res);
  DynamicJsonDocument* doc = new DynamicJsonDocument(4096);
  int from = 0;
  String line;
  while (from < res.length()) {
    int to = res.indexOf(sep, from + 1);
    if (to != -1) {
      line = res.substring(from, to);
      line.trim();
    } else {
      break;
    }
    if (line.indexOf("{") == 0) {
      deserializeJson(*doc, line);
      break;
    }
    from = to;
  }
  return doc;
}

float ConnectPoint::getData(const char dataID[]) {
  return getData(dataID, false);
}

float ConnectPoint::getData(const char dataID[], bool setZeroOnQuery) {
  while(!_wc.connect(_host, _port)) {
    Serial.println("Retrying to connect host...");
  };

  char req1[256];
  char req2[256];

  sprintf(req1, "Host: %s:%d", _host, _port);
  sprintf(req2, "query-key: %s", dataID);

  _println("GET /api/load HTTP/1.1");
  _println(req1);
  _println(req2);
  _println("query-count: 1");
  if (setZeroOnQuery) {
    _println("query-action: set-zero");
  }
  _println("");

  uint32_t resptr = 0;
  char resChar[RES_BUFFER_SIZE] = { 0 };

  while (!_wc.available());
  while (_wc.available()) {
    resChar[resptr] = _wc.read();
    if (++resptr >= RES_BUFFER_SIZE) {
      break;
    }
  }
  String res = String(resChar);

  if (!_isSuccessful(res)) {
    Serial.println("Communication unsuccessful.");
    _wc.stop();
    return -1.0;
  }

  DynamicJsonDocument* doc = _parseData(res);
  if ((*doc).isNull() || !(*doc).containsKey("data")) {
    Serial.println("Data were empty.");
    _wc.stop();
    return -1.0;
  }
  if ((*doc)["data"].size() != 1 && (*doc)["data"][0].size() != 2) {
    Serial.println("Wrongly formed data.");
    _wc.stop();
    return -1.0;
  }

  float data = (*doc)["data"][0][1];
  delete doc;

  _wc.stop();
  return data;
}

void ConnectPoint::bufferData(const char dataID[], float dataValue) {
  ATOMIC() {
    while (_bufferLocked);
    _bufferLocked = true;
  }
  _outgoingBuffer = _outgoingBuffer + "\n" + String(String(dataID) + "=" + String(dataValue));
  _bufferLocked = false;
}

bool ConnectPoint::setData() {
  while(!_wc.connect(_host, _port)) {
    Serial.println("Retrying to connect host...");
  };

  char req1[256];
  char req2[256];

  ATOMIC() {
    while (_bufferLocked);
    _bufferLocked = true;
  }

  if (_outgoingBuffer.length() == 0) {
    _bufferLocked = false;
    _wc.stop();
    return true;
  }

  sprintf(req1, "Host: %s:%d", _host, _port);
  sprintf(req2, "Content-Length: %d", _outgoingBuffer.length());

  _println("POST /api/save HTTP/1.1");
  _println(req1);
  _println("Content-Type: text/plain");
  _println(req2);
  _println("");
  _println(_outgoingBuffer.c_str());
  _println("");

  _bufferLocked = false;

  uint32_t resptr = 0;
  char resChar[RES_BUFFER_SIZE] = { 0 };

  while (!_wc.available());
  while (_wc.available()) {
    resChar[resptr] = _wc.read();
    if (++resptr >= RES_BUFFER_SIZE) {
      break;
    }
  }
  String res = String(resChar);

  if (!_isSuccessful(res)) {
    Serial.println("Communication unsuccessful.");
    _wc.stop();
    return false;
  }

  DynamicJsonDocument* doc = _parseData(res);
  if ((*doc).isNull() || !(*doc).containsKey("code") || !(*doc).containsKey("message")) {
    Serial.println("Wrongly formed response.");
    _wc.stop();
    return false;
  }
  if ((*doc)["code"] != 0) {
    Serial.println("Error occurred.");
    Serial.println((*doc)["message"].as<const char*>());
    _wc.stop();
    return false;
  }

  _outgoingBuffer = String("");

  _wc.stop();
  return true;
}
