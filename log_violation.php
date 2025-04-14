<?php
// Database credentials
$servername = "localhost";
$username = "root";         // default XAMPP user
$password = "";             // default has no password
$dbname = "smart_traffic";

// Get JSON input
$data = json_decode(file_get_contents("php://input"), true);

// Debugging: Log incoming data
error_log("Incoming data: " . json_encode($data));

if (!$data) {
    http_response_code(400);
    echo "Invalid input data.";
    exit;
}

// Create DB connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    error_log("Connection failed: " . $conn->connect_error);
    echo "Connection failed: " . $conn->connect_error;
    exit;
}

// 1. Log Violation
if (isset($data['vehicle_id'], $data['violation_type'], $data['signal_id'])) {
    $vehicleId = $data['vehicle_id'];
    $violationType = $data['violation_type'];
    $signalId = $data['signal_id'];

    $stmt = $conn->prepare("INSERT INTO violations (vehicle_id, violation_type, signal_id) VALUES (?, ?, ?)");
    if ($stmt) {
        $stmt->bind_param("sss", $vehicleId, $violationType, $signalId);
        $stmt->execute();
        echo "Violation logged successfully.\n";
        $stmt->close();
    } else {
        echo "Violation log failed: " . $conn->error . "\n";
    }
}

// 2. Log Prediction
if (isset($data['prediction'], $data['time_frame'])) {
    $prediction = $data['prediction'];
    $timeFrame = $data['time_frame'];
    $confidence = isset($data['confidence_level']) ? $data['confidence_level'] : 0;

    // Debugging: Log values
    error_log("Prediction Data: time_frame=$timeFrame, prediction=$prediction, confidence=$confidence");

    $stmt = $conn->prepare("INSERT INTO predictions (time_frame, prediction, confidence_level) VALUES (?, ?, ?)");
    if ($stmt) {
        $stmt->bind_param("ssd", $timeFrame, $prediction, $confidence);
        $stmt->execute();
        echo "Prediction logged successfully.\n";
        $stmt->close();
    } else {
        error_log("Prediction log failed: " . $conn->error);
        echo "Prediction log failed: " . $conn->error . "\n";
    }
}

// 3. Log Manual Signal Change
if (isset($data['changed_signal'], $data['changed_to'])) {
    $changedSignal = $data['changed_signal'];
    $changedTo = $data['changed_to'];
    $changedBy = isset($data['changed_by']) ? $data['changed_by'] : 'admin';

    // Debugging: Log values
    error_log("Manual Signal Data: signal_id=$changedSignal, changed_to=$changedTo, changed_by=$changedBy");

    $stmt = $conn->prepare("INSERT INTO manual_signal_changes (signal_id, changed_to, changed_by) VALUES (?, ?, ?)");
    if ($stmt) {
        $stmt->bind_param("sss", $changedSignal, $changedTo, $changedBy);
        $stmt->execute();
        echo "Manual signal change logged successfully.\n";
        $stmt->close();
    } else {
        error_log("Signal change log failed: " . $conn->error);
        echo "Signal change log failed: " . $conn->error . "\n";
    }
}

$conn->close();
?>
