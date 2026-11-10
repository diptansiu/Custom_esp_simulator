import sys
import time
import json
import threading

def emit(data):
    sys.stdout.write(json.dumps(data) + '\n')
    sys.stdout.flush()

digital_inputs = {}
analog_inputs = {}
running = True

def ipc_listener():
    global running, digital_inputs, analog_inputs
    while running:
        line = sys.stdin.readline()
        if not line:
            break
        try:
            msg = json.loads(line.strip())
            ev = msg.get('event')
            if ev == 'stop':
                running = False
                sys.exit(0)
            elif ev == 'pin_in':
                digital_inputs[msg['pin']] = msg['val']
            elif ev == 'adc_in':
                analog_inputs[msg['pin']] = msg['val']
        except:
            pass

listener = threading.Thread(target=ipc_listener, daemon=True)
listener.start()

class Pin:
    OUT = 'OUTPUT'
    IN = 'INPUT'
    PULL_UP = 'INPUT_PULLUP'

    def __init__(self, pin, mode=OUT, pull=None):
        self.pin = pin
        self.mode = Pin.PULL_UP if pull == Pin.PULL_UP else mode
        emit({"type": "pinMode", "pin": self.pin, "mode": self.mode})

    def value(self, val=None):
        if val is not None:
            emit({"type": "digitalWrite", "pin": self.pin, "val": 1 if val else 0})
        else:
            return digital_inputs.get(self.pin, 0)

    def on(self):
        self.value(1)

    def off(self):
        self.value(0)

class ADC:
    def __init__(self, pin):
        self.pin = pin.pin if isinstance(pin, Pin) else pin

    def read(self):
        return analog_inputs.get(self.pin, 0)

    def read_u16(self):
        val = self.read()
        return int((val / 4095.0) * 65535)

class PWM:
    def __init__(self, pin, freq=1000, duty=0):
        self.pin = pin.pin if isinstance(pin, Pin) else pin
        self.duty(duty)

    def duty(self, val):
        duty_val = max(0, min(255, int((val / 1023.0) * 255)))
        emit({"type": "pwm", "pin": self.pin, "duty": duty_val})

# Global mock modules in sys.modules
import types
machine_mod = types.ModuleType('machine')
machine_mod.Pin = Pin
machine_mod.ADC = ADC
machine_mod.PWM = PWM
sys.modules['machine'] = machine_mod

# Override print to send serial events
builtins_print = print
def custom_print(*args, **kwargs):
    text = " ".join(str(a) for a in args) + "\r\n"
    emit({"type": "serial", "text": text})

import builtins
builtins.print = custom_print
