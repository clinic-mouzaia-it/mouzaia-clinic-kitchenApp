"use client";

import { useState } from "react";
import {
  Scanner,
  useDevices,
  outline,
  boundingBox,
  centerText,
} from "@yudiel/react-qr-scanner";

interface ScannerPageProps {
  onDetected: (data: string) => void;
  onClose: () => void;
}

export default function ScannerPage({ onDetected, onClose }: ScannerPageProps) {
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [tracker, setTracker] = useState<string | undefined>("centerText");
  const [pause, setPause] = useState(false);
  const devices = useDevices();

  function getTracker() {
    switch (tracker) {
      case "outline":
        return outline;
      case "boundingBox":
        return boundingBox;
      case "centerText":
        return centerText;
      default:
        return undefined;
    }
  }

  const handleScan = (data: string) => {
    if (data) {
      setPause(true); // pause scanning
      onDetected(data); // send data back to Home
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex flex-col items-center justify-center">
      <div className="mb-4">
        <select
          onChange={(e) => setDeviceId(e.target.value)}
          className="p-2 rounded"
        >
          <option value={undefined}>Select a device</option>
          {devices.map((device, index) => (
            <option key={index} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
        <select
          style={{ marginLeft: 5 }}
          onChange={(e) => setTracker(e.target.value)}
          className="p-2 rounded"
        >
          <option value="centerText">Center Text</option>
          <option value="outline">Outline</option>
          <option value="boundingBox">Bounding Box</option>
          <option value={undefined}>No Tracker</option>
        </select>
      </div>

      <Scanner
        formats={["qr_code"]}
        constraints={{
          deviceId: deviceId,
        }}
        onScan={(detectedCodes) => {
          if (detectedCodes.length > 0) {
            handleScan(detectedCodes[0].rawValue);
          }
        }}
        onError={(error) => {
          console.error(`Scanner error: ${error}`);
          onClose(); // close on error
        }}
        styles={{ container: { height: "400px", width: "350px" } }}
        components={{
          onOff: true,
          torch: true,
          zoom: true,
          finder: true,
          tracker: getTracker(),
        }}
        allowMultiple={false}
        scanDelay={500}
        paused={pause}
      />

      <button
        onClick={onClose}
        className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
      >
        Cancel
      </button>
    </div>
  );
}
