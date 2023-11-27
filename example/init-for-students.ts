import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// eslint-disable-next-line no-underscore-dangle
const __dirname = fileURLToPath(new URL('.', import.meta.url));

fs.rmSync(path.join(__dirname, '../.git'), { force: true, recursive: true });
fs.rmSync(path.join(__dirname, '../components/SliderControl.tsx'), { force: true });
fs.rmSync(path.join(__dirname, '../components/SliderControl.module.scss'), { force: true });
fs.rmSync(path.join(__dirname, '../example/ArduinoMega-cpp'), { force: true, recursive: true });
fs.rmSync(path.join(__dirname, '../example/ESP32-cpp'), { force: true, recursive: true });
fs.rmSync(path.join(__dirname, '../example/inference'), { force: true, recursive: true });
fs.rmSync(path.join(__dirname, '../pages/panel/example1.tsx'), { force: true });
fs.rmSync(path.join(__dirname, '../pages/panel/example2.tsx'), { force: true });
fs.rmSync(path.join(__dirname, '../README.md'), { force: true });
fs.rmSync(path.join(__dirname, '../public/screenshot-web.png'), { force: true });
fs.rmSync(path.join(__dirname, '../public/screenshot-wokwi.png'), { force: true });
fs.rmSync(path.join(__dirname, '../.gitignore'), { force: true });
fs.rmSync(path.join(__dirname, '../LICENSE'), { force: true });
fs.rmSync(path.join(__dirname, '../example/init-for-students.ts'), { force: true });
