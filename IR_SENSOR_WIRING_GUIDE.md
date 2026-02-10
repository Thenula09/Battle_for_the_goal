# 🔌 IR Sensor Wiring & Signals - Quick Reference

## ESP32 GPIO Pin Configuration

```cpp
const int irPinA = 25; // Team A Sensor Signal Pin (GPIO 25)
const int irPinB = 26; // Team B Sensor Signal Pin (GPIO 26)
```

---

## IR Sensor Connection Table

| Component | Team A Sensor | Team B Sensor | ESP32 Pin |
|-----------|---------------|---------------|-----------|
| **Sensor VCC** | Red Wire | Red Wire | **5V** or **3.3V** |
| **Sensor GND** | Black Wire | Black Wire | **GND** |
| **Sensor OUT** | Yellow Wire | Yellow Wire | **GPIO 25** (Team A) / **GPIO 26** (Team B) |

---

## Physical Wiring Diagram

### Team A Sensor → ESP32
```
┌──────────────┐         ┌──────────────┐
│  IR Sensor   │         │    ESP32     │
│   (Team A)   │         │   DevKit     │
├──────────────┤         ├──────────────┤
│              │         │              │
│   VCC (Red)  ├────────→│  5V or 3.3V  │
│              │         │              │
│   GND (Blk)  ├────────→│     GND      │
│              │         │              │
│   OUT (Yel)  ├────────→│   GPIO 25    │
│              │         │              │
└──────────────┘         └──────────────┘
```

### Team B Sensor → ESP32
```
┌──────────────┐         ┌──────────────┐
│  IR Sensor   │         │    ESP32     │
│   (Team B)   │         │   DevKit     │
├──────────────┤         ├──────────────┤
│              │         │              │
│   VCC (Red)  ├────────→│  5V or 3.3V  │
│              │         │              │
│   GND (Blk)  ├────────→│     GND      │
│              │         │              │
│   OUT (Yel)  ├────────→│   GPIO 26    │
│              │         │              │
└──────────────┘         └──────────────┘
```

---

## Complete ESP32 Pinout for This Project

```
                     ESP32-DOIT-DEVKIT-V1
                     ┌──────────────────┐
                     │                  │
                 3V3 │●                ●│ GND
                 EN  │●                ●│ GPIO 23
            SENSOR_VP│●                ●│ GPIO 22
            SENSOR_VN│●                ●│ TX
     [B SENSOR] GPIO26│●                ●│ RX
     [A SENSOR] GPIO25│●                ●│ GPIO 21
                GPIO32│●                ●│ GPIO 19
                GPIO33│●                ●│ GPIO 18
                GPIO34│●       USB      ●│ GPIO 5
                GPIO35│●                ●│ GPIO 17
[POWER A,B]      VIN  │●                ●│ GPIO 16
[GROUND A,B]     GND  │●    ┌──────┐   ●│ GPIO 4
                     │     │ ESP32│    ●│ GPIO 0
                     │     │      │    ●│ GPIO 2
                     │     └──────┘    ●│ GPIO 15
                     │                  │
                     └──────────────────┘
```

### Pin Usage Summary:
- **GPIO 25** → Team A IR Sensor OUT
- **GPIO 26** → Team B IR Sensor OUT
- **5V or 3.3V** → Both sensor VCC (check sensor specs)
- **GND** → Both sensor GND (common ground)

---

## IR Sensor Signal Behavior

### Normal State (No Obstacle)
```
Sensor OUT pin: HIGH (3.3V)
LED on sensor: OFF
Serial Monitor: (no output)
```

### Goal Detected (Obstacle/Ball Blocks Sensor)
```
Sensor OUT pin: LOW (0V)
LED on sensor: ON (usually red)
Serial Monitor: ">>> GOAL A COUNTED!" or ">>> GOAL B COUNTED!"
HTTP POST sent: {"team":"A"} or {"team":"B"}
```

---

## Code Signal Detection

### How the Code Reads Signals
```cpp
// Check if sensor is activated (LOW = obstacle detected)
if (digitalRead(irPinA) == LOW) {
    // Check debounce delay (10 seconds between goals)
    if (now - lastDetectionTimeA > debounceDelay) {
        teamAScore++;
        postGoalScore("A");  // Send to server
        Serial.println(">>> GOAL A COUNTED!");
        lastDetectionTimeA = now;
    }
}
```

### Signal States
| Condition | Digital Read Value | Sensor LED | Action |
|-----------|-------------------|------------|--------|
| No ball (clear path) | `HIGH` | OFF | Nothing |
| Ball detected (blocked) | `LOW` | ON | Count goal & POST to server |

---

## Debounce Timing

```cpp
const long debounceDelay = 10000; // 10 seconds (10000 ms)
```

**Why 10 seconds?**
- Prevents counting same goal multiple times
- Ball might stay in sensor range for a few seconds
- Ensures clean goal counting

**Timeline:**
```
0s:   Ball detected → Goal counted → POST to server
1s:   Ball still there → Ignored (debounce active)
5s:   Ball still there → Ignored (debounce active)
10s:  Debounce expires → Ready for next goal
11s:  New ball detected → New goal counted!
```

---

## Testing IR Sensors

### Step-by-Step Sensor Test

1. **Upload ESP32 code**
2. **Open Serial Monitor** (115200 baud)
3. **Wait for WiFi connection**
4. **Block Team A sensor with hand**
   - Expected: `>>> GOAL A COUNTED! Local Score: 1`
