/*
 * Arduino Robot Control via Bluetooth (HC-05/HC-06)
 * 
 * This code runs on Arduino Uno/Nano with HC-05 or HC-06 Bluetooth module
 * and controls a robot via Bluetooth Serial communication from the Android app
 * 
 * Hardware Connections:
 * 
 * HC-05/HC-06 Bluetooth Module:
 * - VCC -> 5V
 * - GND -> GND
 * - TXD -> Arduino RX (Pin 0) or use SoftwareSerial
 * - RXD -> Arduino TX (Pin 1) or use SoftwareSerial
 * 
 * Motor Driver L298N:
 * - IN1 -> Pin 7
 * - IN2 -> Pin 6
 * - IN3 -> Pin 5
 * - IN4 -> Pin 4
 * - ENA (Speed Control) -> Pin 9 (PWM)
 * - ENB (Speed Control) -> Pin 10 (PWM)
 * 
 * Power:
 * - 7-12V to motor driver
 * - Arduino powered via USB or VIN
 */

#include <SoftwareSerial.h>

// Bluetooth on pins 2 (RX) and 3 (TX)
// Connect HC-05 TX to Arduino pin 2
// Connect HC-05 RX to Arduino pin 3 (through voltage divider if needed)
SoftwareSerial BTSerial(2, 3); // RX, TX

// Motor A (Left motors)
const int motorA1 = 7;
const int motorA2 = 6;
const int enableA = 9;

// Motor B (Right motors)
const int motorB1 = 5;
const int motorB2 = 4;
const int enableB = 10;

int motorSpeed = 200; // Default speed (0-255)

void setup() {
  Serial.begin(9600);
  BTSerial.begin(9600); // HC-05 default baud rate is 9600
  
  Serial.println("Bluetooth Robot Ready!");
  
  // Setup motor pins
  pinMode(motorA1, OUTPUT);
  pinMode(motorA2, OUTPUT);
  pinMode(enableA, OUTPUT);
  pinMode(motorB1, OUTPUT);
  pinMode(motorB2, OUTPUT);
  pinMode(enableB, OUTPUT);
  
  // Start with motors stopped
  stopMotors();
}

void loop() {
  if (BTSerial.available()) {
    char command = BTSerial.read();
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
      if (BTSerial.available()) {
        char speedChar = BTSerial.read();
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
  
  analogWrite(enableA, motorSpeed);
  analogWrite(enableB, motorSpeed);
  
  Serial.println("Moving forward");
}

void moveBackward() {
  digitalWrite(motorA1, LOW);
  digitalWrite(motorA2, HIGH);
  digitalWrite(motorB1, LOW);
  digitalWrite(motorB2, HIGH);
  
  analogWrite(enableA, motorSpeed);
  analogWrite(enableB, motorSpeed);
  
  Serial.println("Moving backward");
}

void turnLeft() {
  // Left motors backward, right motors forward
  digitalWrite(motorA1, LOW);
  digitalWrite(motorA2, HIGH);
  digitalWrite(motorB1, HIGH);
  digitalWrite(motorB2, LOW);
  
  analogWrite(enableA, motorSpeed);
  analogWrite(enableB, motorSpeed);
  
  Serial.println("Turning left");
}

void turnRight() {
  // Left motors forward, right motors backward
  digitalWrite(motorA1, HIGH);
  digitalWrite(motorA2, LOW);
  digitalWrite(motorB1, LOW);
  digitalWrite(motorB2, HIGH);
  
  analogWrite(enableA, motorSpeed);
  analogWrite(enableB, motorSpeed);
  
  Serial.println("Turning right");
}

void stopMotors() {
  digitalWrite(motorA1, LOW);
  digitalWrite(motorA2, LOW);
  digitalWrite(motorB1, LOW);
  digitalWrite(motorB2, LOW);
  
  analogWrite(enableA, 0);
  analogWrite(enableB, 0);
  
  Serial.println("Motors stopped");
}
