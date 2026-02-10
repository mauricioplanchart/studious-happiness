/*
 * ESP32 Robot Control via Bluetooth
 * 
 * This code runs on ESP32 and controls a robot
 * via Bluetooth Serial communication from the Android app
 * 
 * Hardware Connections:
 * Motor Driver L298N:
 * - IN1 -> GPIO 27
 * - IN2 -> GPIO 26
 * - IN3 -> GPIO 25
 * - IN4 -> GPIO 33
 * - ENA (Speed Control) -> GPIO 14
 * - ENB (Speed Control) -> GPIO 12
 * 
 * Power:
 * - 12V to motor driver
 * - ESP32 powered via USB or separate 5V supply
 */

#include "BluetoothSerial.h"

// Check if Bluetooth is available
#if !defined(CONFIG_BT_ENABLED) || !defined(CONFIG_BLUEDROID_ENABLED)
#error Bluetooth is not enabled! Please run `make menuconfig` to enable it
#endif

BluetoothSerial SerialBT;

// Motor A (Left motors)
const int motorA1 = 27;
const int motorA2 = 26;
const int enableA = 14;

// Motor B (Right motors)
const int motorB1 = 25;
const int motorB2 = 33;
const int enableB = 12;

// PWM properties
const int freq = 30000;
const int pwmChannelA = 0;
const int pwmChannelB = 1;
const int resolution = 8;
int motorSpeed = 200; // Default speed (0-255)

void setup() {
  Serial.begin(115200);
  
  // Initialize Bluetooth
  SerialBT.begin("ESP32_Robot"); // Bluetooth device name
  Serial.println("Bluetooth Started! Ready to pair...");
  
  // Setup motor pins
  pinMode(motorA1, OUTPUT);
  pinMode(motorA2, OUTPUT);
  pinMode(motorB1, OUTPUT);
  pinMode(motorB2, OUTPUT);
  
  // Setup PWM channels
  ledcSetup(pwmChannelA, freq, resolution);
  ledcSetup(pwmChannelB, freq, resolution);
  
  // Attach pins to PWM channels
  ledcAttachPin(enableA, pwmChannelA);
  ledcAttachPin(enableB, pwmChannelB);
  
  // Start with motors stopped
  stopMotors();
  
  Serial.println("Robot ready!");
}

void loop() {
  if (SerialBT.available()) {
    char command = SerialBT.read();
    Serial.print("Command received: ");
    Serial.println(command);
    
    // Process command
    processCommand(command);
  }
  
  delay(20);
}

void processCommand(char command) {
  switch(command) {
    case 'F': // Forward
      moveForward();
      break;
      
    case 'B': // Backward
      moveBackward();
      break;
      
    case 'L': // Left
      turnLeft();
      break;
      
    case 'R': // Right
      turnRight();
      break;
      
    case 'S': // Stop
      stopMotors();
      break;
      
    case 'V': // Speed control (followed by 0-9)
      // Wait for next character
      delay(10);
      if (SerialBT.available()) {
        char speedChar = SerialBT.read();
        int speed = speedChar - '0'; // Convert char to int
        if (speed >= 0 && speed <= 9) {
          motorSpeed = map(speed, 0, 9, 0, 255);
          Serial.print("Speed set to: ");
          Serial.println(motorSpeed);
        }
      }
      break;
      
    case '0': case '1': case '2': case '3': case '4':
    case '5': case '6': case '7': case '8': case '9':
      // Direct speed control
      int speed = command - '0';
      motorSpeed = map(speed, 0, 9, 0, 255);
      Serial.print("Speed set to: ");
      Serial.println(motorSpeed);
      break;
      
    default:
      Serial.println("Unknown command");
      break;
  }
}

void moveForward() {
  digitalWrite(motorA1, HIGH);
  digitalWrite(motorA2, LOW);
  digitalWrite(motorB1, HIGH);
  digitalWrite(motorB2, LOW);
  
  ledcWrite(pwmChannelA, motorSpeed);
  ledcWrite(pwmChannelB, motorSpeed);
  
  Serial.println("Moving forward");
}

void moveBackward() {
  digitalWrite(motorA1, LOW);
  digitalWrite(motorA2, HIGH);
  digitalWrite(motorB1, LOW);
  digitalWrite(motorB2, HIGH);
  
  ledcWrite(pwmChannelA, motorSpeed);
  ledcWrite(pwmChannelB, motorSpeed);
  
  Serial.println("Moving backward");
}

void turnLeft() {
  // Left motors backward, right motors forward
  digitalWrite(motorA1, LOW);
  digitalWrite(motorA2, HIGH);
  digitalWrite(motorB1, HIGH);
  digitalWrite(motorB2, LOW);
  
  ledcWrite(pwmChannelA, motorSpeed);
  ledcWrite(pwmChannelB, motorSpeed);
  
  Serial.println("Turning left");
}

void turnRight() {
  // Left motors forward, right motors backward
  digitalWrite(motorA1, HIGH);
  digitalWrite(motorA2, LOW);
  digitalWrite(motorB1, LOW);
  digitalWrite(motorB2, HIGH);
  
  ledcWrite(pwmChannelA, motorSpeed);
  ledcWrite(pwmChannelB, motorSpeed);
  
  Serial.println("Turning right");
}

void stopMotors() {
  digitalWrite(motorA1, LOW);
  digitalWrite(motorA2, LOW);
  digitalWrite(motorB1, LOW);
  digitalWrite(motorB2, LOW);
  
  ledcWrite(pwmChannelA, 0);
  ledcWrite(pwmChannelB, 0);
  
  Serial.println("Motors stopped");
}