5. **Wait 10 seconds**
6. **Block Team B sensor with hand**
   - Expected: `>>> GOAL B COUNTED! Local Score: 1`

### Sensor Sensitivity Adjustment

Most IR sensors have a **potentiometer (small screw)** on the board:

```
┌─────────────────┐
│  IR LED    ╔═╗  │ ← Potentiometer (turn with screwdriver)
│            ║ ║  │
│ Receiver   ╚═╝  │
│                 │
│  [VCC][GND][OUT]│
└─────────────────┘
```

**Adjustment:**
- Turn **clockwise** → Less sensitive (shorter range)
- Turn **counter-clockwise** → More sensitive (longer range)

**Test:** LED should turn ON when hand is 2-10cm away

---

## Common Signal Issues & Solutions

### Problem: Sensor Always LOW (always detecting)
**Symptoms:**
- Goals counted continuously
- Serial Monitor floods with "GOAL COUNTED!"

**Solutions:**
- Increase sensor distance from obstacles
- Turn potentiometer clockwise (reduce sensitivity)
- Check for reflective surfaces nearby

---

### Problem: Sensor Never LOW (not detecting)
**Symptoms:**
- Wave hand in front → no response
- LED never turns ON

**Solutions:**
- Check wiring (OUT pin connected?)
- Turn potentiometer counter-clockwise (increase sensitivity)
- Verify sensor has power (VCC & GND connected)
- Test with multimeter: OUT should be 3.3V when clear, 0V when blocked

---

### Problem: Intermittent Detection
**Symptoms:**
- Sometimes works, sometimes doesn't
- Random goal counts

**Solutions:**
- Check loose wire connections
- Ensure common ground between ESP32 and sensors
- Use shorter wires (< 30cm recommended)
- Add 10µF capacitor between VCC and GND at sensor

---

## Quick Wiring Checklist

- [ ] Team A sensor VCC → ESP32 5V (or 3.3V)
- [ ] Team A sensor GND → ESP32 GND
- [ ] Team A sensor OUT → ESP32 GPIO 25
- [ ] Team B sensor VCC → ESP32 5V (or 3.3V)
- [ ] Team B sensor GND → ESP32 GND
- [ ] Team B sensor OUT → ESP32 GPIO 26
- [ ] All connections are secure
- [ ] No short circuits
- [ ] Sensor LEDs power on when ESP32 powered
- [ ] Sensor detection LEDs respond to obstacles

---

## Breadboard Wiring (Optional)

If using a breadboard:

```
        ESP32              Breadboard              IR Sensors
        ─────              ──────────              ──────────
         5V  ──────────→ [+ Rail] ──────┬────→ Sensor A VCC
                                         └────→ Sensor B VCC
                                         
         GND ──────────→ [- Rail] ──────┬────→ Sensor A GND
                                         └────→ Sensor B GND
                                         
      GPIO25 ───────────────────────────────→ Sensor A OUT
      
      GPIO26 ───────────────────────────────→ Sensor B OUT
```

---

## Serial Monitor Output Examples

### Successful Goal Detection
```
Sending POST request: {"team":"A"}
HTTP Response code: 200
Server Response: {"message":"Team A score updated!","score":5}
>>> GOAL A COUNTED! Local Score: 1
!!! Next Goal A can be counted in 10 seconds. !!!
```

### During Debounce Period
```
(No output - sensor reading ignored)
```

### After Debounce Expires
```
Sending POST request: {"team":"A"}
HTTP Response code: 200
Server Response: {"message":"Team A score updated!","score":6}
>>> GOAL A COUNTED! Local Score: 2
!!! Next Goal A can be counted in 10 seconds. !!!
```

---

## Advanced: Changing GPIO Pins

If you need to use different pins, update these lines:

```cpp
// Original pins
const int irPinA = 25;
const int irPinB = 26;

// Example: Change to GPIO 18 and GPIO 19
const int irPinA = 18;
const int irPinB = 19;
```

**Safe GPIO pins for input on ESP32:**
- GPIO 4, 5, 12-15, 16-19, 21-23, 25-27, 32-39

**Avoid these pins:**
- GPIO 0, 2 (boot mode pins)
- GPIO 6-11 (connected to flash)
- GPIO 34-39 (input only, no pull-up)

---

## Power Consumption Notes

### Typical Current Draw
- ESP32: ~160mA (WiFi active)
- Each IR sensor: ~20-30mA
- **Total: ~200-220mA**

### Power Options
1. **USB Cable** (easiest, recommended for development)
2. **5V Power Adapter** → VIN pin
3. **Battery** (3x AA = 4.5V or 2x 18650 Li-ion = 7.4V) → VIN pin

⚠️ **Warning:** Do NOT exceed 5V on VIN pin!

---

## 🎯 Final Check Before Use

1. ✅ All wires connected securely
2. ✅ No shorts between VCC and GND
3. ✅ Serial Monitor shows WiFi connected
4. ✅ Hand blocks sensor → LED turns ON
5. ✅ Hand blocks sensor → Serial shows "GOAL COUNTED!"
6. ✅ Server receives POST request (check server terminal)
7. ✅ UI updates with new score
8. ✅ Sensor potentiometer adjusted for proper distance

---

**You're ready to count goals! ⚽🎉**
