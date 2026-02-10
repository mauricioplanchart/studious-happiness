# Assembly and Setup Guide

## Step-by-Step Assembly Instructions

### Phase 1: Prepare Components (15 minutes)

1. **Unbox Everything**
   - Lay out all components on a clean workspace
   - Verify you have all parts from shopping list
   - Read any manuals included with chassis

2. **Check Tools**
   - Small Phillips screwdriver
   - Wire strippers (optional)
   - Soldering iron (only if needed)

### Phase 2: Assemble the Chassis (30 minutes)

1. **Attach Motors to Chassis**
   ```
   - Most kits have motor mounting brackets
   - Use provided screws to secure motors
   - For 2WD: mount motors on both sides of chassis
   - For 4WD: mount 4 motors (2 per side)
   ```

2. **Install Wheels**
   ```
   - Push wheels onto motor shafts
   - Secure with screws or set screws
   - Test that wheels spin freely
   ```

3. **Add Caster Wheel** (for 2WD robots)
   ```
   - Mount small caster wheel at front or back
   - Ensures robot stays level
   ```

### Phase 3: Wire the Motor Driver (45 minutes)

#### For ESP32 Setup:

```
L298N Motor Driver Connections:
================================

POWER:
- 12V   → Positive terminal of battery
- GND   → Negative terminal of battery AND ESP32 GND
- 5V    → Leave disconnected (or connect to ESP32 VIN if no USB power)

MOTORS:
- OUT1  → Left Motor Wire 1
- OUT2  → Left Motor Wire 2
- OUT3  → Right Motor Wire 1
- OUT4  → Right Motor Wire 2

CONTROL (to ESP32):
- IN1   → GPIO 27
- IN2   → GPIO 26
- IN3   → GPIO 25
- IN4   → GPIO 33
- ENA   → GPIO 14
- ENB   → GPIO 12

Important: Remove jumpers on ENA and ENB for speed control!
```

#### Wiring Diagram:
```
                    ESP32
                      |
         GPIO Pins ---|--- GND
              |              |
              |              |
         L298N Driver    Battery
         /    |    \         |
     OUT1-2 OUT3-4  +12V     |
       |      |       |      |
    Motor1 Motor2   GND------+
```

### Phase 4: Mount the Electronics (30 minutes)

1. **Secure Motor Driver**
   ```
   - Use hot glue or double-sided tape
   - Place near center of chassis for balance
   - Ensure wires can reach motors
   ```

2. **Mount ESP32/Arduino**
   ```
   - Position near motor driver
   - Use standoffs or hot glue
   - Keep USB port accessible
   ```

3. **Battery Holder**
   ```
   - Mount on chassis (usually underneath)
   - Connect to motor driver power input
   - Add switch between battery and driver (recommended)
   ```

4. **Cable Management**
   ```
   - Use zip ties or tape to secure wires
   - Keep wires away from wheels
   - Label connections if needed
   ```

### Phase 5: Software Setup - Arduino/ESP32 (20 minutes)

1. **Install Arduino IDE**
   ```
   - Download from: https://www.arduino.cc/en/software
   - Install on your computer
   - Open Arduino IDE
   ```

2. **Install ESP32 Board Support** (if using ESP32)
   ```
   In Arduino IDE:
   - File → Preferences
   - Additional Board Manager URLs:
     https://dl.espressif.com/dl/package_esp32_index.json
   - Tools → Board → Boards Manager
   - Search "ESP32"
   - Install "ESP32 by Espressif Systems"
   ```

3. **Select Your Board**
   ```
   - Tools → Board → ESP32 Arduino → ESP32 Dev Module
   OR
   - Tools → Board → Arduino → Arduino Uno/Nano
   ```

4. **Upload Robot Code**
   ```
   - Open: arduino_code/esp32_robot/esp32_robot.ino
   - Select correct COM port: Tools → Port
   - Click Upload button (→)
   - Wait for "Done uploading" message
   ```

5. **Test Bluetooth**
   ```
   - Open Serial Monitor: Tools → Serial Monitor
   - Set baud rate to 115200 (ESP32) or 9600 (Arduino)
   - Should see "Bluetooth Started! Ready to pair..."
   ```

### Phase 6: Android App Setup (30 minutes)

#### Option A: Build from Source (Recommended)

