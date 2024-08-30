#include "VegemiteSandwich.h"

#include <stdio.h>
#include <string.h>

VegemiteSandwich::VegemiteSandwich(HardwareSerial *esp)
    : VegemiteSandwich(esp, &Serial) {}
VegemiteSandwich::VegemiteSandwich(HardwareSerial *esp, HardwareSerial *debug) {
  _isMock = esp == nullptr;
  if (_isMock) {
    _esp = &Serial;
    _debug = nullptr;
  } else {
    _esp = esp;
    _debug = debug;
  }
}

void VegemiteSandwich::_debugPrint(String message) {
  if (_debug != nullptr) {
    _debug->print(message);
  }
}

void VegemiteSandwich::_debugPrintln(String message) {
  if (_debug != nullptr) {
    _debug->println(message);
  }
}

bool VegemiteSandwich::_waitForESP01BR(unsigned long br) {
  if (_isMock) {
    return true;
  }
  uint8_t tryCount = 0;
  _esp->begin(br);
  while (tryCount < 3) {
    _esp->write("AT\r\n");
    delay(500);
    if (!_esp->available()) {
      delay(500);
    }
    if (_esp->available()) {
      String response = _esp->readString();
      if (response.indexOf("OK") != -1) {
        _esp->end();
        return true;
      }
    }
    tryCount += 1;
  }
  _esp->end();
  return false;
}

bool VegemiteSandwich::_waitFor(char *expected) {
  return _waitFor(expected, false);
}

bool VegemiteSandwich::_waitFor(char *expected, bool quiet) {
  while (true) {
    if (_esp->available()) {
      String response = _esp->readString();
      if (!quiet) {
        _debugPrintln("##=DEBUG: Waiting for `" + String(expected) +
                      "`... <- " + response + " =## ");
      }
      int expectedIdx = response.indexOf(expected);
      if (expectedIdx != -1) {
        return true;
      }
    }
  }
}

void VegemiteSandwich::waitForESP01() {
  unsigned long esp01BR = 0;
  if (_waitForESP01BR(9600)) {
    _debugPrintln(F("DEBUG: ESP-01 with BR 9600 detected."));
    esp01BR = 9600;
  } else if (_waitForESP01BR(115200)) {
    _debugPrintln(F("DEBUG: ESP-01 with BR 115200 detected."));
    esp01BR = 115200;
    _esp->begin(115200);
    _esp->write("AT+UART_DEF=9600,8,1,0,0\r\n");
    _debugPrint(F("DEBUG: Setting ESP-01 BR to 9600... "));
    delay(500);
    _esp->end();
    delay(500);
    _debugPrintln(F("Reopening Serial... "));
    if (!_waitForESP01BR(9600)) {
      Serial.println(
          F("Failed to set ESP-01 BR to 9600. Please reset the device or "
            "try again."));
      for (;;);
    }
    _debugPrintln(F("OK."));
    esp01BR = 9600;
  }
  if (esp01BR == 0) {
    Serial.println(F("Failed to detected ESP-01 BR. I cannot proceed..."));
    for (;;);
  }
  _br = esp01BR;
  _esp->begin(esp01BR);
  if (_isMock) {
    return;
  }
  _debugPrint(F("DEBUG: Setting ESP-01 to Station mode... "));
  _esp->write("AT+CWMODE=1\r\n");
  _waitFor("OK", true);
  _debugPrintln(F("OK."));
}

void VegemiteSandwich::openHellGate() {
  if (_br == 0) {
    _debugPrintln(F("ESP-01 BR is not set. I cannot proceed..."));
  }
  if (_isMock) {
    Serial.println(F("Cannot open Hell Gate in mock mode."));
    return;
  }
  _debugPrintln(F("DEBUG: Now Opening Hell Gate!"));
  while (true) {
    if (_esp->available()) {
      Serial.write(_esp->read());
    }
    if (Serial.available()) {
      _esp->write(Serial.read());
    }
  }
}

