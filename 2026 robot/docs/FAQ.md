# Frequently Asked Questions (FAQ)

## General Questions

### Q: Do I need programming experience?
**A:** Basic understanding helps, but not required. The code is provided and well-commented. You mainly need to:
- Copy/paste code into Arduino IDE
- Click "Upload"
- Build Android app in Android Studio

### Q: How much will this cost?
**A:** 
- **Budget option:** $40-50 (using complete kit from AliExpress)
- **Standard build:** $60-90 (quality parts from Amazon)
- **Premium build:** $100+ (with sensors, camera, etc.)

See [SHOPPING_LIST.md](SHOPPING_LIST.md) for details.

### Q: How long does it take to build?
**A:** 
- Hardware assembly: 1-2 hours
- Software setup: 30-45 minutes
- Testing: 15-30 minutes
- **Total: 2-3 hours** (first time)

### Q: What age is this suitable for?
**A:**
- **12+** with adult supervision
- **16+** independently
- Great for college students, hobbyists, adults

---

## Hardware Questions

### Q: ESP32 or Arduino - which should I buy?
**A:** **ESP32 is recommended** because:
- Built-in Bluetooth (no extra module needed)
- More powerful processor
- More GPIO pins
- Similar price to Arduino
- WiFi capability for future projects

Choose Arduino if:
- You already have one
- You want to learn Arduino first
- You have Arduino-specific shields

### Q: Can I use different motors?
**A:** Yes! As long as:
- They run on 6-12V DC
- Combined current is under 2A
- They fit your chassis
- Common options: TT gear motors, N20 motors, 6V/12V DC motors

### Q: What battery should I use?
**A:** Options:
1. **2S LiPo (7.4V)** - Best performance (recommended)
2. **6x AA batteries (9V)** - Cheap, easy to find
3. **9V batteries** - Convenient but low capacity
4. **3S LiPo (11.1V)** - More power, careful not to exceed motor limits

### Q: Do I need to solder?
**A:** Usually no:
- Most robot kits have screw terminals
- Motor wires can be screwed into L298N
- Jumper wires for all connections
- **Soldering only needed for:** Custom connections, cleaner permanent builds

### Q: Can I use a different motor driver?
**A:** Yes! Alternatives:
- L293D (lower current, cheaper)
- TB6612FNG (more efficient)
- DRV8833 (small size)
- A4988 (for stepper motors)

You'll need to adjust pin connections in code.

### Q: My robot is slow, how to make it faster?
**A:**
1. Increase voltage (within motor limits)
2. Use lighter chassis
3. Reduce weight (remove unnecessary parts)
4. Use faster motors (higher RPM)
5. Increase speed in code (check `motorSpeed` variable)

---

## Software Questions

### Q: Do I need Android Studio?
**A:** 
- **To build the app:** Yes
- **To install app:** No, you can use pre-built APK

Alternatives:
- Use VS Code with Flutter (would need to rewrite app)
- Use MIT App Inventor (simpler but less powerful)

### Q: Can I use an iPhone instead of Android?
**A:** Not directly. You would need to:
- Rewrite app in Swift for iOS OR
- Use Flutter/React Native for cross-platform

iOS Bluetooth has different requirements. The provided code is Android-only.

### Q: Does this work on older Android phones?
**A:** Yes! Requirements:
- Android 5.0 (Lollipop) or newer
- Bluetooth 2.0 or newer
- Most phones from 2015+ work fine

### Q: Can I modify the code?
**A:** Absolutely! The code is open source. Common modifications:
- Change Bluetooth device name
- Adjust motor speed ranges
- Add new commands
- Modify UI layout
- Add sensor support

### Q: I don't know Kotlin. Can I use Java?
**A:** Yes! The Android code can be converted to Java. Or you can:
- Learn basic Kotlin (very similar to Java)
- Use Android Studio's "Convert Java to Kotlin" feature
- Rewrite in Java yourself

---

## Connection & Bluetooth Questions

### Q: Bluetooth won't pair. What to do?
**A:** Troubleshooting steps:
1. Ensure ESP32 is powered on
2. Check Serial Monitor shows "Bluetooth Started!"
3. Restart ESP32
4. On phone: Settings → Bluetooth → Forget device → Re-scan
5. Try pairing from phone settings first
6. Check ESP32 name in code: `SerialBT.begin("ESP32_Robot")`

### Q: Maximum Bluetooth range?
**A:**
- **ESP32:** ~10 meters (30 feet) indoors
- **HC-05:** ~10 meters (30 feet) indoors
- **With antenna:** Up to 30 meters outdoors

Obstacles (walls, furniture) reduce range.

### Q: Can I control multiple robots?
**A:** Yes, but:
- Each robot needs unique Bluetooth name
- Phone can only connect to one at a time
- Need to disconnect/reconnect to switch robots
- OR create multi-robot app (advanced)

### Q: Is there lag/delay?
**A:** Minimal:
- Typical latency: 50-100ms
- Good enough for real-time control
- Video streaming has more delay (200-500ms)

---

## Troubleshooting Questions

