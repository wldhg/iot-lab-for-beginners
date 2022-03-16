#include <ArduinoJson.h>
#include <WiFi.h>

// SimplyAtomic.h

#ifdef ARDUINO
#include <Arduino.h>
#else
#include <stdint.h>
#endif

static __inline__ void SA_iRestore(const  uint32_t *__s) {
  XTOS_RESTORE_INTLEVEL(*__s);
}

#define SA_ATOMIC_RESTORESTATE uint32_t _sa_saved \
  __attribute__((__cleanup__(SA_iRestore))) = XTOS_DISABLE_LOWPRI_INTERRUPTS

#define ATOMIC() \
for ( SA_ATOMIC_RESTORESTATE, _sa_done = 1; \
  _sa_done; _sa_done = 0 )


// Real ConnectPoint

class ConnectPoint {
private:
  const char* _host;
  int         _port;
  bool        _removeOnGet;
  WiFiClient  _wc;
  String      _outgoingBuffer;
  bool        _bufferLocked;

  void  _println(const char line[]);

  String                _getSeparator(String res);
  bool                  _isSuccessful(String res);
  DynamicJsonDocument*  _parseData(String res);

public:
  ConnectPoint(const char host[]);
  ConnectPoint(const char host[], int port);
  ConnectPoint(const char host[], int port, bool removeOnGet);

  float getData(const char dataID[]);
  float getData(const char dataID[], bool setZeroOnQuery);
  
  void bufferData(const char dataID[], float dataValue);
  bool setData();
};
