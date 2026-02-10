package com.robotcontrol

class RobotController(private val bluetoothService: BluetoothService) {
    
    private var currentSpeed: Int = 5
    
    // Command constants
    companion object {
        const val CMD_FORWARD = "F"
        const val CMD_BACKWARD = "B"
        const val CMD_LEFT = "L"
        const val CMD_RIGHT = "R"
        const val CMD_STOP = "S"
        const val CMD_SPEED_PREFIX = "V"
    }
    
    fun moveForward() {
        sendCommand(CMD_FORWARD)
    }
    
    fun moveBackward() {
        sendCommand(CMD_BACKWARD)
    }
    
    fun turnLeft() {
        sendCommand(CMD_LEFT)
    }
    
    fun turnRight() {
        sendCommand(CMD_RIGHT)
    }
    
    fun stop() {
        sendCommand(CMD_STOP)
    }
    
    fun setSpeed(speed: Int) {
        if (speed in 0..9) {
            currentSpeed = speed
            sendCommand("$CMD_SPEED_PREFIX$speed")
        }
    }
    
    fun getSpeed(): Int {
        return currentSpeed
    }
    
    private fun sendCommand(command: String) {
        if (bluetoothService.isConnected()) {
            bluetoothService.sendCommand(command)
        }
    }
    
    // Advanced movement commands
    fun moveForwardLeft() {
        sendCommand("FL")
    }
    
    fun moveForwardRight() {
        sendCommand("FR")
    }
    
    fun moveBackwardLeft() {
        sendCommand("BL")
    }
    
    fun moveBackwardRight() {
        sendCommand("BR")
    }
    
    // Custom command
    fun sendCustomCommand(command: String) {
        sendCommand(command)
    }
}
