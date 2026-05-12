import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { glassesCatalog, loadGlassesImages } from '../lib/glassesData';
import { Loader2, Camera, Glasses } from 'lucide-react';

export default function ARGlasses() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [selectedGlassesIndex, setSelectedGlassesIndex] = useState(0);
  const selectedIndexRef = useRef(0);

  // Sync ref with state
  useEffect(() => {
    selectedIndexRef.current = selectedGlassesIndex;
  }, [selectedGlassesIndex]);

  // Load image assets once on mount
  useEffect(() => {
    loadGlassesImages();
  }, []);

  useEffect(() => {
    let faceLandmarker: FaceLandmarker;
    let stream: MediaStream;
    let lastVideoTime = -1;

    async function initAR() {
      try {
        // 1. Initialize FaceLandmarker
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
          },
          outputFaceBlendshapes: false,
          runningMode: "VIDEO",
          numFaces: 1
        });

        // 2. Setup Camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsInitializing(false);
            predictFrame();
          };
        }
      } catch (err) {
        console.error("Initialization error:", err);
        setErrorDetails(err instanceof Error ? err.message : String(err));
        setIsInitializing(false);
      }
    }

    function predictFrame() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !faceLandmarker) return;

      if (video.videoWidth > 0 && video.videoHeight > 0) {
        // Sync canvas size to video size exactly
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Process frame if video advanced
          if (video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;
            const results = faceLandmarker.detectForVideo(video, performance.now());
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // If a face is found, draw the glasses
            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
              const landmarks = results.faceLandmarks[0];
              drawGlasses(ctx, landmarks, canvas.width, canvas.height);
            }
          }
        }
      }
      
      requestRef.current = requestAnimationFrame(predictFrame);
    }

    function drawGlasses(ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number) {
      // Get selected glasses using the latest ref
      const glasses = glassesCatalog[selectedIndexRef.current];
      if (!glasses || !glasses.image) return;

      // Left eye on unmirrored screen (User's right eye)
      // fallback to [362, 263, 386, 374] average if pupil not available
      const ptLeft = landmarks.length >= 478 ? landmarks[468] : {
        x: (landmarks[362].x + landmarks[263].x + landmarks[386].x + landmarks[374].x) / 4,
        y: (landmarks[362].y + landmarks[263].y + landmarks[386].y + landmarks[374].y) / 4,
      };

      // Right eye on unmirrored screen (User's left eye)
      // fallback to [133, 33, 159, 145] average
      const ptRight = landmarks.length >= 478 ? landmarks[473] : {
        x: (landmarks[133].x + landmarks[33].x + landmarks[159].x + landmarks[145].x) / 4,
        y: (landmarks[133].y + landmarks[33].y + landmarks[159].y + landmarks[145].y) / 4,
      };

      const nose = landmarks[168];

      // Convert normalized points [0, 1] to pixel coordinates
      const leftX = ptLeft.x * width;
      const leftY = ptLeft.y * height;
      const rightX = ptRight.x * width;
      const rightY = ptRight.y * height;
      const noseX = nose.x * width;
      const noseY = nose.y * height;

      // Calculate pupillary distance (PD) and angle
      const dx = rightX - leftX;
      const dy = rightY - leftY;
      const pd = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      
      // Calculate drawing dimensions relative to User's PD
      const rWidth = pd * glasses.widthRatio;
      const imageRatio = glasses.image.height / glasses.image.width;
      const rHeight = rWidth * imageRatio;

      ctx.save();
      
      // Translate to nose bridge landmark
      ctx.translate(noseX, noseY);
      
      // Rotate by the angle between the two eyes
      ctx.rotate(angle);
      
      // Calculate Y starting coordinate.
      // yOffset positive shifts the glasses DOWN.
      const drawY = -rHeight / 2 + (rHeight * glasses.yOffset);

      // Draw image centered horizontally on the nose bridge
      ctx.drawImage(
        glasses.image,
        -rWidth / 2,
        drawY,
        rWidth,
        rHeight
      );
      
      ctx.restore();
    }

    initAR();

    return () => {
      // Cleanup
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (faceLandmarker) faceLandmarker.close();
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []); // Empty dependency array so camera initialized only once

  // To prevent camera restarting on styling change, let's decouple glassesIndex from the useEffect.
  // We'll use a ref for the selected index.

  return (
    <div className="relative w-full h-full min-h-screen bg-neutral-900 overflow-hidden font-sans text-neutral-100 flex flex-col justify-between">
      
      {/* Viewport for Video and AR overlay */}
      <div className="relative w-full h-full flex-grow overflow-hidden bg-black flex items-center justify-center">
        
        {isInitializing && !errorDetails && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-neutral-900/80 backdrop-blur-sm">
            <Loader2 className="w-12 h-12 animate-spin text-white mb-4" />
            <p className="text-sm font-medium tracking-wide">Loading AI Models...</p>
          </div>
        )}

        {errorDetails && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-red-950 px-6 text-center">
            <Camera className="w-12 h-12 text-red-500 mb-4 opacity-50" />
            <p className="font-semibold text-lg max-w-sm mb-2">Camera Access Required</p>
            <p className="text-sm text-red-200/80 max-w-md">{errorDetails}</p>
          </div>
        )}

        {/* Video stream - CSS mirrored so user sees themselves natively like a mirror */}
        <video 
          ref={videoRef}
          className="absolute w-full h-full object-cover -scale-x-100"
          autoPlay 
          playsInline 
          muted
        />
        
        {/* Canvas overlay - Also CSS mirrored so coordinate mapping is direct and seamless! */}
        <canvas 
          ref={canvasRef}
          className="absolute w-full h-full object-cover -scale-x-100 mix-blend-normal pointer-events-none"
        />

      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-0 w-full p-6 pb-10 bg-gradient-to-t from-neutral-950 via-neutral-900/80 to-transparent flex flex-col items-center z-20">
        
        <div className="flex items-center gap-2 mb-6 opacity-70">
          <Glasses size={18} />
          <span className="text-xs uppercase tracking-widest font-semibold font-mono">Select Style</span>
        </div>

        {/* Carousel of glasses */}
        <div className="flex gap-4 overflow-x-auto w-full max-w-lg pb-4 snap-x snap-mandatory hide-scrollbar justify-center px-4">
          {glassesCatalog.map((glasses, idx) => {
            const isSelected = selectedGlassesIndex === idx;
            return (
              <button
                key={glasses.id}
                onClick={() => setSelectedGlassesIndex(idx)}
                className={`flex-none snap-center transition-all duration-300 relative group
                  w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg
                  ${isSelected ? 'bg-white text-black scale-110' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
              >
                <div className="w-12 h-12" dangerouslySetInnerHTML={{ __html: glasses.svg }} />
                
                {/* Visual focus ring */}
                {isSelected && (
                  <div className="absolute inset-0 border-2 border-white rounded-2xl scale-[1.12] opacity-50 
                    transition-all duration-300 group-hover:scale-[1.18]" />
                )}
              </button>
            )
          })}
        </div>
      </div>

    </div>
  );
}
