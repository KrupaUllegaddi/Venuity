#include <Servo.h>

// Ultrasonic Sensor Pins
const int trigPin = 7;
const int echoPin = 6;

// Servo Objects
Servo launcherServo;
Servo radarServo;

// Pins
const int launcherPin = 9;
const int radarPin = 10;
const int ledPin = 3;
const int buzzerPin = 2;

// Launcher Positions
const int SAFE_POSITION = 90;   // Change if your safe position is different
const int FIRE_POSITION = 0;    // Change if required

// Detection
const int detectionDistance = 30;

long duration;
int distance;

int radarAngle = 90;
int radarDirection = 1;

bool fired = false;
int detectionCount = 0;

unsigned long startTime;

void setup() {

  Serial.begin(9600);

  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(ledPin, OUTPUT);
  pinMode(buzzerPin, OUTPUT);

  // Center radar first
  radarServo.attach(radarPin);
  radarServo.write(90);

  // Wait before attaching launcher servo
  delay(3000);

  launcherServo.attach(launcherPin);
  launcherServo.write(SAFE_POSITION);

  startTime = millis();

  Serial.println("System Ready");
}

void loop() {

  radarScan();

  // Ignore first 5 seconds
  if (millis() - startTime < 5000)
    return;

  distance = getDistance();

  Serial.print("Distance: ");
  Serial.println(distance);

  if (!fired) {

    if (distance > 0 && distance <= detectionDistance) {

      detectionCount++;

      if (detectionCount >= 5) {

        triggerAlarm();
        fireMissile();

        fired = true;
      }

    } else {

      detectionCount = 0;
    }
  }

  delay(50);
}

int getDistance() {

  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);

  digitalWrite(trigPin, LOW);

  duration = pulseIn(echoPin, HIGH, 30000);

  if (duration == 0)
    return -1;

  return duration * 0.0343 / 2;
}

void radarScan() {

  radarAngle += radarDirection;

  if (radarAngle >= 180) {
    radarAngle = 180;
    radarDirection = -1;
  }

  if (radarAngle <= 0) {
    radarAngle = 0;
    radarDirection = 1;
  }

  radarServo.write(radarAngle);
}

void triggerAlarm() {

  for (int i = 0; i < 5; i++) {

    digitalWrite(ledPin, HIGH);
    tone(buzzerPin, 1000);

    delay(150);

    digitalWrite(ledPin, LOW);
    noTone(buzzerPin);

    delay(150);
  }
}

void fireMissile() {

  Serial.println("FIRING");

  digitalWrite(ledPin, HIGH);
  tone(buzzerPin, 1500);

  delay(1000);

  launcherServo.write(FIRE_POSITION);

  delay(2000);

  launcherServo.write(SAFE_POSITION);

  digitalWrite(ledPin, LOW);
  noTone(buzzerPin);

  Serial.println("Done");
}