package com.robotcontrol

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {
    private lateinit var bluetoothAdapter: BluetoothAdapter
    private lateinit var bluetoothService: BluetoothService
    private lateinit var robotController: RobotController
    
    // UI Components
    private lateinit var btnConnect: Button
    private lateinit var btnDisconnect: Button
    private lateinit var btnForward: Button
    private lateinit var btnBackward: Button
    private lateinit var btnLeft: Button
    private lateinit var btnRight: Button
    private lateinit var btnStop: Button
    private lateinit var btnFaceMode: Button
    private lateinit var btnChat: Button
    private lateinit var spinnerDevices: Spinner
    private lateinit var seekBarSpeed: SeekBar
    private lateinit var tvStatus: TextView
    private lateinit var tvSpeed: TextView
    
    private val REQUEST_ENABLE_BT = 1
    private val REQUEST_BLUETOOTH_PERMISSIONS = 2
    
    private var pairedDevices: Set<BluetoothDevice> = setOf()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        initializeViews()
        initializeBluetooth()
        setupListeners()
    }
    
    private fun initializeViews() {
        btnConnect = findViewById(R.id.btnConnect)
        btnDisconnect = findViewById(R.id.btnDisconnect)
        btnForward = findViewById(R.id.btnForward)
        btnBackward = findViewById(R.id.btnBackward)
        btnLeft = findViewById(R.id.btnLeft)
        btnRight = findViewById(R.id.btnRight)
        btnStop = findViewById(R.id.btnStop)
        btnFaceMode = findViewById(R.id.btnFaceMode)
        btnChat = findViewById(R.id.btnChat)
        spinnerDevices = findViewById(R.id.spinnerDevices)
        seekBarSpeed = findViewById(R.id.seekBarSpeed)
        tvStatus = findViewById(R.id.tvStatus)
        tvSpeed = findViewById(R.id.tvSpeed)
        
        btnDisconnect.isEnabled = false
        disableControls()
    }
    
    private fun initializeBluetooth() {
        val bluetoothManager = getSystemService(BLUETOOTH_SERVICE) as BluetoothManager
        bluetoothAdapter = bluetoothManager.adapter
        
        if (!bluetoothAdapter.isEnabled) {
            val enableBtIntent = Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (hasBluetoothPermissions()) {
                    startActivityForResult(enableBtIntent, REQUEST_ENABLE_BT)
                } else {
                    requestBluetoothPermissions()
                }
            } else {
                startActivityForResult(enableBtIntent, REQUEST_ENABLE_BT)
            }
        } else {
            loadPairedDevices()
        }
        
        bluetoothService = BluetoothService(bluetoothAdapter) { connected ->
            runOnUiThread {
                updateConnectionStatus(connected)
            }
        }
        
        robotController = RobotController(bluetoothService)
    }
    
    private fun setupListeners() {
        btnConnect.setOnClickListener {
            connectToDevice()
        }
        
        btnDisconnect.setOnClickListener {
            disconnectDevice()
        }
        
        btnForward.setOnClickListener {
            robotController.moveForward()
        }
        
        btnBackward.setOnClickListener {
            robotController.moveBackward()
        }
        
        btnLeft.setOnClickListener {
            robotController.turnLeft()
        }
        
        btnRight.setOnClickListener {
            robotController.turnRight()
        }
        
        btnStop.setOnClickListener {
            robotController.stop()
        }
        
        btnFaceMode.setOnClickListener {
            openFaceMode()
        }
        
        btnChat.setOnClickListener {
            openChat()
        }
        
        seekBarSpeed.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                tvSpeed.text = "Speed: $progress"
                robotController.setSpeed(progress)
            }
            
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {}
        })
    }
    
    private fun loadPairedDevices() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !hasBluetoothPermissions()) {
            requestBluetoothPermissions()
            return
        }
        
        pairedDevices = bluetoothAdapter.bondedDevices
        val deviceNames = pairedDevices.map { it.name ?: "Unknown" }.toTypedArray()
        
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, deviceNames)
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerDevices.adapter = adapter
    }
    
    private fun connectToDevice() {
        if (pairedDevices.isEmpty()) {
            Toast.makeText(this, "No paired devices found", Toast.LENGTH_SHORT).show()
            return
        }
        
        val selectedPosition = spinnerDevices.selectedItemPosition
        val device = pairedDevices.elementAt(selectedPosition)
        
        tvStatus.text = "Connecting..."
        bluetoothService.connect(device)
    }
    
    private fun disconnectDevice() {
        bluetoothService.disconnect()
        updateConnectionStatus(false)
    }
    
    private fun updateConnectionStatus(connected: Boolean) {
        if (connected) {
            tvStatus.text = "Connected"
            btnConnect.isEnabled = false
            btnDisconnect.isEnabled = true
            enableControls()
            Toast.makeText(this, "Connected successfully", Toast.LENGTH_SHORT).show()
        } else {
            tvStatus.text = "Disconnected"
            btnConnect.isEnabled = true
            btnDisconnect.isEnabled = false
            disableControls()
        }
    }
    
    private fun enableControls() {
        btnForward.isEnabled = true
        btnBackward.isEnabled = true
        btnLeft.isEnabled = true
        btnRight.isEnabled = true
        btnStop.isEnabled = true
        seekBarSpeed.isEnabled = true
    }
    
    private fun disableControls() {
        btnForward.isEnabled = false
        btnBackward.isEnabled = false
        btnLeft.isEnabled = false
        btnRight.isEnabled = false
        btnStop.isEnabled = false
        seekBarSpeed.isEnabled = false
    }
    
    private fun hasBluetoothPermissions(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
    }
    
    private fun requestBluetoothPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(
                    Manifest.permission.BLUETOOTH_CONNECT,
                    Manifest.permission.BLUETOOTH_SCAN,
                    Manifest.permission.ACCESS_FINE_LOCATION
                ),
                REQUEST_BLUETOOTH_PERMISSIONS
            )
        }
    }
    
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_BLUETOOTH_PERMISSIONS) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                loadPairedDevices()
            } else {
                Toast.makeText(this, "Bluetooth permissions required", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun openFaceMode() {
        val intent = Intent(this, RobotFaceActivity::class.java)
        intent.putExtra(RobotFaceActivity.EXTRA_EXPRESSION, "HAPPY")
        startActivity(intent)
    }
    
    private fun openChat() {
        val intent = Intent(this, ChatActivity::class.java)
        startActivity(intent)
    }
    
    override fun onDestroy() {
        super.onDestroy()
        bluetoothService.disconnect()
    }
}
