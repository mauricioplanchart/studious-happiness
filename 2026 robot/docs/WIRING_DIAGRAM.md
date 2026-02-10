# Wiring Diagrams and Pin Reference

## ESP32 Pin Connections

### Complete Wiring Table

| Component | Component Pin | ESP32 Pin | Wire Color (suggested) |
|-----------|---------------|-----------|------------------------|
| **L298N Motor Driver** | | | |
| | IN1 | GPIO 27 | Yellow |
| | IN2 | GPIO 26 | Orange |
| | IN3 | GPIO 25 | Blue |
| | IN4 | GPIO 33 | Green |
| | ENA | GPIO 14 | Purple |
| | ENB | GPIO 12 | White |
| | GND | GND | Black |
| **Battery** | | | |
| | Positive (+) | L298N 12V | Red |
| | Negative (-) | L298N GND | Black |
| **Motors** | | | |
| Left Motor | Wire 1 | L298N OUT1 | - |
| Left Motor | Wire 2 | L298N OUT2 | - |
| Right Motor | Wire 1 | L298N OUT3 | - |
| Right Motor | Wire 2 | L298N OUT4 | - |

### ESP32 Pinout Overview

```
                        ESP32 DEVKIT V1
                    ___________________
                   |                   |
              3V3  |[ ]             [ ]| GND
        (SPI CS) D2|[ ]             [ ]| D23 (SPI MOSI)
        (SPI MISO)D4|[ ]             [ ]| D22 (I2C SCL)
               RX2 |[ ]             [ ]| TX2
               D5  |[ ]             [ ]| G21 (I2C SDA)
     (LEFT)    G27 |[☐]             [ ]| GND
     (LEFT)    G26 |[☐]             [ ]| G19 (SPI MISO)
     (RIGHT)   G25 |[☐]             [ ]| G18 (SPI CLK)
     (RIGHT)   G33 |[☐]             [ ]| G5 (SPI CS)
               G32 |[ ]             [ ]| TX0
               TDI |[ ]             [ ]| RX0
               VP  |[ ]             [ ]| D34
               VN  |[ ]             [ ]| TMS
     (SPEED A) G14 |[☐]             [ ]| GND
     (SPEED B) G12 |[☐]             [ ]| D13
               GND |[ ]             [ ]| D0
               VIN |[ ]             [ ]| BAT
                    ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
                         USB PORT
                         
[☐] = Connected pins for motors
```

---

## Arduino Uno Pin Connections

### Complete Wiring Table

| Component | Component Pin | Arduino Pin | Wire Color (suggested) |
|-----------|---------------|-------------|------------------------|
| **HC-05 Bluetooth** | | | |
| | VCC | 5V | Red |
| | GND | GND | Black |
| | TXD | Pin 2 (RX) | Yellow |
| | RXD | Pin 3 (TX) | Orange |
| **L298N Motor Driver** | | | |
| | IN1 | Pin 7 | Yellow |
| | IN2 | Pin 6 | Orange |
| | IN3 | Pin 5 | Blue |
| | IN4 | Pin 4 | Green |
| | ENA | Pin 9 (PWM) | Purple |
| | ENB | Pin 10 (PWM) | White |
| | GND | GND | Black |
| **Battery** | | | |
| | Positive (+) | L298N 12V | Red |
| | Negative (-) | L298N GND | Black |
| **Motors** | | | |
| Left Motor | Wire 1 | L298N OUT1 | - |
| Left Motor | Wire 2 | L298N OUT2 | - |
| Right Motor | Wire 1 | L298N OUT3 | - |
| Right Motor | Wire 2 | L298N OUT4 | - |

### Arduino Uno Pinout

```
                    ARDUINO UNO
                ___________________
               |    ___  ___      |
               |   | • | |USB|    |
          RST  |[ ]              [ ]| AREF
          3V3  |[ ]         (PWM)[ ]| D13/SCK
          5V   |[☐] HC-05   (PWM)[ ]| D12
          GND  |[☐]         (PWM)[☐]| D11
          GND  |[ ]              [ ]| D10 (PWM) [☐] SPEED_B
          VIN  |[ ]         (PWM)[☐]| D9       [☐] SPEED_A
               |                  [ ]| D8
        A0     |[ ]              [☐]| D7       IN1
        A1     |[ ]              [☐]| D6       IN2
        A2     |[ ]         (PWM)[☐]| D5       IN3
        A3     |[ ]              [☐]| D4       IN4
        A4/SDA |[ ]         (PWM)[☐]| D3       BT_TX
        A5/SCL |[ ]              [☐]| D2       BT_RX
               |              TX [ ]| D1
               |              RX [ ]| D0
                ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
                         
[☐] = Connected pins
```

