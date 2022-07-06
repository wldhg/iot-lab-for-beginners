#include "Vegemite.h"

#define VEGEMITE_STREAM Serial

Vegemite::Vegemite() {
  _stream = &VEGEMITE_STREAM;
  _timer.setInterval([&]() { _storeBuffer(); }, V_DEFAULT_PING_INTERVAL);
  _timer.setInterval([&]() { _checkSubscription(); },
                     V_DEFAULT_PING_INTERVAL * 2);
}

Vegemite::~Vegemite() { _timer.cancelAll(); }

void Vegemite::_checkSubscription() {
  for (size_t i = 0; i < V_STATICDICT_CAPACITY; ++i) {
    auto k = _subtimers.getKey(i);
    if (k[0] != '\0') {
      if ((millis() - _subtimers[k]) > (4 * V_DEFAULT_PING_INTERVAL)) {
        requestSubscription(k);
      }
    }
  }
}

void Vegemite::_storeBuffer() {
  if (!VEGEMITE_STREAM) return;
  int bpi;
  uint8_t bp_1, bp_2;
  while ((bpi = _stream->read()) != -1) {
    uint8_t bp = bpi;
    if (bp == 0b00001010 && bp_1 == 0b00001101 && bp_2 == 0b00010110) {
      if (_bufferPointer > 0) {
        DynamicJsonDocument* doc = new DynamicJsonDocument(V_RES_BUFFER_SIZE);
        String strBuffer = String((char*)_bufferPieces);
        deserializeJson(*doc, strBuffer.substring(0, _bufferPointer));
        if (((*doc).is<JsonObjectConst>() || (*doc).is<JsonObject>()) &&
            !(*doc).isNull()) {
          JsonObjectConst json = (*doc).as<JsonObjectConst>();
          ATOMIC() {
            while (_bufferLocked)
              ;
            _bufferLocked = true;
          }
          for (JsonPairConst kv : json) {
            if (kv.value().is<float>() || kv.value().is<double>() ||
                kv.value().is<bool>()) {
              _buffer[kv.key().c_str()] = kv.value().as<float>();
              if (_subtimers.exists(kv.key().c_str())) {
                _subtimers[kv.key().c_str()] = millis();
              }
            }
          }
          _bufferLocked = false;
        }
        _bufferPointer = 0;
        delete doc;
        break;
      }
      _bufferPointer = 0;
    } else {
      _bufferPieces[_bufferPointer++] = bp;
    }
    bp_2 = bp_1;
    bp_1 = bp;
  }
}

void Vegemite::_writeToStream(DynamicJsonDocument* doc) {
  String strBuffer;
  serializeJson(*doc, strBuffer);
  while (!VEGEMITE_STREAM)
    ;
  _stream->write(strBuffer.c_str());
  _stream->write(0b00010110);
  _stream->write(0b00001101);
  _stream->write(0b00001010);
}

void Vegemite::_writeToStream(StaticJsonDocument<V_RES_BUFFER_SIZE>* doc) {
  String strBuffer;
  serializeJson(*doc, strBuffer);
  while (!VEGEMITE_STREAM)
    ;
  _stream->write(strBuffer.c_str());
  _stream->write(0b00010110);
  _stream->write(0b00001101);
  _stream->write(0b00001010);
}

void Vegemite::requestSubscription(const char dataID[]) {
  StaticJsonDocument<V_RES_BUFFER_SIZE> doc;
  doc["VEGEMITE_SPECIAL_CMD_SUBSCRIBE"] = dataID;
  doc["VEGEMITE_SPECIAL_CMD_SUBSCRIBE_INTERVAL"] = V_DEFAULT_PING_INTERVAL;
  _writeToStream(&doc);
  _subtimers[dataID] = millis();
}

void Vegemite::requestOnce(const char dataID[]) {
  return requestOnce(dataID, nullptr);
}

void Vegemite::requestOnce(const char dataID[], const char action[]) {
  StaticJsonDocument<V_RES_BUFFER_SIZE> doc;
  doc["VEGEMITE_SPECIAL_CMD_SUBSCRIBE"] = dataID;
  doc["VEGEMITE_SPECIAL_CMD_SUBSCRIBE_INTERVAL"] = V_DEFAULT_PING_INTERVAL;
  if (action != nullptr) {
    doc["VEGEMITE_SPECIAL_CMD_SUBSCRIBE_ACTION"] = action;
  }
  _writeToStream(&doc);
}

float Vegemite::recv(const char dataID[]) {
  ATOMIC() {
    while (_bufferLocked)
      ;
    _bufferLocked = true;
  }
  if (_buffer.exists(dataID)) {
    float data = _buffer[dataID];
    _bufferLocked = false;
    return data;
  } else {
    _bufferLocked = false;
    return -1;
  }
}

bool Vegemite::recvExists(const char dataID[]) {
  return _buffer.exists(dataID);
}

void Vegemite::send(const char dataID[], float dataValue) {
  StaticJsonDocument<V_RES_BUFFER_SIZE> doc;
  doc[dataID] = dataValue;
  _writeToStream(&doc);
}
