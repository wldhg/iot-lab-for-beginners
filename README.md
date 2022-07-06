## ![Robot Icon](./public/robot.svg) <br /> **IoT Lab**
*Includes ONNX runtime support on Node.js.* \
*Tested on wokwi.com ESP32 C++ and VitCon IoT-MODLINK, for remote AIoT lab sessions.*

---

|               Web Panel Screenshot                 |                     Wokwi Simulator Diagram                  |
|:--------------------------------------------------:|:------------------------------------------------------------:|
| ![IoT Lab Screenshot](./public/screenshot-web.png) | ![Wokwi Simulator Screenshot](./public/screenshot-wokwi.png) |

---

### This Repository Includes:

- ESP32 C++ example code
- Arduino Mega C++ example code
- IoT web server with customizable control panels
- JSON-based DB (powered by `lowdb`)
- On-server ML inference (powered by `onnxruntime-node`)

### How To Use IoT Control Panel with Wokwi:

1. Install node.js v16 or higher on your server.
2. Clone the repository on your server. `git clone https://github.com/wldh-g/iot-lab-for-beginners.git`
3. Install the dependencies. `npm install`
4. Run the server. `npm run dev`
5. Go to `https://wokwi.com/projects/326257884268593746`.
6. Edit line 14, `your-ip-or-domain` to your server's IP address or domain. \
    If you are using port rather than `3000` on your server, also edit line 14, `3000` to your port number.
7. Run the simulation using the green start button.
8. Go to `http://your-ip-or-domain:port/panel/example1`.
9. Enjoy!

Note: If you are a lecturer and if you want to use wokwi.com in your class, first contact the administrator of wokwi.com to get dedicated build servers and gateways. You may have to pay for them.

### How To Use IoT Control Panel with VitCon IoT-MODLINK:

1. Install node.js v16 or higher on your server.
2. Clone the repository on your server. `git clone https://github.com/wldh-g/iot-lab-for-beginners.git`
3. Install the dependencies. `npm install`
4. Run the server. `npm run dev`
5. Run the broker server. `npm run broker`
6. Install `DHT sensor`, `U8g2`, `SimplyAtomic`, `ArduinoJson`, `AsyncTimer` library from Arduino Library Manager.
7. Install `SoftPWM`, `Adafruit_Sensor-master` library from [here](https://github.com/monetIOT/IoT/tree/master/arduino/libraries).
8. Install `Vegemite` library at `example/ArduinoMega-cpp/Vegemite`.
9. Configure VitCon IoT-MODLINK WiFi-LINK with [this Android app](https://play.google.com/store/apps/details?id=vitcon.wificonnectionmanager) or [this iOS app](https://apps.apple.com/app/wifi-connection-manager/id1422994754). Host is `your-ip-or-domain` and port is `3010`.
10. Open `example/ArduinoMega-cpp/sketch.ino` and compile it.
11. Upload the program.
12. Go to `http://your-ip-or-domain:port/panel/example2`.
13. Enjoy!

### How To Use Inference Model:

1. If you want to use a pre-trained model, skip to step 5.
2. Gather data named `humidity` and `temperature` from your IoT device (or wokwi simulator) into `db.json`.
3. Run `example/inference/dht_predict.ipynb` with your own `db.json`.
4. Save `humi_predict.onnx` and `temp_predict.onnx`.
5. Copy `.onnx` files and `model_map.yaml` to the root directory of this repository. \
    For the pre-trained `.onnx` files and `model_map.yaml`, please check `example/inference` directory.
6. Uncomment "H/T Inference" section of `pages/panel/example.tsx`. \
    i.e. delete two lines(`{/*` and `*/}`).
7. Re-run the server. `npm run dev`
8. Go to `http://your-ip-or-domain:port/panel/example1` or `example2`.
9. Enjoy!

Note that the pre-trained model in this repository is not accurate. It is just a simple example to show how inference can work.

---

Made with ♥️ by Jio Gim.
