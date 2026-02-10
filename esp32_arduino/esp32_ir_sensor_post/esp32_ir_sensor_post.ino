// esp32_ir_sensor_post.ino - IoT Goal Counter ESP32 Sketch

// ------------------- LIBRARIES -------------------
// Required libraries for WiFi and HTTP Requests
#include <WiFi.h>
#include <HTTPClient.h>

// ------------------- WIFI CONFIGURATION -------------------
const char* ssid = "Sanda_ZTE";              // ✅ Your WiFi name
const char* password = "12345678a";          // ✅ Your WiFi Password

// Node.js Server එකේ IP Address සහ API Endpoint එක
// 🎯 UPDATED IP: 192.168.0.2 (Mac's current IP on Sanda_ZTE WiFi network)
const char* serverUrl = "http://192.168.0.2:5001/api/goals/update";

// ------------------- PIN CONFIGURATION -------------------
const int irPinA = 25; // Team A Sensor Signal Pin (GPIO 25)
const int irPinB = 26; // Team B Sensor Signal Pin (GPIO 26)

// ------------------- DEBOUNCE SETTINGS -------------------
// After counting a goal, 10 second delay before counting the next goal
const long debounceDelay = 10000; // 10 seconds (10000 ms)

long lastDetectionTimeA = 0; // Team A last detection time
long lastDetectionTimeB = 0; // Team B last detection time
int teamAScore = 0; // Locally counted scores (for testing)
int teamBScore = 0;

// ------------------- FUNCTION TO POST SCORE TO SERVER -------------------
// Function to report a goal to the server
void postGoalScore(const char* team) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    // Connect to Server URL
    http.begin(serverUrl); 
    
    // Setup header: to send JSON data
    http.addHeader("Content-Type", "application/json"); 
    
    // Setup JSON body (e.g. {"team":"A"})
    String httpRequestData = "{\"team\":\"";
    httpRequestData += team;
    httpRequestData += "\"}";
    
    Serial.print("Sending POST request: ");
    Serial.println(httpRequestData);

    // Send POST Request
    int httpResponseCode = http.POST(httpRequestData);
    
    if (httpResponseCode > 0) {
      String response = http.getString(); // Response from server
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
      Serial.print("Server Response: ");
      Serial.println(response);
    } else {
      Serial.print("Error on HTTP request. Code: ");
      // -118 = Connection Refused (Server is not running or Firewall is blocking)
      // -1 = Disconnected
      Serial.println(httpResponseCode);
    }
    
    http.end(); // Close connection
  } else {
    Serial.println("WiFi not connected. Cannot send score.");
  }
}


// ------------------- SETUP -------------------
void setup() {
  Serial.begin(115200); 
  Serial.println("\n--- IR Sensor Goal Counter Started ---");
  
  // Setup sensor input pins
  pinMode(irPinA, INPUT_PULLUP); 
  pinMode(irPinB, INPUT_PULLUP);
  
  // ⚡ Wi-Fi Connect වීම
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);

  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 30) { // 30 tries = 15 seconds
    delay(500);
    Serial.print(".");
    tries++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("ESP32 Local IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Server Target URL: ");
    Serial.println(serverUrl);
  } else {
    Serial.println("\n❌ WiFi Connection Failed! Check SSID/Password or WiFi range.");
  }
}


// ------------------- LOOP -------------------
void loop() {
  long now = millis(); 

  // ------------------- 1. Team A Sensor Check (GPIO 25) -------------------
  // If sensor is LOW (Activated)
  if (digitalRead(irPinA) == LOW) {
    // සහ අවසන් හඳුනාගැනීමෙන් පසු Debounce කාලය (10s) ගෙවී ඇත්නම්
    if (now - lastDetectionTimeA > debounceDelay) {
      
      teamAScore++; 
      
      // *** 🎯 Backend API එකට Goal 'A' එක යවන්න ***
      postGoalScore("A"); 
      
      Serial.print(">>> GOAL A COUNTED! Local Score: ");
      Serial.println(teamAScore);
      Serial.println("!!! Next Goal A can be counted in 10 seconds. !!!");
      
      lastDetectionTimeA = now; // Reset timer
    }
  }

  // ------------------- 2. Team B Sensor Check (GPIO 26) -------------------
  if (digitalRead(irPinB) == LOW) {
    if (now - lastDetectionTimeB > debounceDelay) {
      
      teamBScore++; 
      
      // *** 🎯 Backend API එකට Goal 'B' එක යවන්න ***
      postGoalScore("B"); 
      
      Serial.print(">>> GOAL B COUNTED! Local Score: ");
      Serial.println(teamBScore);
      Serial.println("!!! Next Goal B can be counted in 10 seconds. !!!");

      lastDetectionTimeB = now; // Reset timer
    }
  }
  
  delay(10); 
}
