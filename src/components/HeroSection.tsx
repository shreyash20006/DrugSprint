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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xc84b0e, 0.8); // Warm orange glow light
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // Dynamic Starfield (Deep Cosmic Parallax Space)
    const starsGeo = new THREE.BufferGeometry();
    const starsCount = 1200;
    const starsPositions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i++) {
      starsPositions[i] = (Math.random() - 0.5) * 24;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0xf5a623,
      size: 0.04,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    const starField = new THREE.Points(starsGeo, starsMat);
    scene.add(starField);

    // FLOATABLE PARTICLE SYSTEM
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

    // Create 3D geometries representing pharmacy & structures
    const capsuleGeo = new THREE.CapsuleGeometry(0.12, 0.35, 8, 16);
    const hexagonGeo = new THREE.TorusGeometry(0.25, 0.05, 8, 6); // Chemistry Hexagon Torus
    const sphereGeo = new THREE.SphereGeometry(0.08, 16, 16);

    const createMortarMesh = () => {
      const mortarGroup = new THREE.Group();
      
      // Bowl
      const bowlMat = new THREE.MeshStandardMaterial({
        color: 0xc84b0e,
        roughness: 0.15,
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

      // Pestle
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
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(),
        roughness: 0.15,
        metalness: 0.8,
      });

      const geoType = i % 4;
      if (geoType === 0) {
        particleMesh = new THREE.Mesh(capsuleGeo, material);
      } else if (geoType === 1) {
        particleMesh = new THREE.Mesh(hexagonGeo, material);
      } else if (geoType === 2) {
        particleMesh = new THREE.Mesh(sphereGeo, material);
      } else {
        particleMesh = createMortarMesh();
      }

      // Random position
      particleMesh.position.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6
      );

      // Random scale
      const scale = 0.5 + Math.random() * 0.8;
      particleMesh.scale.set(scale, scale, scale);

      scene.add(particleMesh);

      particlesArray.push({
        mesh: particleMesh,
        speedX: (Math.random() - 0.5) * 0.006,
        speedY: (Math.random() - 0.5) * 0.006,
        rotSpeedX: (Math.random() - 0.5) * 0.015,
        rotSpeedY: (Math.random() - 0.5) * 0.015,
        rotSpeedZ: (Math.random() - 0.5) * 0.015,
        baseY: particleMesh.position.y,
        floatOffset: Math.random() * Math.PI * 2,
      });
    }

    // Dynamic Connections (Chemistry Neural Network Lattice)
    const maxLines = 80;
    const linePositions = new Float32Array(maxLines * 2 * 3);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xc84b0e,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending
    });
    const lineMesh = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lineMesh);

    // Interactive Click Sparks Array (Cosmic burst)
    const sparksArray: {
      mesh: THREE.Mesh;
      velocity: THREE.Vector3;
      life: number;
    }[] = [];
    const sparkGeo = new THREE.SphereGeometry(0.04, 8, 8);

    const handleContainerClick = (event: MouseEvent) => {
      // Project the click relative to screen coordinates
      const x = (event.clientX / window.innerWidth - 0.5) * 12;
      const y = -(event.clientY / window.innerHeight - 0.5) * 8;
      
      const burstColors = [0xf5a623, 0xc84b0e, 0x00f2fe, 0xffffff];
      
      for (let i = 0; i < 25; i++) {
        const sparkMat = new THREE.MeshBasicMaterial({
          color: burstColors[i % burstColors.length],
          transparent: true,
          opacity: 1.0,
          blending: THREE.AdditiveBlending
        });
        const spark = new THREE.Mesh(sparkGeo, sparkMat);
        spark.position.set(
          x + (Math.random() - 0.5) * 0.2,
          y + (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 2
        );
        scene.add(spark);

        const angle = Math.random() * Math.PI * 2;
        const speed = 0.04 + Math.random() * 0.07;
        const velocity = new THREE.Vector3(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          (Math.random() - 0.5) * 0.05
        );

        sparksArray.push({
          mesh: spark,
          velocity,
          life: 1.0
        });
      }
    };
    
    // Add event listener directly to the container
    const containerElement = containerRef.current;
    containerElement.addEventListener('click', handleContainerClick);

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

      // Dynamic Color Shifting HSL
      const pulseColor = new THREE.Color();
      const hue = (elapsedTime * 0.04) % 1.0;
      pulseColor.setHSL(hue, 0.9, 0.5);
      lineMat.color.copy(pulseColor);

      // Slow drift & rotation of 3D objects
      particlesArray.forEach((p, idx) => {
        p.mesh.rotation.x += p.rotSpeedX;
        p.mesh.rotation.y += p.rotSpeedY;
        p.mesh.rotation.z += p.rotSpeedZ;

        // Floating hover motion
        p.mesh.position.y = p.baseY + Math.sin(elapsedTime * 0.5 + p.floatOffset) * 0.25;
        p.mesh.position.x += p.speedX;

        // Boundary looping
        if (p.mesh.position.x > 9) p.mesh.position.x = -9;
        if (p.mesh.position.x < -9) p.mesh.position.x = 9;

        // Multi-color organic shift
        if (p.mesh instanceof THREE.Mesh && p.mesh.material instanceof THREE.MeshStandardMaterial) {
          const meshHue = (hue + idx / particlesArray.length * 0.2) % 1.0;
          p.mesh.material.color.setHSL(meshHue, 0.9, 0.55);
        } else if (p.mesh instanceof THREE.Group) {
          p.mesh.children.forEach((child, cIdx) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
              const meshHue = (hue + cIdx * 0.25) % 1.0;
              child.material.color.setHSL(meshHue, 0.9, 0.55);
            }
          });
        }
      });

      // Update Chemistry connection lattice
      let lineCount = 0;
      const posArray = lineGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particlesArray.length; i++) {
        for (let j = i + 1; j < particlesArray.length; j++) {
          if (lineCount >= maxLines) break;
          const dx = particlesArray[i].mesh.position.x - particlesArray[j].mesh.position.x;
          const dy = particlesArray[i].mesh.position.y - particlesArray[j].mesh.position.y;
          const dz = particlesArray[i].mesh.position.z - particlesArray[j].mesh.position.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          if (dist < 2.8) {
            const idx = lineCount * 6;
            posArray[idx] = particlesArray[i].mesh.position.x;
            posArray[idx + 1] = particlesArray[i].mesh.position.y;
            posArray[idx + 2] = particlesArray[i].mesh.position.z;
            posArray[idx + 3] = particlesArray[j].mesh.position.x;
            posArray[idx + 4] = particlesArray[j].mesh.position.y;
            posArray[idx + 5] = particlesArray[j].mesh.position.z;
            lineCount++;
          }
        }
      }
      
      // Clear remainder of position buffer
      for (let i = lineCount * 6; i < maxLines * 6; i++) {
        posArray[i] = 0;
      }
      lineGeo.attributes.position.needsUpdate = true;

      // Update click sparks
      for (let i = sparksArray.length - 1; i >= 0; i--) {
        const s = sparksArray[i];
        s.mesh.position.add(s.velocity);
        s.velocity.multiplyScalar(0.96); // Drag slowdown
        s.life -= 0.02; // Fading
        if (s.mesh.material instanceof THREE.MeshBasicMaterial) {
          s.mesh.material.opacity = s.life;
        }
        if (s.life <= 0) {
          scene.remove(s.mesh);
          s.mesh.geometry.dispose();
          if (s.mesh.material instanceof THREE.Material) {
            s.mesh.material.dispose();
          }
          sparksArray.splice(i, 1);
        }
      }

      // Deep space starry field rotation & counter-parallax mouse movement
      starField.rotation.y = elapsedTime * 0.008;
      starField.rotation.x = elapsedTime * 0.004;
      starField.position.x = -mouseRef.current.x * 0.8;
      starField.position.y = -mouseRef.current.y * 0.8;

      // Lerp mouse coordinates for smooth 4D camera shifting
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      camera.position.x = mouseRef.current.x * 1.8;
      camera.position.y = mouseRef.current.y * 1.8;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    // CLEANUP
    return () => {
      if (containerElement) {
        containerElement.removeEventListener('click', handleContainerClick);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (containerElement && renderer.domElement) {
        containerElement.removeChild(renderer.domElement);
      }
      scene.clear();
      capsuleGeo.dispose();
      hexagonGeo.dispose();
      sphereGeo.dispose();
      sparkGeo.dispose();
      starsGeo.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      starsMat.dispose();
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
      className="relative w-full h-screen flex items-center justify-center bg-gradient-to-br from-navy-dark via-[#11234F] to-[#0A1430] overflow-hidden z-10"
    >
      {/* Dynamic Background Image */}
      {bannerUrl && !isVideoUrl(bannerUrl) && (
        <img
          src={bannerUrl}
          alt="Hero Banner"
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none animate-fade-in duration-500"
        />
      )}

      {/* Dynamic Background Video */}
      {bannerUrl && isVideoUrl(bannerUrl) && (
        <video
          src={bannerUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none animate-fade-in duration-500"
        />
      )}

      {/* Dark overlay for dynamic banner tint & premium readability */}
      {bannerUrl && (
        <div className="absolute inset-0 bg-[#0B1531]/75 mix-blend-multiply z-0 pointer-events-none" />
      )}

      {/* Three.js canvas background container */}
      <div ref={containerRef} className="absolute inset-0 z-0 opacity-65 pointer-events-auto cursor-pointer" />

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
