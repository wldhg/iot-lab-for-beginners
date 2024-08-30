/*
 * Sandwich.h
 * A library for ESP-01 communication with Arduino
 * Created by Jio Gim <jio@wldhg.com>, August 2024
 */

#ifndef SANDWICH_H
#define SANDWICH_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include <AsyncTimer.h>
#include <HardwareSerial.h>
#include <SimplyAtomic.h>

#include "VegemiteDict.h"

#define SANDWICH_BUFFER_SIZE 1024
#define VEGEMITE_UNKNOWN -1000.0

class VegemiteSandwich {
 private:
  unsigned long _br = 0;
  HardwareSerial *_debug;
  HardwareSerial *_esp;
  bool _isMock = false;

  String _tcpHost = "";
  uint16_t _tcpPort = 0;
  bool _tcpReady = false;

  VegemiteDict<float> _getBuffer;
  StaticJsonDocument<SANDWICH_BUFFER_SIZE> _espBufferDoc;

  char _serialBuffer[SANDWICH_BUFFER_SIZE] = {0};
  int _serialBufferPointer = 0;

  bool _opLocked = false;

  bool _waitFor(char *response);
  bool _waitFor(char *response, bool quiet);
  bool _waitForESP01BR(unsigned long br);
  void _assureTCPReady();
  void _debugPrint(String message);
  void _debugPrintln(String message);
  void _write(String message);
  void _setDocElem(const char dataID[], const char action[], float dataValue);

 public:
  VegemiteSandwich(HardwareSerial *esp);
  VegemiteSandwich(HardwareSerial *esp, HardwareSerial *debug);

  void openHellGate();
  void passThrough(String command);

  void waitForESP01();
  void connectAP(String ssid, String password);
  void connectTCP(String ip, uint16_t port);

  void registerHandler(AsyncTimer *timer);

  float getAndClear(const char dataID[]);
  float get(const char dataID[], const char action[]);
  float get(const char dataID[]);
  void put(const char dataID[], float dataValue);
};

#endif  // SANDWICH_H