1. **Install Android Studio**
   ```
   - Download from: https://developer.android.com/studio
   - Install with default settings
   - Launch Android Studio
   ```

2. **Open Project**
   ```
   - File → Open
   - Navigate to: 2026 robot/
   - Click OK
   - Wait for Gradle sync (5-10 minutes first time)
   ```

3. **Enable Developer Mode on Phone**
   ```
   On Android Phone:
   - Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back → Developer Options
   - Enable "USB Debugging"
   ```

4. **Connect Phone and Install**
   ```
   - Connect phone via USB cable
   - Allow USB debugging on phone
   - In Android Studio, click Run (▶️)
   - Select your phone from device list
   - App will install automatically
   ```

#### Option B: Install Pre-built APK (Easier)

```
1. Build APK in Android Studio:
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
   - Wait for build to complete
   - Click "locate" to find APK file

2. Transfer to Phone:
   - Email to yourself OR
   - Use Google Drive OR
   - USB transfer to phone

3. Install on Phone:
   - Open APK file on phone
   - Allow "Install from Unknown Sources" if prompted
   - Click Install
```

### Phase 7: Pairing and Testing (15 minutes)

1. **Pair Bluetooth Device**
   ```
   On Android Phone:
   - Settings → Bluetooth → Turn On
   - Scan for devices
   - Look for "ESP32_Robot" or "HC-05"
   - Pair with it (PIN: 1234 or 0000 if asked)
   ```

2. **Open Robot Control App**
   ```
   - Launch "Robot Control" app
   - Grant Bluetooth permissions
   - Select your robot from dropdown
   - Click "Connect"
   ```

3. **Test Controls**
   ```
   Start Simple:
   - Click STOP button - should see no movement
   - Click FORWARD - motors should spin forward
   - Click STOP again
   - Test other directions: BACKWARD, LEFT, RIGHT
   
   Test Speed:
   - Move speed slider
   - Click FORWARD
   - Should see different speeds
   ```

### Phase 8: Troubleshooting

#### Robot doesn't move:
- Check battery level (should be > 6V)
- Verify all wire connections
- Check motor driver LED indicators
- Test motor driver by connecting motor directly to battery

#### Bluetooth won't connect:
- Make sure device is paired in phone settings first
- Check ESP32 is powered on (LED should be on)
- Restart ESP32
- Re-upload code to ESP32

#### Motors spin wrong direction:
- Swap motor wires (swap OUT1 with OUT2, or OUT3 with OUT4)
- Or modify Arduino code to reverse directions

#### One motor not working:
- Check connections to that motor
- Test motor directly with battery
- May need to replace motor

#### App crashes:
- Check you granted Bluetooth permissions
- Try un-pairing and re-pairing Bluetooth device
- Check Android version (should be 5.0+)

## Safety Tips

⚠️ **IMPORTANT SAFETY WARNINGS:**

- **Never short circuit battery** - Can cause fire or explosion
- **Use correct voltage** - Check motor driver specs (usually 6-12V)
- **Add fuse** - Place 2A fuse between battery and motor driver
- **Don't leave battery charging unattended**
- **Hot glue gun safety** - Can cause burns
- **Soldering safety** - Use in ventilated area with safety glasses

## Testing Checklist

Before full operation, verify:

- [ ] All screws tight
- [ ] Wires secured and away from wheels
- [ ] Battery charged
- [ ] Battery switched ON
- [ ] ESP32/Arduino powered on
- [ ] Bluetooth paired
- [ ] App shows "Connected"
- [ ] All directions work correctly
- [ ] Stop button works
- [ ] Speed control works

## What's Next?

Once your basic robot works:

1. **Add Obstacle Detection**
   - Mount ultrasonic sensor on front
   - Add code to stop when object detected

2. **Line Following**
   - Add IR sensors under robot
   - Program to follow black line

3. **Camera/FPV**
   - Add ESP32-CAM module
   - Stream video to phone

4. **Autonomous Mode**
   - Program robot to navigate on its own
   - Use sensors for decision making

5. **Voice Control**
   - Add voice recognition to Android app
   - Control robot with voice commands

## Need More Help?

- Check README.md for general info
- Review Arduino code comments
- Post issues on project GitHub
- Join robotics forums (r/robotics, Arduino Forums)

Congratulations on building your robot! 🤖🎉
