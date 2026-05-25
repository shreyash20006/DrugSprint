import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { ArrowRight, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'];
  const lowerUrl = url.toLowerCase();
  return (
    videoExtensions.some(ext => lowerUrl.endsWith(ext)) ||
    lowerUrl.includes('/video/upload/') ||
    (lowerUrl.includes('res.cloudinary.com/') && lowerUrl.includes('/video/'))
  );
};

export const DNAHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const scrollProgressRef = useRef(0);
  const [bannerUrl, setBannerUrl] = useState<string>('');

  // Fetch customizable banner settings
  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'banner_url')
          .maybeSingle();
        if (data?.value) {
          setBannerUrl(data.value);
        }
      } catch (err) {
        console.error('Error fetching dynamic banner setting:', err);
      }
    };
    fetchBanner();
  }, []);

  // Listen to viewport scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      scrollProgressRef.current = progress;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize Three.js 3D DNA Helix
  useEffect(() => {
    if (!containerRef.current) return;

    const containerElement = containerRef.current;
    let renderer: THREE.WebGLRenderer | null = null;
    let animFrameId: number = 0;

    // Track visibility to pause render loop on background tabs (performance)
    let isTabVisible = true;
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Three.js geometries and materials trackers for disposal
    const geometriesToDispose: THREE.BufferGeometry[] = [];
    const materialsToDispose: THREE.Material[] = [];

    const registerGeometry = (geo: THREE.BufferGeometry) => {
      geometriesToDispose.push(geo);
      return geo;
    };
    const registerMaterial = (mat: THREE.Material) => {
      materialsToDispose.push(mat);
      return mat;
    };

    let handleContainerClick: ((e: MouseEvent) => void) | null = null;
    let handleMouseMove: ((e: MouseEvent) => void) | null = null;
    let handleResize: (() => void) | null = null;

    try {
      // 1. SCENE & CAMERA SETUP
      const scene = new THREE.Scene();
      
      const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 30);

      // 2. RENDERER SETUP (Transparent canvas for layering)
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0); // Completely transparent background
      containerElement.appendChild(renderer.domElement);

      // 3. LIGHTS
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
      scene.add(ambientLight);

      // Glowing PointLights
      const orangeLight = new THREE.PointLight(0xC84B0E, 2, 50);
      orangeLight.position.set(10, 0, 10);
      scene.add(orangeLight);

      const blueLight = new THREE.PointLight(0x3B82F6, 1, 50);
      blueLight.position.set(-10, 0, -10);
      scene.add(blueLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(0, 20, 10);
      scene.add(directionalLight);

      // 4. DNA GEOMETRY SPECIFICATION
      const isMobile = window.innerWidth < 768;
      const TURNS = 4;
      const POINTS = isMobile ? 100 : 200;
      const RADIUS = isMobile ? 2.5 : 4;
      const HEIGHT = 30;
      const RUNG_INTERVAL = isMobile ? 12 : 8;

      const dnaGroup = new THREE.Group();
      if (isMobile) {
        dnaGroup.scale.set(0.7, 0.7, 0.7);
        dnaGroup.position.x = 2; // Slipped slightly right
      }
      scene.add(dnaGroup);

      // Generate curve paths
      const p1Array: THREE.Vector3[] = [];
      const p2Array: THREE.Vector3[] = [];

      for (let i = 0; i <= POINTS; i++) {
        const t = (i / POINTS) * Math.PI * 2 * TURNS;
        const y = (i / POINTS) * HEIGHT - HEIGHT / 2;

        p1Array.push(new THREE.Vector3(Math.cos(t) * RADIUS, y, Math.sin(t) * RADIUS));
        p2Array.push(new THREE.Vector3(Math.cos(t + Math.PI) * RADIUS, y, Math.sin(t + Math.PI) * RADIUS));
      }

      const curve1 = new THREE.CatmullRomCurve3(p1Array);
      const curve2 = new THREE.CatmullRomCurve3(p2Array);

      // Materials definitions
      const strand1Mat = registerMaterial(
        new THREE.MeshStandardMaterial({
          color: 0xC84B0E, // Strand 1 Orange
          roughness: 0.15,
          metalness: 0.85
        })
      );

      const strand2Mat = registerMaterial(
        new THREE.MeshStandardMaterial({
          color: 0xffffff, // Strand 2 White
          transparent: true,
          opacity: 0.6,
          roughness: 0.2,
          metalness: 0.8
        })
      );

      const rungMat = registerMaterial(
        new THREE.MeshStandardMaterial({
          color: 0xF5A623, // Rung pair gold
          roughness: 0.2,
          metalness: 0.95
        })
      );

      const sphereOrangeMat = registerMaterial(
        new THREE.MeshStandardMaterial({
          color: 0xC84B0E,
          emissive: 0xC84B0E,
          emissiveIntensity: 1.5,
          roughness: 0.1
        })
      );

      const sphereWhiteMat = registerMaterial(
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xffffff,
          emissiveIntensity: 1.2,
          transparent: true,
          opacity: 0.7,
          roughness: 0.1
        })
      );

      // Create Tube Geometry for strands
      const tubeGeo1 = registerGeometry(new THREE.TubeGeometry(curve1, POINTS, 0.15, 8, false));
      const tubeGeo2 = registerGeometry(new THREE.TubeGeometry(curve2, POINTS, 0.15, 8, false));

      const strand1Mesh = new THREE.Mesh(tubeGeo1, strand1Mat);
      const strand2Mesh = new THREE.Mesh(tubeGeo2, strand2Mat);

      dnaGroup.add(strand1Mesh);
      dnaGroup.add(strand2Mesh);

      // Base pair rungs & sphere junctions
      const sphereGeo = registerGeometry(new THREE.SphereGeometry(0.25, 12, 12));

      for (let i = 0; i <= POINTS; i += RUNG_INTERVAL) {
        const pt1 = p1Array[i];
        const pt2 = p2Array[i];

        // 1. Connection Rung Cylinder
        const distance = pt1.distanceTo(pt2);
        const cylinderGeo = registerGeometry(new THREE.CylinderGeometry(0.08, 0.08, distance, 8));
        const cylinderMesh = new THREE.Mesh(cylinderGeo, rungMat);

        // Position cylinder at midpoint
        const midpoint = new THREE.Vector3().addVectors(pt1, pt2).multiplyScalar(0.5);
        cylinderMesh.position.copy(midpoint);

        // Orient cylinder between the two points
        const direction = new THREE.Vector3().subVectors(pt2, pt1).normalize();
        const alignAxis = new THREE.Vector3(0, 1, 0); // cylinder Y default
        const quaternion = new THREE.Quaternion().setFromUnitVectors(alignAxis, direction);
        cylinderMesh.quaternion.copy(quaternion);

        dnaGroup.add(cylinderMesh);

        // 2. Glowing Spheres at Strand 1 Junction
        const sphere1 = new THREE.Mesh(sphereGeo, sphereOrangeMat);
        sphere1.position.copy(pt1);
        dnaGroup.add(sphere1);

        // 3. Glowing Spheres at Strand 2 Junction
        const sphere2 = new THREE.Mesh(sphereGeo, sphereWhiteMat);
        sphere2.position.copy(pt2);
        dnaGroup.add(sphere2);
      }

      // 5. INTERACTION LOGIC
      
      // Mouse tracking
      handleMouseMove = (e: MouseEvent) => {
        mouseRef.current.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseRef.current.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
      };
      window.addEventListener('mousemove', handleMouseMove);

      // Resize
      handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer?.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);

      // Click Burst
      const sparks: { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number }[] = [];
      const sparkGeo = registerGeometry(new THREE.SphereGeometry(0.04, 6, 6));

      handleContainerClick = (e: MouseEvent) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 25;
        const y = -(e.clientY / window.innerHeight - 0.5) * 16;

        for (let idx = 0; idx < 15; idx++) {
          const sparkMat = registerMaterial(
            new THREE.MeshBasicMaterial({
              color: idx % 2 === 0 ? 0xC84B0E : 0xF5A623,
              transparent: true,
              opacity: 1.0,
              blending: THREE.AdditiveBlending
            })
          );
          const spark = new THREE.Mesh(sparkGeo, sparkMat);
          spark.position.set(x + (Math.random() - 0.5) * 0.3, y + (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 2);
          scene.add(spark);

          const angle = Math.random() * Math.PI * 2;
          const speed = 0.04 + Math.random() * 0.06;
          const velocity = new THREE.Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed, (Math.random() - 0.5) * 0.03);

          sparks.push({ mesh: spark, velocity, life: 1.0 });
        }
      };
      containerElement.addEventListener('click', handleContainerClick);

      // 6. ANIMATE RENDER LOOP
      const startTime = Date.now();
      const getElapsed = () => (Date.now() - startTime) / 1000;

      const animate = () => {
        animFrameId = requestAnimationFrame(animate);

        // Pause loop when page is hidden
        if (!isTabVisible) return;

        const elapsedTime = getElapsed();
        const progress = scrollProgressRef.current; // Lenis scroll progress 0 to 1

        // Smooth Lerp Mouse movements
        const mouse = mouseRef.current;
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;

        // Apply mouse-parallax + Float y + rise on scroll
        dnaGroup.rotation.x = mouse.y * 0.15;
        
        // Helix slow y-axis rotation (speed increases as scroll progress advances)
        const scrollRotationSpeedMultiplier = 1.0 + progress * 2.5;
        dnaGroup.rotation.y = elapsedTime * 0.3 * scrollRotationSpeedMultiplier;
        
        // Floating wave drift + rises up 20px on scroll
        const floatWave = Math.sin(elapsedTime * 0.5) * 0.5;
        dnaGroup.position.y = floatWave + progress * 20;
        
        // Mouse horizontal shifting
        dnaGroup.position.x = isMobile ? 2 + mouse.x * 1.2 : mouse.x * 3.5;

        // Group opacity fades out dynamically on scroll up to 80%
        const opacityVal = 1 - progress * 0.8;
        dnaGroup.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            const mat = child.material;
            if (mat instanceof THREE.Material) {
              mat.transparent = true;
              mat.opacity = (child === strand1Mesh ? 1.0 : 0.6) * opacityVal;
            }
          }
        });

        // Orbits orange pointlight around scene
        orangeLight.position.x = Math.cos(elapsedTime * 0.7) * 15;
        orangeLight.position.z = Math.sin(elapsedTime * 0.7) * 15;

        // Update click sparks
        for (let sIdx = sparks.length - 1; sIdx >= 0; sIdx--) {
          const s = sparks[sIdx];
          s.mesh.position.add(s.velocity);
          s.velocity.multiplyScalar(0.96);
          s.life -= 0.02;
          if (s.mesh.material instanceof THREE.MeshBasicMaterial) {
            s.mesh.material.opacity = s.life;
          }
          if (s.life <= 0) {
            scene.remove(s.mesh);
            s.mesh.geometry.dispose();
            if (s.mesh.material instanceof THREE.Material) {
              s.mesh.material.dispose();
            }
            sparks.splice(sIdx, 1);
          }
        }

        renderer?.render(scene, camera);
      };

      animate();

    } catch (err) {
      console.warn("⚠️ Three.js DNA Hero failed to initialize:", err);
    }

    // 7. COMPONENT UNMOUNT CLEANUP
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
      }
      if (handleMouseMove) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      if (handleResize) {
        window.removeEventListener('resize', handleResize);
      }
      if (handleContainerClick) {
        containerElement.removeEventListener('click', handleContainerClick);
      }
      if (containerElement && renderer?.domElement && containerElement.contains(renderer.domElement)) {
        containerElement.removeChild(renderer.domElement);
      }

      // Dispose all Three.js allocations strictly (avoid memory leaks)
      geometriesToDispose.forEach(geo => geo.dispose());
      materialsToDispose.forEach(mat => mat.dispose());
      renderer?.dispose();
    };
  }, []);

  return (
    <section className="relative w-full h-screen flex items-center justify-center overflow-hidden z-10">
      
      {/* Layer 1: College Photo or Video Base background */}
      {bannerUrl && isVideoUrl(bannerUrl) ? (
        <video
          src={bannerUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none select-none"
        />
      ) : (
        <div 
          className="absolute inset-0 bg-cover bg-center z-0 pointer-events-none select-none"
          style={{
            backgroundImage: bannerUrl 
              ? `url(${bannerUrl})` 
              : `url('https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2086&auto=format&fit=crop')`
          }}
        />
      )}

      {/* Layer 2: Dark Navy Overlay opacity 0.6 */}
      <div className="absolute inset-0 bg-[#0D1B3E] opacity-60 z-0 pointer-events-none" />

      {/* Layer 3: DNA Helix Three.js Transparent canvas z-index 1 */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full z-[1] pointer-events-auto cursor-pointer" />

      {/* Grid overlay for subtle pharmaceutical tech vibe */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20 pointer-events-none z-[1]" />

      {/* Layer 4: Foreground Hero contents z-index 10 */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center select-none">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.15,
                delayChildren: 0.1,
              },
            },
          }}
          className="flex flex-col items-center justify-center"
        >
          {/* Badge */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 40 },
              visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 15, delay: 0.3 } }
            }}
            className="mb-6 flex items-center space-x-2 bg-orange-burnt/10 border border-orange-burnt/30 px-5 py-2 rounded-full backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-orange-burnt animate-pulse" />
            <span className="text-orange-burnt text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase font-display">
              Tulsiramji Gaikwad Patil College of Pharmacy
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 40 },
              visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 15, delay: 0.5 } }
            }}
            className="text-4xl sm:text-6xl md:text-8xl font-black font-display uppercase tracking-tight text-white leading-[1.08] mb-6 drop-shadow-2xl"
          >
            TGPCOP <br className="sm:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-burnt via-gold-accent to-orange-burnt bg-[size:200%_auto] animate-[shimmer_4s_linear_infinite]">
              Student Council
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 40 },
              visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 15, delay: 0.8 } }
            }}
            className="text-white/95 text-base sm:text-2xl font-medium max-w-2xl mx-auto mb-10 tracking-wide font-sans leading-relaxed drop-shadow-md"
          >
            Your Voice. Our Future. <br className="sm:hidden" />
            <span className="hidden sm:inline"> | </span>
            <span className="text-gold-accent font-semibold">Together Towards Excellence</span>
          </motion.p>

          {/* Call to Actions (CTA) */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 40 },
              visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 15, delay: 1.0 } }
            }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full max-w-md mx-auto"
          >
            <Link
              to="/ask"
              className="group flex items-center justify-center space-x-2 w-full sm:w-auto px-8 py-4 bg-orange-burnt hover:bg-orange-burnt/90 text-white font-display text-xs sm:text-sm font-bold uppercase tracking-widest rounded-xl shadow-lg hover:shadow-orange-burnt/25 hover:scale-[1.04] active:scale-[0.97] transition-all duration-300"
            >
              <span>Ask a Question</span>
              <HelpCircle className="w-4.5 h-4.5 group-hover:scale-110 transition-transform text-white/90" />
            </Link>
            
            <Link
              to="/notices"
              className="group flex items-center justify-center space-x-2 w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/18 border border-white/20 hover:border-white/35 text-white font-display text-xs sm:text-sm font-bold uppercase tracking-widest rounded-xl shadow-lg backdrop-blur-md hover:scale-[1.04] active:scale-[0.97] transition-all duration-300"
            >
              <span>Notice Board</span>
              <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform text-orange-burnt" />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Bouncing animated scroll mouse indicator bottom center */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 hidden sm:block">
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="w-6.5 h-10.5 border-2 border-white/35 rounded-full flex justify-center p-1.5 backdrop-blur-sm shadow-inner"
        >
          <div className="w-1.5 h-3 bg-orange-burnt rounded-full animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
};

export default DNAHero;
