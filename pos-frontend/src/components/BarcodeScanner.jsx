// src/components/BarcodeScanner.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException, DecodeHintType, BarcodeFormat } from '@zxing/library';

// Key for storing the preferred camera ID in localStorage
const PREFERRED_CAMERA_ID_KEY = 'preferredCameraId';

function BarcodeScanner({ onScanSuccess, onClose }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const streamRef = useRef(null); // Primarily for cleanup in effect 2
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(''); // For "Default Saved" message

  // --- Effect 1: Enumerate Devices, Load Preference, Select Initial ---
  useEffect(() => {
    const getDevicesAndSelect = async () => {
      setError(null);
      let initialDeviceIdToSelect = null;
      try {
        // Get initial permission to help ensure labels are not blank
        const initialStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        // Stop the initial stream immediately after getting permission and device list
        initialStream.getTracks().forEach(track => track.stop());

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputDevices = devices.filter(device => device.kind === 'videoinput');

        console.log("Available video devices:", JSON.stringify(videoInputDevices, null, 2));
        setVideoDevices(videoInputDevices);

        if (videoInputDevices.length === 0) {
          setError("No video input devices found."); return;
        }

        // --- Load Preferred Camera ID ---
        const preferredId = localStorage.getItem(PREFERRED_CAMERA_ID_KEY);
        let usingPreferred = false;
        if (preferredId) {
          const foundPreferred = videoInputDevices.find(device => device.deviceId === preferredId);
          if (foundPreferred) {
            console.log("Found preferred camera in localStorage:", foundPreferred);
            initialDeviceIdToSelect = preferredId;
            usingPreferred = true;
          } else {
            console.log("Preferred camera ID from localStorage not found in current device list.");
            localStorage.removeItem(PREFERRED_CAMERA_ID_KEY);
          }
        }

        // --- If no valid preferred ID, use heuristic to select default ---
        if (!initialDeviceIdToSelect) {
          console.log("No valid preferred camera found, selecting default using heuristic...");
          let bestDevice = null;
          const rearCameras = videoInputDevices.filter(device =>
              device.label.toLowerCase().includes('back') || !device.label.toLowerCase().includes('front')
          );
          console.log("Filtered rear cameras:", JSON.stringify(rearCameras, null, 2));
          if (rearCameras.length > 0) {
            bestDevice = rearCameras.find(device => // Prefer non-ultrawide
               !device.label.toLowerCase().includes('ultra') && !device.label.toLowerCase().includes('uw')
            ) || rearCameras[0];
          } else { bestDevice = videoInputDevices[0]; }

          if (bestDevice) {
            console.log("Selected device by default heuristic:", bestDevice);
            initialDeviceIdToSelect = bestDevice.deviceId;
          }
        }

        // --- Set the initial state ---
        if (initialDeviceIdToSelect) {
          setSelectedDeviceId(initialDeviceIdToSelect);
           if(usingPreferred) setFeedbackMessage('Loaded preferred camera.');
           setTimeout(() => setFeedbackMessage(''), 2000);
        } else { setError("Could not determine a suitable camera."); }
      } catch (err) {
        console.error("Error enumerating devices or getting initial permission:", err);
        setError(`Failed to list cameras: ${err.message}`);
      }
    };
    getDevicesAndSelect();
  }, []);

  // --- Effect 2: Start Scanning when a Device is Selected ---
  useEffect(() => {
    console.log(`Effect for selectedDeviceId running. Current selectedDeviceId: ${selectedDeviceId}`);
    if (!selectedDeviceId || !videoRef.current) {
       console.log(`Effect dependencies not ready (selectedDeviceId: ${selectedDeviceId}, videoRef exists: ${!!videoRef.current}), exiting effect.`);
      return;
    }

    const videoElement = videoRef.current;
    let currentStream = null;
    let reader = null; // Define reader locally for this effect scope

    const startScanForDevice = async () => {
      setError(null);
      setIsScanning(false);
      console.log(`Attempting to use deviceId: ${selectedDeviceId}`);

      // Create Reader Instance INSIDE Effect
      const hints = new Map();
      const formats = [ BarcodeFormat.QR_CODE, BarcodeFormat.EAN_13, BarcodeFormat.CODE_128 ]; // Common formats
      hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
      hints.set(DecodeHintType.TRY_HARDER, true); // Keep TRY_HARDER for now
      reader = new BrowserMultiFormatReader(hints);
      readerRef.current = reader; // Assign to ref

      try {
        // Use simplified constraints focusing on deviceId
        const constraints = { video: { deviceId: { exact: selectedDeviceId } } };
        console.log(`Requesting stream with constraints:`, constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        currentStream = stream;

        videoElement.srcObject = stream;

        // Use oncanplay event
        videoElement.oncanplay = () => {
          console.log(`Video can play: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
          setIsScanning(true); // Set scanning state

          videoElement.play().catch(playError => {
             console.warn("Video play() promise rejected (often benign):", playError);
          });

          console.log('Attempting to start decodeContinuously...');
          try {
              // Use the locally defined reader instance
              reader.decodeContinuously(videoElement, (result, err) => {
                // Callback runs for every frame
                if (result && isScanning) { // Check isScanning only if needed for pausing logic
                  // setIsScanning(false); // Optional: pause scanning on success
                  console.log('ZXing Success:', result.getText());
                  onScanSuccess(result.getText());
                }
                if (err) {
                   if (!(err instanceof NotFoundException)) {
                       // Log significant errors
                       console.error('ZXing Scan Error:', err);
                       setError(`Scan Error: ${err.message}`);
                       setIsScanning(false); // Stop on significant error
                   } else {
                       // Log NotFoundException to confirm activity
                       console.log('ZXing: NotFoundException');
                   }
                }
             });
             console.log('decodeContinuously call initiated successfully.');
          } catch (initDecodeErr) {
             // Catch error if decodeContinuously call itself fails
             console.error("Error thrown initiating decodeContinuously:", initDecodeErr);
             setError(`Scanner init error: ${initDecodeErr.message}`);
             setIsScanning(false);
          }
        }; // end oncanplay handler

        videoElement.onerror = (e) => {
            console.error("Video element error:", e);
            setError("Error loading video stream.");
            setIsScanning(false);
        };

      } catch (err) {
        // Log specific camera start errors
        console.error(`Error accessing camera with deviceId ${selectedDeviceId}:`, err);
        setError(`Failed to start selected camera (${err.name}): ${err.message}`);
        setIsScanning(false);
      }
    }; // end startScanForDevice

    startScanForDevice();

    // Cleanup function
    return () => {
      console.log(`Cleaning up scanner effect for deviceId: ${selectedDeviceId}`);
      readerRef.current?.reset(); // Use the ref here which holds the instance
      if (currentStream) {
        console.log("Stopping stream tracks...");
        currentStream.getTracks().forEach(track => track.stop());
      }
      if (videoElement) {
         videoElement.srcObject = null;
         videoElement.oncanplay = null; // Cleanup matching event listener
         videoElement.onerror = null;
      }
    };
  }, [selectedDeviceId]); // Only depends on selectedDeviceId


  // --- Helper Functions & JSX ---
  const handleRetry = useCallback(() => {
     setError(null);
     setIsScanning(true);
     console.log("Attempting to re-enable scanning state");
  }, []);

  // Add explicit "Set Default" button logic
  const handleSetDefault = useCallback(() => {
    if (selectedDeviceId) {
        localStorage.setItem(PREFERRED_CAMERA_ID_KEY, selectedDeviceId);
        console.log(`Saved preferred camera ID to localStorage: ${selectedDeviceId}`);
        setFeedbackMessage('Default camera saved!');
        setTimeout(() => setFeedbackMessage(''), 2000);
    } else {
        console.log("No device selected to set as default.");
        setFeedbackMessage('Select a camera first!');
        setTimeout(() => setFeedbackMessage(''), 2000);
    }
  }, [selectedDeviceId]);

  // Dropdown change handler (no longer saves automatically)
  const handleDeviceChange = useCallback((event) => {
    const newDeviceId = event.target.value;
    console.log(`Dropdown changed! Selected value (deviceId): ${newDeviceId}`);
    setSelectedDeviceId(newDeviceId);
  }, []);

  // --- JSX Rendering ---
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4">
      <div className="bg-white p-4 rounded-lg relative max-w-md w-full">
        <h3 className="text-lg font-medium mb-2 text-center">Scan Barcode</h3>

        {/* Camera Selection Area */}
        {videoDevices.length > 1 && (
          <div className="mb-2 flex items-end space-x-2">
            <div className="flex-grow">
              <label htmlFor="camera-select" className="block text-sm font-medium text-gray-700 mb-1">Select Camera:</label>
              <select
                id="camera-select"
                value={selectedDeviceId || ''}
                onChange={handleDeviceChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                {videoDevices.map((device, index) => (
                  <option key={device.deviceId || index} value={device.deviceId}>
                    {device.label || `Camera ${index + 1} (${device.deviceId.substring(0, 6)}...)`}
                  </option>
                ))}
              </select>
            </div>
            {/* Set Default Button */}
            <button
              onClick={handleSetDefault}
              disabled={!selectedDeviceId}
              title="Set selected camera as default for next time"
              className={`px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${!selectedDeviceId ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Set Default
            </button>
          </div>
        )}
        {videoDevices.length === 1 && videoDevices[0] && (
             <p className="text-xs text-gray-500 mb-2">Using: {videoDevices[0].label || 'Default Camera'}</p>
        )}
        {/* Feedback Message Area */}
        {feedbackMessage && (
            <p className="text-xs text-center text-green-600 mb-2">{feedbackMessage}</p>
        )}

        {/* Video Element & Overlay Container */}
        <div className="relative w-full aspect-video bg-gray-800 mb-3">
          <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3/4 h-1/2 border-4 border-red-500 opacity-75 rounded-lg"></div>
          </div>
        </div>

        {/* Error Display Area */}
        {error && (
          <div className="text-red-600 bg-red-100 p-3 rounded mb-3 text-sm">
            <p>{error}</p>
             {error.toLowerCase().startsWith("scan error:") &&
                <button onClick={handleRetry} className="mt-1 text-blue-600 underline">Try Again / Scan Next</button>
             }
          </div>
        )}

        {/* Status Display Area */}
        {!isScanning && !error && selectedDeviceId && (
            <div className="text-green-600 bg-green-100 p-3 rounded mb-3 text-sm text-center">
                Scan complete or paused.
                <button onClick={handleRetry} className="mt-1 text-blue-600 underline block mx-auto">Scan Next</button>
            </div>
        )}
         {isScanning && !error && selectedDeviceId && ( <div className="text-gray-600 text-sm text-center mb-2">Aim camera at barcode...</div> )}
         {!selectedDeviceId && !error && videoDevices.length > 0 && ( <div className="text-gray-600 text-sm text-center mb-2">Select a camera to start...</div> )}
         {!selectedDeviceId && !error && videoDevices.length === 0 && !error && ( <div className="text-gray-600 text-sm text-center mb-2">Finding cameras...</div> )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel / Close Scanner
        </button>
      </div>
    </div>
  );
}

export default BarcodeScanner;