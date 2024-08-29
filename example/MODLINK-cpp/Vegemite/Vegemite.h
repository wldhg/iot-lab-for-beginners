#ifndef VEGEMITE_H
#define VEGEMITE_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include <AsyncTimer.h>
#include <SimplyAtomic.h>

#include "VegemiteDict.h"

#define V_RES_BUFFER_SIZE 2048
#define V_DEFAULT_PING_INTERVAL 400

class Vegemite {
 private:
  Stream* _stream;
  AsyncTimer _timer;
  VegemiteDict<float> _buffer;
  VegemiteDict<unsigned long> _subtimers;
  uint8_t _bufferPieces[V_RES_BUFFER_SIZE] = {0};
  int _bufferPointer = 0;
  bool _bufferLocked = false;

  void _checkSubscription();
  void _storeBuffer();
  void _writeToStream(DynamicJsonDocument* doc);
  void _writeToStream(StaticJsonDocument<V_RES_BUFFER_SIZE>* doc);

 public:
  Vegemite();
  ~Vegemite();

  inline void Vegemite::subscribe() { _timer.handle(); }

  void requestSubscription(const char dataID[]);

  void requestOnce(const char dataID[]);
  void requestOnce(const char dataID[], const char action[]);

  float recv(const char dataID[]);
  bool recvExists(const char dataID[]);

  void send(const char dataID[], float dataValue);
};

#endif  // VEGEMITE_H