void VegemiteSandwich::passThrough(String command) {
  if (_br == 0) {
    _debugPrintln(F("ESP-01 BR is not set. I cannot proceed..."));
  }
  if (_isMock) {
    Serial.println(F("Cannot pass through in mock mode."));
    return;
  }
  _esp->print(command + "\r\n");
  delay(500);
  while (_esp->available()) {
    Serial.write(_esp->read());
  }
}

void VegemiteSandwich::connectAP(String ssid, String password) {
  if (_br == 0) {
    _debugPrintln(F("ESP-01 BR is not set. I cannot proceed..."));
  }
  if (_isMock) {
    return;
  }
  bool success = false;
  for (uint8_t tryCount = 0; tryCount < 3; tryCount += 1) {
    _debugPrint("DEBUG: Connecting to WiFi AP... ");
    _esp->print("AT+CWJAP=\"" + ssid + "\",\"" + password + "\"\r\n");
    while (true) {
      if (_esp->available()) {
        String response = _esp->readString();
        if (response.indexOf("+CWJAP:3") != -1) {
          _debugPrintln(F("Failed to connect to WiFi (no AP found)."));
          break;
        } else if (response.indexOf("+CWJAP:1") != -1) {
          _debugPrintln(F("Failed to connect to WiFi (incorrect password)."));
          break;
        } else if (response.indexOf("FAIL") != -1) {
          _debugPrintln(
              F("Failed to connect to WiFi (unknown error -- below are the "
                "details)."));
          _debugPrintln(response);
          break;
        } else if (response.indexOf("OK")) {
          _debugPrintln(F("OK."));
          _debugPrint(F("DEBUG: Waiting for IP address... "));
          _waitFor("WIFI GOT IP", true);
          _debugPrintln(F("OK."));
          success = true;
          break;
        }
        // Do nothing if the response is not yet complete.
      }
    }
    if (success) {
      break;
    }
  }
}

void VegemiteSandwich::connectTCP(String ip, uint16_t port) {
  if (_br == 0) {
    _debugPrintln(F("ESP-01 BR is not set. I cannot proceed..."));
  }
  if (_isMock) {
    return;
  }
  _debugPrint(F("DEBUG: Connecting to TCP server... "));
  _esp->print("AT+CIPSTART=\"TCP\",\"" + ip + "\"," + String(port) + "\r\n");
  while (true) {
    if (_esp->available()) {
      String response = _esp->readString();
      int cidx = response.indexOf("CONNECT");
      if (cidx > -1) {
        _debugPrintln(F("OK."));
        _tcpHost = ip;
        _tcpPort = port;
        _tcpReady = true;
        break;
      } else if (response.indexOf("ERROR") != -1) {
        _debugPrintln(F("Failed to connect to TCP server."));
        break;
      }
      // Do nothing if the response is not yet complete.
    }
  }
  // Wait for a while to ensure that the connection is stable.
  delay(1000);
}

void VegemiteSandwich::_assureTCPReady() {
  if (!_tcpReady) {
    _debugPrintln(F("FATAL: TCP was never connected."));
  }
  if (_isMock) {
    return;
  }
  _esp->print("AT+CIPSTATUS\r\n");
  while (true) {
    if (_esp->available()) {
      String response = _esp->readString();
      if (response.indexOf("STATUS:") != -1) {
        if (response.indexOf("STATUS:4") != -1) {
          // TCP is closed.
          _debugPrintln(
              F("DEBUG: Connection Lost. Launched TCP reconnection process."));
          connectTCP(_tcpHost, _tcpPort);
        }
        break;
      }
    }
  }
}

