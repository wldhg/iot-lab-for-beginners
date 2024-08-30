#include <AsyncTimer.h>
#include <DHT11.h>
#include <VegemiteSandwich.h>

#define DHT_PIN 31

AsyncTimer timer;
VegemiteSandwich vs(&Serial2);
DHT11 dht;

void setup() {
  Serial.begin(115200);

  vs.waitForESP01();
  vs.connectAP("AIoT", "AIoT");
  vs.connectTCP("10.0.0.1", 3010);
  vs.registerHandler(&timer);

  timer.setInterval(
      [&]() {
        // Round-Trip Test
        dht.read(DHT_PIN);
        vs.put("temperature", dht.temperature);
        vs.put("humidity", dht.humidity);
        Serial.println(vs.get("humidity"));
        Serial.println(vs.get("temperature"));
      },
      1000);
}

void loop() { timer.handle(); }
