# Android Robot Control App

An Android application to control robot hardware using your smartphone.

## Features
- Bluetooth communication with robot hardware
- Simple control interface (directional controls)
- Real-time command sending
- Compatible with Arduino/ESP32 based robots

## Hardware Requirements

### Recommended Components to Buy:
1. **Microcontroller** (Choose one):
   - Arduino Uno/Nano ($10-25)
   - ESP32 DevKit ($6-10) - Recommended (has built-in Bluetooth)
   - HC-05/HC-06 Bluetooth Module ($3-8) if using Arduino

2. **Motors and Drivers**:
   - DC Motors (2-4 motors) ($5-15)
   - L298N Motor Driver Module ($3-5)
   - Servo Motors (optional, for robotic arm) ($5-10 each)

3. **Power Supply**:
   - 7.4V or 11.1V LiPo Battery ($15-30)
   - Battery holder for AA batteries (cheaper option, $5)

4. **Chassis**:
   - Robot car chassis kit ($15-30)
   - Wheels included with most kits

5. **Additional Sensors** (optional):
   - Ultrasonic distance sensor HC-SR04 ($2-5)
   - Line following sensors ($5-10)
   - Camera module ($10-20)

### Connection Setup:
```
Android Phone <--Bluetooth--> ESP32/HC-05 <---> Motor Driver <---> Motors
                                    |
                                 Sensors
```

## Setup Instructions

### 1. Hardware Assembly:
- Connect motors to L298N motor driver
- Connect motor driver to microcontroller
- Connect Bluetooth module (if using Arduino)
- Power everything with battery

### 2. Android App:
- Install the APK on your Android phone
- Enable Bluetooth
- Pair with your robot's Bluetooth module
- Connect through the app

### 3. Microcontroller Code:
- Upload the provided Arduino/ESP32 code
- Configure Bluetooth name and pairing code

## Project Structure
```
app/
├── src/main/
│   ├── java/com/robotcontrol/
│   │   ├── MainActivity.kt
│   │   ├── BluetoothService.kt
│   │   └── RobotController.kt
│   ├── res/
│   │   ├── layout/
│   │   │   └── activity_main.xml
│   │   └── values/
│   └── AndroidManifest.xml
├── arduino_code/
│   ├── esp32_robot.ino
│   └── arduino_robot.ino
└── build.gradle
```

## Communication Protocol
Commands sent from Android to robot:
- `F` - Forward
- `B` - Backward
- `L` - Left
- `R` - Right
- `S` - Stop
- `0-9` - Speed control (0=stop, 9=max)

## Building the App
1. Open project in Android Studio
2. Sync Gradle files
3. Build APK
4. Install on your Android phone

## Future Enhancements
- Video streaming from robot camera
- Sensor data display
- Autonomous mode
- Multiple robot control
- Voice commands

## License
MIT License