void VegemiteSandwich::_write(String data) {
  if (_br == 0) {
    _debugPrintln(F("ESP-01 BR is not set. I cannot proceed..."));
  }
  _debugPrint("DEBUG: Writing `" + data + "` to TCP... ");
  if (!_isMock) {
    char header[32] = {0};
    sprintf(header, "AT+CIPSEND=%05d\r\n", data.length() + 8);
    _esp->write(header);
    _waitFor(">");
  }
  _esp->write(data.c_str());
  _esp->write("__VGMT__");
  if (!_isMock) {
    _esp->write("\r\n");
    while (true) {
      if (_esp->available()) {
        String response = _esp->readString();
        _debugPrintln("##=DEBUG: Waiting for `SEND OK`... <- " + response +
                      " =## ");
        int expectedIdx = response.indexOf("SEND OK");
        if (expectedIdx != -1) {
          // save the part after expected sequence to _serialBuffer
          if (expectedIdx + 7 < response.length()) {
            strcpy(_serialBuffer + _serialBufferPointer,
                   response.substring(expectedIdx + 7).c_str());
            _serialBufferPointer += strlen(_serialBuffer);
          }
          _debugPrintln("OK.");
          break;
        } else {
          int failIdx = response.indexOf("SEND FAIL");
          if (failIdx != -1) {
            _debugPrintln("FAIL!!");
            break;
          }
        }
      }
    }
  } else {
    _debugPrintln("OK.");
  }
}

void VegemiteSandwich::registerHandler(AsyncTimer *timer) {
  timer->setInterval(
      [this]() {
        ATOMIC() {
          while (_opLocked);
          _opLocked = true;
        }
        if (_espBufferDoc.size() > 0) {
          String espBufferStr;
          serializeJson(_espBufferDoc, espBufferStr);
          _write(espBufferStr);
          _espBufferDoc.clear();
        }
        _opLocked = false;
      },
      3000);
  timer->setInterval(
      [this]() {
        ATOMIC() {
          while (_opLocked);
          _opLocked = true;
        }
        bool keepLooping = true;
        while (keepLooping) {
          String response;
          if (_serialBufferPointer > 0) {
            response = _serialBuffer;
            memset(_serialBuffer, 0, SANDWICH_BUFFER_SIZE);
            _serialBufferPointer = 0;
          } else if (_esp->available()) {
            response = _esp->readString();
          }
          if (response.length() > 0) {
            while (true) {
              int startPos = response.indexOf("_VGMT_S_");
              int endPos = response.indexOf("_VGMT_E_");
              if (startPos == -1) {
                break;
              } else if (endPos == -1) {
                _serialBufferPointer = response.length() - startPos;
                strcpy(_serialBuffer, response.substring(startPos).c_str());
                keepLooping = false;
                break;
              }
              String data = response.substring(startPos + 8, endPos);
              // data is in the format of `dataID=value`
              int eqPos = data.indexOf("=");
              String dataID = data.substring(0, eqPos);
              float dataValue = data.substring(eqPos + 1).toFloat();
              _getBuffer[dataID.c_str()] = dataValue;
              response = response.substring(endPos + 8);
            }
          } else {
            keepLooping = false;
          }
        }
        _opLocked = false;
      },
      1500);
  timer->setInterval([this]() { _assureTCPReady(); }, 20000);
}

float VegemiteSandwich::getAndClear(const char dataID[]) {
  return get(dataID, "GET+set-zero");
}

float VegemiteSandwich::get(const char dataID[]) { return get(dataID, "GET"); }

float VegemiteSandwich::get(const char dataID[], const char action[]) {
  ATOMIC() {
    while (_opLocked);
    _opLocked = true;
  }

  float returnValue = VEGEMITE_UNKNOWN;
  if (_getBuffer.exists(dataID)) {
    returnValue = _getBuffer[dataID];
  }
  if (String(action).indexOf("+set-zero") > 0) {
    _setDocElem(dataID, "GET+set-zero", VEGEMITE_UNKNOWN);
    _getBuffer[dataID] = 0.0;
  } else {
    _setDocElem(dataID, "GET", VEGEMITE_UNKNOWN);
  }

  _opLocked = false;

  return returnValue;
}

void VegemiteSandwich::put(const char dataID[], float dataValue) {
  ATOMIC() {
    while (_opLocked);
    _opLocked = true;
  }
  _setDocElem(dataID, "PUT", dataValue);
  _opLocked = false;
}

void VegemiteSandwich::_setDocElem(const char dataID[], const char action[],
                                   float dataValue) {
  _espBufferDoc[action + String("!!") + dataID] = dataValue;
}
