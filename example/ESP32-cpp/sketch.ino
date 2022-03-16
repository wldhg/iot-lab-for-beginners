#include <AsyncTimer.h>
#include <WiFi.h>
#include <DHTesp.h>
#include "ConnectPoint.h"

#define GAMMA  0.7
#define RL10   50

AsyncTimer t;
DHTesp dht;
ConnectPoint cp("localhost", 3000);

float humidity;
float temperature;

void setup() {
  Serial.begin(115200);

  pinMode(2, OUTPUT);
  pinMode(5, OUTPUT);
  pinMode(4, INPUT);
  pinMode(15, OUTPUT);
  pinMode(35, INPUT);

  dht.setup(4, DHTesp::DHT22);

  Serial.print("Connecting to WiFi");
  WiFi.begin("Wokwi-GUEST", "", 6);
  while (WiFi.status() != WL_CONNECTED) {
    delay(100);
    Serial.print(".");
  }
  Serial.println(" Connected!");

  t.setInterval([]() {
    TempAndHumidity data = dht.getTempAndHumidity();
    if (!isnan(data.temperature)) {
      temperature = data.temperature;
    }
    if (!isnan(data.humidity)) {
      humidity = data.humidity;
    }
  }, 1000);

  t.setInterval([]() {
    cp.bufferData("humidity", humidity);
    cp.bufferData("temperature", temperature);
    while (!cp.setData()) {
      Serial.println("Retyring to upload HT data...");
    }
    Serial.println("Uploaded HT data.");
  }, 3000);

  t.setInterval([]() {
    int confLight = int(cp.getData("config-light"));
    if (confLight != -1) {
      Serial.println("Queried light config : " + String(confLight));
      if (confLight == 0) {
        analogWrite(2, 255);
        analogWrite(5, 255);
        analogWrite(15, 255);
      } else {
        analogWrite(2, 0);
        analogWrite(5, 0);
        analogWrite(15, 0);
      }
    }
  }, 2000);

  t.setInterval([]() {
    int updateLUX = int(cp.getData("update-lux", true));
    if (updateLUX != -1) {
      if (updateLUX == 1) {
        int analogValue = analogRead(35);
        float voltage = analogValue / 4096. * 5;
        float resistance = 2000 * voltage / (1 - voltage / 5);
        float lux = pow(RL10 * 1e3 * pow(10, GAMMA) / resistance, (1 / GAMMA));
        cp.bufferData("lux", lux);
        while (!cp.setData()) {
          Serial.println("Retyring to upload LUX data...");
        }
        Serial.println("Uploaded LUX data.");
      }
    }
  }, 2000);
}

void loop() {
  t.handle();
}
