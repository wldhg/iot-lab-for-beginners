#include <AsyncTimer.h>
#include <DHTesp.h>
#include <ESP32Servo.h>
#include <U8g2lib.h>
#include <WiFi.h>
#include "ConnectPoint.h"

#define GAMMA  0.7
#define RL10   50

AsyncTimer t;
DHTesp dht;
Servo servo;
ConnectPoint cp("your-ip-or-domain", 3000);
U8X8_SSD1306_128X64_NONAME_HW_I2C display(U8X8_PIN_NONE);

// "Wrongly formed data" error can be appeared in below cases
// 1. The servo motor or LED has never been controlled in the web interface
// 2. If the DHT prediction model is not prepared correctly
//    or the number of data required for prediction is insufficient
//    (in these cases, errors will be printed in the server log)

float humidity;
float temperature;

void setup() {
  Serial.begin(115200);

  pinMode(2, OUTPUT);
  pinMode(5, OUTPUT);
  pinMode(15, OUTPUT);
  pinMode(19, INPUT);
  pinMode(33, OUTPUT);
  pinMode(35, INPUT);

  dht.setup(19, DHTesp::DHT22);
  servo.attach(33);

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
      Serial.println("Current temperature : " + String(temperature));
    } else {
      Serial.println("Failed to get temperature!");
    }
    if (!isnan(data.humidity)) {
      humidity = data.humidity;
      Serial.println("Current humidity    : " + String(humidity));
    } else {
      Serial.println("Failed to get humidity!");
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
    int updateLUX = int(cp.getData("update-lux", "set-zero"));
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

  t.setInterval([]() {
    int confServo = int(cp.getData("config-servo"));
    if (confServo != -1) {
      Serial.println("Queried servo config : " + String(confServo));
      servo.write(confServo);
    }
  }, 2000);


  display.begin();
  display.setPowerSave(0);
  display.setFont(u8x8_font_pxplusibmcgathin_f);
  display.clearDisplay();
  display.drawString(1, 1, "DHT Prediction");
  t.setInterval([]() {
    float predTemp = cp.getData("temperature", "inference");
    float predHumi = cp.getData("humidity", "inference");

    if (predTemp != -1) {
      display.clearLine(3);
      display.drawString(1, 3, "Temp.");
      display.setCursor(7, 3);
      display.print(predTemp);
      display.drawString(13, 3, "\xb0");
      display.drawString(14, 3, "C");
      Serial.println("Queried temperature prediction : " + String(predTemp));
    }

    if (predHumi != -1) {
      display.clearLine(5);
      display.drawString(1, 5, "Humi.");
      display.setCursor(7, 5);
      display.print(predHumi);
      display.drawString(13, 5, "%");
      Serial.println("Queried humidity prediction : " + String(predHumi));
    }
  }, 3000);
}

void loop() {
  t.handle();
}