---

## L298N Motor Driver Module

### Pin Descriptions

```
        L298N MOTOR DRIVER MODULE
    _______________________________
   |                               |
   | [12V] [GND] [5V]             |  ← Power connections
   |                               |
   | [OUT1]  [OUT2]                |  ← Motor A (Left)
   |                               |
   | [OUT3]  [OUT4]                |  ← Motor B (Right)
   |                               |
   | [ENA] [IN1] [IN2]             |  ← Control (A)
   |                               |
   | [ENB] [IN3] [IN4]             |  ← Control (B)
   |_______________________________|

Power Section:
- 12V: Battery positive (6V-12V DC)
- GND: Common ground (battery + microcontroller)
- 5V: Optional 5V output (if jumper installed)

Motor A (Left):
- OUT1, OUT2: Connect to left motor

Motor B (Right):
- OUT3, OUT4: Connect to right motor

Control A (Left Motor):
- ENA: Speed control via PWM (remove jumper!)
- IN1, IN2: Direction control

Control B (Right Motor):
- ENB: Speed control via PWM (remove jumper!)
- IN3, IN4: Direction control
```

### Important Notes:

⚠️ **Remove ENA/ENB Jumpers** - Required for speed control!

**Motor Direction Logic:**
```
IN1  IN2  | Motor A Action
-----------------------
HIGH LOW  | Forward
LOW  HIGH | Backward
LOW  LOW  | Stop
HIGH HIGH | Stop (brake)
```

---

## Battery Connection Diagram

### 2S LiPo Battery (7.4V)
```
    Battery (7.4V)
    ┌─────────┐
    │ ⊕     ⊖ │
    └─┬─────┬─┘
      │     │
   [SWITCH] │    (Optional but recommended)
      │     │
      ↓     ↓
    ┌─────────┐
    │ L298N   │
    │ 12V GND │
    └─────────┘
         ↓
    Common GND → ESP32/Arduino GND
```

### Battery Safety:
- Use fuse (2A) between battery and motor driver
- Check voltage: 7.4V for 2S LiPo, 11.1V for 3S
- Never exceed motor driver max voltage (12V for L298N)
- Add switch for easy power control

---

## Complete System Diagram

```
┌──────────────┐         ┌─────────────┐
│ Android Phone│         │   Battery   │
│              │         │   (7.4V)    │
└──────┬───────┘         └──────┬──────┘
       │ Bluetooth                │
       │                         │
┌──────▼───────┐         ┌──────▼──────┐
│  ESP32 or    │  GPIO   │   L298N     │
│  Arduino +   ├─────────┤Motor Driver │
│  HC-05       │         │             │
└──────────────┘         └──┬────────┬─┘
                            │        │
                    ┌───────▼──┐  ┌──▼───────┐
                    │ Motor L  │  │ Motor R  │
                    └──────────┘  └──────────┘
```

---

## Testing Wire Connections

### Continuity Test (with multimeter):
1. Set multimeter to continuity mode (beep symbol)
2. Touch probes to:
   - Battery + to L298N 12V
   - Battery - to L298N GND
   - L298N GND to ESP32 GND
   - Each motor wire to corresponding OUT pin

### Voltage Test:
1. Set multimeter to DC Voltage
2. Measure battery: should read 7-12V
3. If using L298N 5V output: should read ~5V
4. ESP32 3.3V pin: should read 3.3V

---

## Wire Color Standards (Optional but Helpful)

| Purpose | Color | Example |
|---------|-------|---------|
| Power + | Red | Battery positive |
| Ground | Black | All grounds |
| Motor control | Yellow, Orange, Blue, Green | IN1-IN4 |
| PWM/Speed | Purple, White | ENA, ENB |
| Bluetooth | Yellow (TX), Orange (RX) | Serial communication |

Use colored electrical tape if you don't have many wire colors!

---

## Quick Troubleshooting

**Robot doesn't move:**
- Check battery voltage (> 6V)
- Verify GND connections
- Test motors directly on battery
- Check ENA/ENB jumpers removed

**One motor doesn't work:**
- Check that motor's OUT connections
- Verify corresponding IN and EN pins
- Test motor directly

**Motors spin wrong way:**
- Swap motor wires (OUT1↔OUT2 or OUT3↔OUT4)
- Or change code logic

**Bluetooth won't connect:**
- ESP32 should have power (LED on)
- Check GND connection
- Verify code uploaded successfully
