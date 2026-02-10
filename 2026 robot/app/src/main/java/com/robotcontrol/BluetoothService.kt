package com.robotcontrol

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import java.io.IOException
import java.io.OutputStream
import java.util.*

class BluetoothService(
    private val bluetoothAdapter: BluetoothAdapter,
    private val connectionCallback: (Boolean) -> Unit
) {
    private var bluetoothSocket: BluetoothSocket? = null
    private var outputStream: OutputStream? = null
    private var isConnected = false
    
    // Standard SerialPortService ID for Bluetooth SPP
    private val UUID_SPP = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
    
    fun connect(device: BluetoothDevice) {
        Thread {
            try {
                // Cancel discovery to improve connection speed
                bluetoothAdapter.cancelDiscovery()
                
                // Create socket
                bluetoothSocket = device.createRfcommSocketToServiceRecord(UUID_SPP)
                
                // Connect
                bluetoothSocket?.connect()
                
                // Get output stream
                outputStream = bluetoothSocket?.outputStream
                
                isConnected = true
                connectionCallback(true)
                
            } catch (e: IOException) {
                e.printStackTrace()
                isConnected = false
                connectionCallback(false)
                
                try {
                    bluetoothSocket?.close()
                } catch (closeException: IOException) {
                    closeException.printStackTrace()
                }
            }
        }.start()
    }
    
    fun disconnect() {
        try {
            isConnected = false
            outputStream?.close()
            bluetoothSocket?.close()
            connectionCallback(false)
        } catch (e: IOException) {
            e.printStackTrace()
        }
    }
    
    fun sendCommand(command: String): Boolean {
        if (!isConnected || outputStream == null) {
            return false
        }
        
        return try {
            outputStream?.write(command.toByteArray())
            outputStream?.flush()
            true
        } catch (e: IOException) {
            e.printStackTrace()
            isConnected = false
            connectionCallback(false)
            false
        }
    }
    
    fun isConnected(): Boolean {
        return isConnected
    }
}
