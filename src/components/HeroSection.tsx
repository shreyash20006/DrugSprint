import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { ArrowRight, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const HeroSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const [bannerUrl, setBannerUrl] = useState<string>('');

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

  useEffect(() => {
    if (!containerRef.current) return;

    // SCENE SETUP
    const scene = new THREE.Scene();
    
    // CAMERA SETUP
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.z = 8;

    // RENDERER SETUP
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // LIGHTS
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xc84b0e, 0.5); // Warm orange glow light
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // PALETTE
    const colors = [
      new THREE.Color('#0D1B3E'), // Deep Navy
      new THREE.Color('#C84B0E'), // Burnt Orange
      new THREE.Color('#F5A623'), // Gold Accent
    ];

    // FLOATABLE PARTICLE CLASS
    const particlesArray: {
      mesh: THREE.Group | THREE.Mesh;
      speedX: number;
      speedY: number;
      rotSpeedX: number;
      rotSpeedY: number;
      rotSpeedZ: number;
      baseY: number;
      floatOffset: number;
    }[] = [];

    // Create 3D geometries
    const capsuleGeo = new THREE.CapsuleGeometry(0.12, 0.35, 8, 16);
    const hexagonGeo = new THREE.TorusGeometry(0.25, 0.05, 8, 6); // 6-sided Torus = Chemistry Hexagon
    const sphereGeo = new THREE.SphereGeometry(0.08, 16, 16);

    const createMortarMesh = (color: THREE.Color) => {
      const mortarGroup = new THREE.Group();
      
      // Bowl (hollow cone/cylinder)
      const bowlMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.2,
        metalness: 0.8,
        side: THREE.DoubleSide
      });
      const bowlGeo = new THREE.CylinderGeometry(0.25, 0.15, 0.2, 16, 1, true);
      const bowl = new THREE.Mesh(bowlGeo, bowlMat);
      mortarGroup.add(bowl);

      // Bowl base
      const baseGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.03, 16);
      const base = new THREE.Mesh(baseGeo, bowlMat);
      base.position.y = -0.1;
      mortarGroup.add(base);

      // Pestle (diagonal rod)
      const pestleMat = new THREE.MeshStandardMaterial({
        color: 0xf5a623,
        roughness: 0.1,
        metalness: 0.9
      });
      const pestleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8);
      const pestle = new THREE.Mesh(pestleGeo, pestleMat);
      pestle.position.set(0.08, 0.05, 0);
      pestle.rotation.z = -Math.PI / 4;
      mortarGroup.add(pestle);

      return mortarGroup;
    };

    const particleCount = 45;

    for (let i = 0; i < particleCount; i++) {
      let particleMesh: THREE.Group | THREE.Mesh;
      const color = colors[i % colors.length];
      const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.15,
        metalness: 0.75,
      });

      // Stagger geometries
      const geoType = i % 4;
      if (geoType === 0) {
        particleMesh = new THREE.Mesh(capsuleGeo, material);
      } else if (geoType === 1) {
        particleMesh = new THREE.Mesh(hexagonGeo, material);
      } else if (geoType === 2) {
        particleMesh = new THREE.Mesh(sphereGeo, material);
      } else {
        particleMesh = createMortarMesh(color);
      }

      // Random position
      particleMesh.position.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6
      );

      // Random scales
      const scale = 0.5 + Math.random() * 0.8;
      particleMesh.scale.set(scale, scale, scale);

      scene.add(particleMesh);

      particlesArray.push({
        mesh: particleMesh,
        speedX: (Math.random() - 0.5) * 0.005,
        speedY: (Math.random() - 0.5) * 0.005,
        rotSpeedX: (Math.random() - 0.5) * 0.015,
        rotSpeedY: (Math.random() - 0.5) * 0.015,
        rotSpeedZ: (Math.random() - 0.5) * 0.015,
        baseY: particleMesh.position.y,
        floatOffset: Math.random() * Math.PI * 2,
      });
    }

    // MOUSE PARALLAX HANDLER
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.targetX = (event.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.targetY = -(event.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // RESIZE HANDLER
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // ANIMATION LOOP
    const clock = new THREE.Clock();

    const animate = () => {
      requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Slow drift & rotation of 3D objects
      particlesArray.forEach((p) => {
        p.mesh.rotation.x += p.rotSpeedX;
        p.mesh.rotation.y += p.rotSpeedY;
        p.mesh.rotation.z += p.rotSpeedZ;

        // Floating hover motion
        p.mesh.position.y = p.baseY + Math.sin(elapsedTime * 0.5 + p.floatOffset) * 0.25;
        p.mesh.position.x += p.speedX;

        // Boundary looping
        if (p.mesh.position.x > 9) p.mesh.position.x = -9;
        if (p.mesh.position.x < -9) p.mesh.position.x = 9;
      });

      // Lerp mouse coordinate for smooth parallax camera shifting
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      camera.position.x = mouseRef.current.x * 1.5;
      camera.position.y = mouseRef.current.y * 1.5;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    // CLEANUP
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      scene.clear();
      capsuleGeo.dispose();
      hexagonGeo.dispose();
      sphereGeo.dispose();
      renderer.dispose();
    };
  }, []);

  // Framer Motion Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 100, damping: 15 },
    },
  };

  return (
    <section
      style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      className="relative w-full h-screen flex items-center justify-center bg-gradient-to-br from-navy-dark via-[#11234F] to-[#0A1430] overflow-hidden z-10"
    >
      {/* Dark overlay for dynamic banner image tint & premium readability */}
      {bannerUrl && (
        <div className="absolute inset-0 bg-[#0B1531]/75 mix-blend-multiply z-0 pointer-events-none" />
      )}

      {/* Three.js canvas background container */}
      <div ref={containerRef} className="absolute inset-0 z-0 opacity-45 pointer-events-none" />

      {/* Grid overlay for techy visual structure */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(13,27,62,0.6)_80%)] z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] opacity-25 z-0 pointer-events-none" />

      {/* Foreground Hero Contents */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center justify-center"
        >
          {/* Logo container tag */}
          <motion.div
            variants={itemVariants}
            className="mb-6 flex items-center space-x-2 bg-orange-burnt/10 border border-orange-burnt/30 px-4 py-1.5 rounded-full backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-orange-burnt animate-pulse" />
            <span className="text-orange-burnt text-xs font-semibold tracking-widest uppercase font-display">
              Tulsiramji Gaikwad Patil College of Pharmacy
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white font-display leading-[1.1] mb-6 drop-shadow-xl"
          >
            TGPCOP <br className="sm:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-burnt to-gold-accent">
              Student Council
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-2xl text-white/90 font-medium max-w-2xl mx-auto mb-10 tracking-wide font-sans drop-shadow-md"
          >
            Your Voice. Our Future. <br className="sm:hidden" />
            <span className="hidden sm:inline"> | </span>
            <span className="text-gold-accent font-semibold">Together Towards Excellence</span>
          </motion.p>

          {/* Call to Actions (CTA) */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full max-w-md mx-auto"
          >
            <Link
              to="/ask"
              className="group flex items-center justify-center space-x-2 w-full sm:w-auto px-8 py-4 bg-orange-burnt hover:bg-orange-burnt/90 text-white font-display font-semibold rounded-lg shadow-lg hover:shadow-orange-burnt/25 hover:translate-y-[-2px] transition-all duration-300"
            >
              <span>Ask a Question</span>
              <HelpCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </Link>
            <Link
              to="/notices"
              className="group flex items-center justify-center space-x-2 w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white font-display font-semibold rounded-lg shadow-lg backdrop-blur-sm hover:translate-y-[-2px] transition-all duration-300"
            >
              <span>Notice Board</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Floating anchor to scroll down */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 hidden sm:block">
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-1.5 backdrop-blur-sm"
        >
          <div className="w-1.5 h-3 bg-orange-burnt rounded-full" />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
