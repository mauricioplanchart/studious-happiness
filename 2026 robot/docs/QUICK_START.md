# Quick Start Guide

Get your robot running in 5 steps!

## Before You Start

Have you bought the parts yet? 
- **NO** → Read [SHOPPING_LIST.md](SHOPPING_LIST.md) first
- **YES** → Continue below!

---

## Step 1: Build the Hardware ⚙️

**Time: 1-2 hours**

1. Assemble robot chassis
2. Connect motors to L298N motor driver
3. Wire motor driver to ESP32
4. Mount battery

📖 Detailed instructions: [ASSEMBLY_GUIDE.md](ASSEMBLY_GUIDE.md)

---

## Step 2: Upload Code to ESP32/Arduino 💻

**Time: 15 minutes**

1. Download Arduino IDE: https://www.arduino.cc/en/software
2. Install ESP32 board support:
   - File → Preferences
   - Add URL: `https://dl.espressif.com/dl/package_esp32_index.json`
   - Tools → Board → Boards Manager → Install "ESP32"
3. Open `arduino_code/esp32_robot/esp32_robot.ino`
4. Select: Tools → Board → ESP32 Dev Module
5. Select: Tools → Port → (your COM port)
6. Click Upload (→)

✅ Success when you see: "Done uploading"

---

## Step 3: Build Android App 📱

**Time: 30 minutes**

### Option A: Use Android Studio
1. Download Android Studio: https://developer.android.com/studio
2. Open project folder: `2026 robot/`
3. Wait for Gradle sync
4. Connect phone via USB
5. Enable USB Debugging on phone:
   - Settings → About → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable USB Debugging
6. Click Run ▶️ in Android Studio

### Option B: Pre-built APK (if available)
1. Copy APK to phone
2. Install (allow unknown sources if needed)
3. Launch app

---

## Step 4: Connect Bluetooth 🔵

**Time: 5 minutes**

1. Power on your robot
2. On phone: Settings → Bluetooth → Scan
3. Find "ESP32_Robot" → Pair (PIN: 1234 if asked)
4. Open "Robot Control" app
5. Grant Bluetooth permissions
6. Select "ESP32_Robot" from dropdown
7. Click "Connect"

✅ Should show "Connected" ✅

---

## Step 5: Drive! 🚗

**Test each control:**

1. Click **STOP** → Nothing should move
2. Click **FORWARD** → Robot moves forward
3. Click **STOP** → Robot stops
4. Try **LEFT**, **RIGHT**, **BACKWARD**
5. Adjust speed slider and test

**🎉 Congratulations! Your robot works! 🎉**

---

## Troubleshooting Common Issues

### "Can't connect to Bluetooth"
- Check ESP32 is powered on (LED visible)
- Pair in phone Bluetooth settings first
- Try restarting ESP32
- Check Serial Monitor shows "Bluetooth Started!"

### "Robot doesn't move"
- Check battery is charged (> 7V)
- Check battery switch is ON
- Verify all wires connected correctly
- Test motor directly with battery

### "Motors spin backward"
- Swap motor wires: Switch OUT1↔OUT2 or OUT3↔OUT4
- Or modify code motor direction

### "One wheel doesn't spin"
- Check that motor's connections
- Remove ENA/ENB jumpers on L298N
- Test motor directly

### "Android app won't install"
- Enable "Install Unknown Apps" in settings
- Check Android version (need 5.0+)
- Try rebuilding APK

---

## Next Steps

### Enhance Your Robot:

1. **Add Obstacle Avoidance**
   - Buy ultrasonic sensor ($3)
   - Mount on front
   - Add detection code

2. **Line Following**
   - Buy IR sensors ($5)
   - Mount underneath
   - Program line tracking

3. **FPV Camera**
   - Add ESP32-CAM ($7)
   - Stream video to phone

4. **Sensors**
   - Temperature sensor
   - Light sensors
   - Sound sensors

5. **Autonomous Mode**
   - Program robot to explore
   - Maze solving
   - Object tracking

---

## Resources

- 📘 Full documentation: [README.md](../README.md)
- 🛠️ Assembly details: [ASSEMBLY_GUIDE.md](ASSEMBLY_GUIDE.md)
- 🛒 Parts list: [SHOPPING_LIST.md](SHOPPING_LIST.md)
- 💻 Arduino code: `arduino_code/`
- 📱 Android code: `app/src/main/java/`

## Get Help

**Having issues?**
- Check [ASSEMBLY_GUIDE.md](ASSEMBLY_GUIDE.md) Troubleshooting section
- Review wire connections
- Check code uploaded correctly
- Test with Serial Monitor

**Still stuck?**
- Arduino Forums: https://forum.arduino.cc
- Reddit: r/arduino, r/robotics
- YouTube: Search "ESP32 robot car"

---

## Command Reference

**Commands sent from Android app to robot:**

| Button | Command | Action |
|--------|---------|--------|
| Forward | `F` | Move forward |
| Backward | `B` | Move backward |
| Left | `L` | Turn left |
| Right | `R` | Turn right |
| Stop | `S` | Stop all motors |
| Speed Slider | `V0`-`V9` | Set speed (0=slow, 9=fast) |

---

Happy Building! 🤖
