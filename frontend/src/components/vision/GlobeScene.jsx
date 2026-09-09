import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import geography from "@/assets/vision/points.json";

// The supplied map samples use a 4098 × 2048 equirectangular coordinate plane.
const positions = geography.points.map(({ x, y }) => {
  const longitude = (x / 4098) * Math.PI * 2 - Math.PI;
  const latitude = Math.PI / 2 - (y / 2048) * Math.PI;
  return [
    Math.cos(latitude) * Math.sin(longitude),
    Math.sin(latitude),
    Math.cos(latitude) * Math.cos(longitude),
  ];
});
function fallbackImage() {
  const angle = -0.5,
    c = Math.cos(angle),
    s = Math.sin(angle);
  const dots = positions
    .map(([x, y, z]) => [x * c + z * s, y, z * c - x * s])
    .filter((p) => p[2] > 0)
    .map(
      ([x, y, z]) =>
        `<path d="M${(350 + x * 298).toFixed(1)} ${(330 - y * 298 - 1.35).toFixed(1)}l1.35 1.35-1.35 1.35-1.35-1.35z" opacity="${(0.25 + 0.65 * z).toFixed(2)}"/>`,
    )
    .join("");
  return (
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 660"><g fill="#409cff">${dots}</g></svg>`,
    )
  );
}
const still = fallbackImage();
export default function GlobeScene() {
  const host = useRef(null);
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    const el = host.current;
    let renderer,
      geometry,
      material,
      frame = 0,
      disposed = false,
      visible = true,
      last = 0,
      rotation = -0.5;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      setFallback(true);
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.domElement.setAttribute("aria-hidden", "true");
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 20);
    camera.position.z = 3.1;
    geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions.flat(), 3),
    );
    material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { pixelRatio: { value: renderer.getPixelRatio() } },
      vertexShader: `uniform float pixelRatio; varying float glow; void main(){ vec3 facing=normalize(mat3(modelMatrix)*position); glow=smoothstep(-0.04,0.85,facing.z); vec4 mv=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*mv; gl_PointSize=pixelRatio*2.8*(2.5/-mv.z); }`,
      fragmentShader: `varying float glow; void main(){ vec2 p=abs(gl_PointCoord-0.5); if(p.x+p.y>0.50 || glow<0.015) discard; gl_FragColor=vec4(0.16,0.54,1.0,glow*0.94); }`,
    });
    const globe = new THREE.Points(geometry, material);
    globe.rotation.set(0.16, rotation, -0.12);
    scene.add(globe);
    const render = () => renderer.render(scene, camera);
    const draw = (now) => {
      frame = 0;
      if (disposed || document.hidden || !visible || !document.hasFocus()) return;
      if (last && now - last < 32) {
        frame = requestAnimationFrame(draw);
        return;
      }
      const dt = last ? (now - last) / 1000 : 0;
      last = now;
      if (!reduce.matches) {
        rotation += (dt * Math.PI * 2) / 80;
        globe.rotation.y = rotation;
      }
      render();
      if (!reduce.matches) frame = requestAnimationFrame(draw);
    };
    const resume = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      if (!disposed && visible && !document.hidden && document.hasFocus())
        frame = requestAnimationFrame(draw);
    };
    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    const intersection = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      resume();
    });
    intersection.observe(el);
    const contextLost = (e) => {
      e.preventDefault();
      disposed = true;
      cancelAnimationFrame(frame);
      setFallback(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("focus", resume);
    window.addEventListener("blur", resume);
    reduce.addEventListener("change", resume);
    resize();
    resume();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("focus", resume);
      window.removeEventListener("blur", resume);
      reduce.removeEventListener("change", resume);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return (
    <div
      className="v-globe"
      role="img"
      aria-label="Rotating blue geographic point-cloud globe"
      data-fallback={fallback}
    >
      <div
        ref={host}
        className={fallback ? "v-globe-canvas hidden" : "v-globe-canvas"}
      />
      {fallback && (
        <img src={still} alt="Blue geographic point-cloud globe, still view" />
      )}
    </div>
  );
}