### Q: Robot moves in wrong direction
**A:** Two solutions:
1. **Hardware:** Swap motor wires (OUT1↔OUT2 or OUT3↔OUT4)
2. **Software:** Modify code:
   ```cpp
   // Change HIGH to LOW and vice versa in motor functions
   ```

### Q: Robot turns when going straight
**A:** Common causes:
- Motors have different speeds (normal for cheap motors)
- Uneven weight distribution
- Low battery
- **Fix:** Adjust speed for each motor individually in code

### Q: One motor doesn't work
**A:** Check:
1. Motor connections (OUT pins)
2. Control pins (IN1-IN4)
3. Enable pin (ENA/ENB) and remove jumper
4. Battery voltage
5. Test motor directly with battery
6. Replace motor if dead

### Q: Android app crashes on startup
**A:**
1. Grant Bluetooth permissions
2. Check Android version (need 5.0+)
3. Review logcat in Android Studio
4. Try rebuilding app
5. Check if Bluetooth is enabled on phone

### Q: Motors too slow even at max speed
**A:**
- Check battery voltage (should be > 7V)
- Verify PWM is working (check code)
- Battery might be dying (recharge/replace)
- Motors might be too weak for your chassis
- Check for mechanical issues (wheels stuck, too much weight)

---

## Advanced Features Questions

### Q: Can I add a camera?
**A:** Yes! Options:
1. **ESP32-CAM** ($7) - Replaces ESP32, includes camera
2. **USB webcam** via OTG adapter
3. **Phone camera** - Mount second phone on robot

### Q: Can I make it autonomous?
**A:** Absolutely! Add:
- Ultrasonic sensors for obstacle detection
- IR sensors for line following
- Modify code to read sensors and make decisions
- Remove manual control, add AI algorithms

### Q: Can I add voice control?
**A:** Yes! Modify Android app to:
- Use Android Speech Recognition API
- Convert voice commands to robot commands
- Send commands via existing Bluetooth connection

### Q: Can I use WiFi instead of Bluetooth?
**A:** Yes! ESP32 has WiFi:
1. Create web server on ESP32
2. Send commands via HTTP requests
3. Longer range than Bluetooth
4. Can control from anywhere with internet

### Q: Can I add sensors?
**A:** Yes! Popular sensors:
- **Ultrasonic (HC-SR04)** - Distance measurement
- **IR Sensors** - Line following, obstacle detection
- **IMU (MPU6050)** - Motion, balance
- **Temperature/Humidity (DHT11)** - Environmental
- **Light (LDR)** - Light detection

All use GPIO pins on ESP32.

### Q: Can I make it climb obstacles?
**A:**
- Change to 4WD chassis for better traction
- Use higher torque motors
- Add suspension system
- Larger wheels
- Not possible with 2WD basic chassis

---

## Safety Questions

### Q: Is it safe to use LiPo batteries?
**A:** Yes, if handled properly:
- ✅ Use LiPo-specific charger
- ✅ Store at room temperature
- ✅ Use fireproof bag when charging
- ✅ Add fuse for protection
- ❌ Never overcharge
- ❌ Never puncture
- ❌ Never leave charging unattended

AA batteries are safer for beginners.

### Q: Can children use this?
**A:** With supervision:
- Adult supervision for assembly
- No small parts for children under 3
- Soldering requires adult assistance
- Safe to operate once built
- Good educational project for teens

### Q: What if battery overheats?
**A:**
1. Immediately disconnect power
2. Move to safe area away from flammable materials
3. Let cool down
4. Check for short circuits
5. Replace battery if damaged
6. Add fuse to prevent future issues

---

## Project Expansion Questions

### Q: What can I add next?
**A:** Popular upgrades:
1. **Obstacle avoidance** - Ultrasonic sensor
2. **Line following** - IR sensors
3. **Robotic arm** - Servo motors
4. **First-person view** - ESP32-CAM
5. **Light effects** -RGB LED strips
6. **Music** - Buzzer or speaker
7. **Autonomous navigation** - Multiple sensors + AI

### Q: Can I use this for competitions?
**A:** Yes! Common competitions:
- Line following races
- Obstacle course navigation
- Sumo robot wrestling
- Soccer robots
- Maze solving

Check specific competition rules.

### Q: Can I sell robots built with this?
**A:** 
- Personal use: ✅ Yes
- Educational workshops: ✅ Yes
- Selling completed robots: ✅ Yes (give credit)
- Selling as commercial product: Check license
- Selling the code: Check license

Be sure to follow open-source license terms.

---

## Still Have Questions?

**Where to get help:**
1. Read all documentation in `/docs/` folder
2. Check Arduino Forums: https://forum.arduino.cc
3. Reddit: r/arduino, r/robotics, r/esp32
4. YouTube: Search "ESP32 robot car tutorial"
5. Stack Overflow: Tag with [arduino], [esp32], [android]

**Before asking for help, provide:**
- What you're trying to do
- What happens instead
- Error messages (if any)
- Photos of your wiring
- Code you're using
- What you've already tried

Good luck with your robot! 🤖
