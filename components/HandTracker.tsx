import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useStore } from '../store';
import { GestureType } from '../types';

const HandTracker = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [loaded, setLoaded] = useState(false);
  
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const requestRef = useRef<number>(0);
  
  const setGesture = useStore(state => state.setGesture);

  // Initialize MediaPipe
  useEffect(() => {
    const init = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        handLandmarkerRef.current = handLandmarker;
        setLoaded(true);
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
      }
    };
    init();
  }, []);

  const toggleCamera = () => {
    setIsCameraRunning(prev => !prev);
  };

  useEffect(() => {
    if (isCameraRunning) {
        const startWebcam = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.addEventListener("loadeddata", predictWebcam);
                }
            } catch (err) {
                console.error(err);
                setIsCameraRunning(false);
            }
        };
        startWebcam();
    } else {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        cancelAnimationFrame(requestRef.current);
    }
  }, [isCameraRunning]);

  const predictWebcam = () => {
     if (!handLandmarkerRef.current || !videoRef.current || !canvasRef.current) return;
     
     const video = videoRef.current;
     const canvas = canvasRef.current;
     const ctx = canvas.getContext('2d');
     
     if (video.currentTime !== lastVideoTimeRef.current) {
         lastVideoTimeRef.current = video.currentTime;
         const results = handLandmarkerRef.current.detectForVideo(video, performance.now());
         
         // Draw
         ctx?.clearRect(0, 0, canvas.width, canvas.height);
         
         if (results.landmarks && results.landmarks.length > 0) {
            // Draw detections (simple dots for now)
            const landmarks = results.landmarks[0];
            ctx!.fillStyle = "#00FF00";
            for(const point of landmarks) {
                ctx?.beginPath();
                ctx?.arc(point.x * canvas.width, point.y * canvas.height, 3, 0, 2*Math.PI);
                ctx?.fill();
            }

            // Simple Gesture Logic
            // Open Palm: Fingers extended
            // Closed Fist: Fingers curled
            const tips = [8, 12, 16, 20]; // Index, Middle, Ring, Pinky tips
            const pips = [6, 10, 14, 18]; // Corresponding PIP joints
            
            let openFingers = 0;
            // Thumb logic roughly
            if (landmarks[4].x < landmarks[3].x) openFingers++; // Depending on hand, this is simple approx
            
            for(let i=0; i<4; i++) {
                if(landmarks[tips[i]].y < landmarks[pips[i]].y) { // Y is inverted in some contexts, but usually 0 is top
                    // If tip is higher (smaller y) than pip, it's open
                    openFingers++;
                }
            }

            if (openFingers >= 4) {
                setGesture(GestureType.OpenPalm);
            } else if (openFingers <= 1) {
                setGesture(GestureType.ClosedFist);
            } else {
                setGesture(GestureType.None);
            }

         } else {
             setGesture(GestureType.None);
         }
     }
     
     if (isCameraRunning) {
        requestRef.current = requestAnimationFrame(predictWebcam);
     }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
      <div className={`
        relative overflow-hidden rounded-xl border border-white/20 shadow-lg 
        backdrop-blur-md transition-all duration-500
        ${isCameraRunning ? 'w-48 h-36 bg-white/10' : 'w-48 h-12 bg-transparent'}
      `}>
          {!isCameraRunning ? (
               <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">
                   Camera Off
               </div>
          ) : (
            <>
                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover -scale-x-100 opacity-50" />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full -scale-x-100" width={320} height={240} />
            </>
          )}
      </div>

      <button 
        onClick={toggleCamera}
        disabled={!loaded}
        className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium tracking-wider backdrop-blur-md transition-colors disabled:opacity-50"
      >
        {loaded ? (isCameraRunning ? 'CLOSE CAMERA' : 'OPEN CAMERA') : 'LOADING AI...'}
      </button>
    </div>
  );
};

export default HandTracker;
