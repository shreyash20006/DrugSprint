import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  AmbientLight,
  PointLight,
  DirectionalLight,
  Group,
  CatmullRomCurve3,
  Vector3,
  MeshLambertMaterial,
  MeshBasicMaterial,
  TubeGeometry,
  SphereGeometry,
  CylinderGeometry,
  Mesh,
  InstancedMesh,
  Object3D,
  Quaternion,
  AdditiveBlending,
  Material
} from 'three';
import { ArrowRight, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isMobile } from '../lib/device';


export const DNAHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const scrollProgressRef = useRef(0);
  const [bannerUrl, setBannerUrl] = useState<string>('');
  const [mobileMode, setMobileMode] = useState(false);

  // Fetch dynamic banner settings & evaluate mobile mode
  useEffect(() => {
    setMobileMode(isMobile());

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

  // Listen to viewport scroll progress (Desktop only)
  useEffect(() => {
    if (mobileMode) return;

    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      scrollProgressRef.current = progress;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMode]);

  // Initialize Three.js 3D DNA Helix (Desktop/Tablet only)
  useEffect(() => {
    if (mobileMode || !containerRef.current) return;

    const containerElement = containerRef.current;
    let renderer: WebGLRenderer | null = null;
    let animFrameId: number = 0;

    let isTabVisible = true;
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const geometriesToDispose: any[] = [];
    const materialsToDispose: Material[] = [];

    const registerGeometry = (geo: any) => {
      geometriesToDispose.push(geo);
      return geo;
    };
    const registerMaterial = (mat: Material) => {
      materialsToDispose.push(mat);
      return mat;
    };

    let handleContainerClick: ((e: MouseEvent) => void) | null = null;
    let handleMouseMove: ((e: MouseEvent) => void) | null = null;
    let handleResize: (() => void) | null = null;

    try {
      const scene = new Scene();
      const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 0, 30);

      renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      containerElement.appendChild(renderer.domElement);

      const ambientLight = new AmbientLight(0xffffff, 0.35);
      scene.add(ambientLight);

      const orangeLight = new PointLight(0xC84B0E, 2.5, 50);
      orangeLight.position.set(10, 0, 10);
      scene.add(orangeLight);

      const blueLight = new PointLight(0x3B82F6, 1.2, 50);
      blueLight.position.set(-10, 0, -10);
      scene.add(blueLight);

      const directionalLight = new DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(0, 20, 10);
      scene.add(directionalLight);

      // Low segment geometries for high refresh rates (120fps)
      const POINTS = 100;
      const TURNS = 4;
      const RADIUS = 4;
      const HEIGHT = 30;
      const RUNG_INTERVAL = 8;

      const dnaGroup = new Group();
      scene.add(dnaGroup);

      const p1Array: Vector3[] = [];
      const p2Array: Vector3[] = [];

      for (let i = 0; i <= POINTS; i++) {
        const t = (i / POINTS) * Math.PI * 2 * TURNS;
        const y = (i / POINTS) * HEIGHT - HEIGHT / 2;
        p1Array.push(new Vector3(Math.cos(t) * RADIUS, y, Math.sin(t) * RADIUS));
        p2Array.push(new Vector3(Math.cos(t + Math.PI) * RADIUS, y, Math.sin(t + Math.PI) * RADIUS));
      }

      const curve1 = new CatmullRomCurve3(p1Array);
      const curve2 = new CatmullRomCurve3(p2Array);

      // Efficient MeshLambertMaterials (faster than standard/phong shaders)
      const strand1Mat = registerMaterial(
        new MeshLambertMaterial({
          color: 0xC84B0E,
          emissive: 0xC84B0E,
          emissiveIntensity: 0.15
        })
      );

      const strand2Mat = registerMaterial(
        new MeshLambertMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.6,
          emissive: 0xffffff,
          emissiveIntensity: 0.1
        })
      );

      const rungMat = registerMaterial(
        new MeshLambertMaterial({
          color: 0xF5A623,
          emissive: 0xF5A623,
          emissiveIntensity: 0.1
        })
      );

      const sphereOrangeMat = registerMaterial(
        new MeshLambertMaterial({
          color: 0xC84B0E,
          emissive: 0xC84B0E,
          emissiveIntensity: 1.5
        })
      );

      const sphereWhiteMat = registerMaterial(
        new MeshLambertMaterial({
          color: 0xffffff,
          emissive: 0xffffff,
          emissiveIntensity: 1.2,
          transparent: true,
          opacity: 0.7
        })
      );

      // Low segment tubular strands
      const tubeGeo1 = registerGeometry(new TubeGeometry(curve1, 80, 0.12, 6, false));
      const tubeGeo2 = registerGeometry(new TubeGeometry(curve2, 80, 0.12, 6, false));

      const strand1Mesh = new Mesh(tubeGeo1, strand1Mat);
      const strand2Mesh = new Mesh(tubeGeo2, strand2Mat);

      dnaGroup.add(strand1Mesh);
      dnaGroup.add(strand2Mesh);

      // Optimized Connection Rungs cylinder (6 sides instead of 32)
      const cylinderGeo = registerGeometry(new CylinderGeometry(0.08, 0.08, RADIUS * 2, 6));
      const sphereGeo = registerGeometry(new SphereGeometry(0.25, 8, 8)); // 8 segments instead of 16

      const totalRungs = Math.floor(POINTS / RUNG_INTERVAL) + 1;

      // INSTANCED MESH BATCH RENDERING (Aggregates draw calls down to 3)
      const instancedRungs = new InstancedMesh(cylinderGeo, rungMat, totalRungs);
      const instancedOrangeSpheres = new InstancedMesh(sphereGeo, sphereOrangeMat, totalRungs);
      const instancedWhiteSpheres = new InstancedMesh(sphereGeo, sphereWhiteMat, totalRungs);

      const dummy = new Object3D();
      let index = 0;

      for (let i = 0; i <= POINTS; i += RUNG_INTERVAL) {
        const pt1 = p1Array[i];
        const pt2 = p2Array[i];

        // 1. Connection Rung position & rotation
        const midpoint = new Vector3().addVectors(pt1, pt2).multiplyScalar(0.5);
        const direction = new Vector3().subVectors(pt2, pt1).normalize();
        const alignAxis = new Vector3(0, 1, 0);
        const quaternion = new Quaternion().setFromUnitVectors(alignAxis, direction);

        dummy.position.copy(midpoint);
        dummy.quaternion.copy(quaternion);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        instancedRungs.setMatrixAt(index, dummy.matrix);

        // 2. Orange Junction Sphere
        dummy.position.copy(pt1);
        dummy.quaternion.set(0, 0, 0, 1);
        dummy.updateMatrix();
        instancedOrangeSpheres.setMatrixAt(index, dummy.matrix);

        // 3. White Junction Sphere
        dummy.position.copy(pt2);
        dummy.updateMatrix();
        instancedWhiteSpheres.setMatrixAt(index, dummy.matrix);

        index++;
      }

      dnaGroup.add(instancedRungs);
      dnaGroup.add(instancedOrangeSpheres);
      dnaGroup.add(instancedWhiteSpheres);

      // Parallax interaction mouse listeners
      handleMouseMove = (e: MouseEvent) => {
        mouseRef.current.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseRef.current.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
      };
      window.addEventListener('mousemove', handleMouseMove, { passive: true });

      handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer?.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);

      // Light-weight basic spark system
      const sparks: { mesh: Mesh; velocity: Vector3; life: number }[] = [];
      const sparkGeo = registerGeometry(new SphereGeometry(0.04, 4, 4));

      handleContainerClick = (e: MouseEvent) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 25;
        const y = -(e.clientY / window.innerHeight - 0.5) * 16;

        for (let idx = 0; idx < 10; idx++) {
          const sparkMat = registerMaterial(
            new MeshBasicMaterial({
              color: idx % 2 === 0 ? 0xC84B0E : 0xF5A623,
              transparent: true,
              opacity: 1.0,
              blending: AdditiveBlending
            })
          );
          const spark = new Mesh(sparkGeo, sparkMat);
          spark.position.set(x + (Math.random() - 0.5) * 0.3, y + (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 2);
          scene.add(spark);

          const angle = Math.random() * Math.PI * 2;
          const speed = 0.04 + Math.random() * 0.06;
          const velocity = new Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed, (Math.random() - 0.5) * 0.03);

          sparks.push({ mesh: spark, velocity, life: 1.0 });
        }
      };
      containerElement.addEventListener('click', handleContainerClick, { passive: true });

      const startTime = Date.now();
      const getElapsed = () => (Date.now() - startTime) / 1000;

      const animate = () => {
        animFrameId = requestAnimationFrame(animate);

        if (!isTabVisible) return;

        const elapsedTime = getElapsed();
        const progress = scrollProgressRef.current;

        const mouse = mouseRef.current;
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;

        dnaGroup.rotation.x = mouse.y * 0.15;
        const scrollRotationSpeedMultiplier = 1.0 + progress * 2.5;
        dnaGroup.rotation.y = elapsedTime * 0.3 * scrollRotationSpeedMultiplier;
        
        const floatWave = Math.sin(elapsedTime * 0.5) * 0.5;
        dnaGroup.position.y = floatWave + progress * 20;
        dnaGroup.position.x = mouse.x * 3.5;

        const opacityVal = 1 - progress * 0.8;
        dnaGroup.children.forEach(child => {
          if (child instanceof Mesh || child instanceof InstancedMesh) {
            const mat = child.material;
            if (mat instanceof Material) {
              mat.transparent = true;
              mat.opacity = (child === strand1Mesh || child === instancedOrangeSpheres ? 1.0 : 0.65) * opacityVal;
            }
          }
        });

        orangeLight.position.x = Math.cos(elapsedTime * 0.7) * 15;
        orangeLight.position.z = Math.sin(elapsedTime * 0.7) * 15;

        for (let sIdx = sparks.length - 1; sIdx >= 0; sIdx--) {
          const s = sparks[sIdx];
          s.mesh.position.add(s.velocity);
          s.velocity.multiplyScalar(0.96);
          s.life -= 0.03;
          if (s.mesh.material instanceof MeshBasicMaterial) {
            s.mesh.material.opacity = s.life;
          }
          if (s.life <= 0) {
            scene.remove(s.mesh);
            s.mesh.geometry.dispose();
            if (s.mesh.material instanceof Material) {
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

      geometriesToDispose.forEach(geo => geo.dispose());
      materialsToDispose.forEach(mat => mat.dispose());
      renderer?.dispose();
    };
  }, [mobileMode]);

  // Mobile bypass rendering
  if (mobileMode) {
    return (
      <section className="relative w-full h-screen flex items-center justify-center overflow-hidden z-10">
        <div 
          className="absolute inset-0 bg-cover bg-center select-none"
          style={{
            backgroundImage: bannerUrl 
              ? `url(${bannerUrl})` 
              : `url('https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2086&auto=format&fit=crop')`
          }}
        />
        <div className="absolute inset-0 bg-[#0D1B3E] opacity-70 z-0 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D1B3E] via-[#1a2a5e] to-[#0D1B3E] opacity-85 z-0 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center select-none pt-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center"
          >
            <div className="mb-6 flex items-center space-x-2 bg-orange-burnt/10 border border-orange-burnt/30 px-5 py-2 rounded-full">
              <span className="w-2 h-2 rounded-full bg-orange-burnt animate-pulse" />
              <span className="text-orange-burnt text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase font-display">
                Tulsiramji Gaikwad Patil College of Pharmacy
              </span>
            </div>

            <h1 className="text-4xl font-black font-display uppercase tracking-tight text-white leading-tight mb-6">
              TGPCOP <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-burnt via-gold-accent to-orange-burnt bg-[size:200%_auto]">
                Student Council
              </span>
            </h1>

            <p className="text-white/95 text-base font-medium max-w-sm mx-auto mb-10 tracking-wide font-sans leading-relaxed">
              Your Voice. Our Future. <br />
              <span className="text-gold-accent font-semibold text-sm">Together Towards Excellence</span>
            </p>

            <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
              <Link
                to="/ask"
                className="flex items-center justify-center space-x-2 w-full px-6 py-3.5 bg-orange-burnt text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg border border-white/5"
              >
                <span>Ask a Question</span>
                <HelpCircle className="w-4.5 h-4.5 text-white/90" />
              </Link>
              
              <Link
                to="/notices"
                className="flex items-center justify-center space-x-2 w-full px-6 py-3.5 bg-white/10 border border-white/20 text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg"
              >
                <span>Notice Board</span>
                <ArrowRight className="w-4.5 h-4.5 text-orange-burnt" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  // Desktop/Tablet rendering with WebGL overlay
  return (
    <section className="relative w-full h-screen flex items-center justify-center overflow-hidden z-10">
      
      {/* College Photo Base background */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 pointer-events-none select-none"
        style={{
          backgroundImage: bannerUrl 
            ? `url(${bannerUrl})` 
            : `url('https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2086&auto=format&fit=crop')`
        }}
      />

      <div className="absolute inset-0 bg-[#0D1B3E] opacity-60 z-0 pointer-events-none" />

      {/* DNA Helix Three.js Transparent canvas container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full z-[1] pointer-events-auto cursor-pointer dna-canvas" />

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20 pointer-events-none z-[1]" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center select-none">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.12,
                delayChildren: 0.1,
              },
            },
          }}
          className="flex flex-col items-center justify-center"
        >
          {/* Badge */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 35 },
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
              hidden: { opacity: 0, y: 35 },
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
              hidden: { opacity: 0, y: 35 },
              visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 15, delay: 0.7 } }
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
              hidden: { opacity: 0, y: 35 },
              visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 15, delay: 0.9 } }
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
