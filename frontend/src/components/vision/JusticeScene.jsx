import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import justiceArtwork from "@/assets/vision/lady-justice-particles.png";

// A shallow relief preserves the supplied figure's silhouette while giving the
// particle artwork a restrained turn. This is not a complete 3D statue model.
export default function JusticeScene() {
  const host = useRef(null);
  const [mode, setMode] = useState("loading");
  useEffect(() => {
    const el = host.current;
    let renderer, texture, geometry, material, figure;
    let frame = 0,
      disposed = false,
      lost = false,
      visible = true,
      last = 0,
      elapsed = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const state = (value) =>
      el.parentElement?.setAttribute("data-animation", value);
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      setMode("fallback");
      state("still");
      return;
    }
    renderer.setClearColor(0, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.domElement.setAttribute("aria-hidden", "true");
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 20);
    camera.position.z = 3.4;
    const render = () => {
      if (!disposed && !lost && figure) renderer.render(scene, camera);
    };
    const pose = (seconds) => {
      figure.rotation.y = Math.sin((seconds * Math.PI * 2) / 18) * 0.12;
      figure.rotation.x = Math.sin((seconds * Math.PI * 2) / 24) * 0.018;
      figure.position.y = Math.sin((seconds * Math.PI * 2) / 9) * 0.018;
      material.uniforms.time.value = seconds;
    };
    const draw = (now) => {
      frame = 0;
      if (
        disposed ||
        lost ||
        !figure ||
        document.hidden ||
        !visible ||
        !document.hasFocus()
      )
        return;
      if (last && now - last < 40) {
        frame = requestAnimationFrame(draw);
        return;
      }
      elapsed += last ? (now - last) / 1000 : 0;
      last = now;
      pose(reduce.matches ? 0 : elapsed);
      render();
      state(reduce.matches ? "still" : "running");
      if (!reduce.matches) frame = requestAnimationFrame(draw);
    };
    const resume = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      if (disposed || lost || !figure) return;
      if (reduce.matches) {
        pose(0);
        render();
        state("still");
        return;
      }
      const active = visible && !document.hidden && document.hasFocus();
      state(active ? "running" : "paused");
      if (active) frame = requestAnimationFrame(draw);
    };
    const resize = () => {
      if (disposed || lost) return;
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      // Fit the square artwork with clearance for its small turn and float.
      camera.position.z = 3.4 / Math.min(1, camera.aspect);
      camera.updateProjectionMatrix();
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      resume();
    });
    intersection.observe(el);
    const fallback = () => {
      if (disposed) return;
      lost = true;
      cancelAnimationFrame(frame);
      state("still");
      setMode("fallback");
    };
    const contextLost = (event) => {
      event.preventDefault();
      fallback();
    };
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("focus", resume);
    window.addEventListener("blur", resume);
    reduce.addEventListener("change", resume);
    texture = new THREE.TextureLoader().load(
      justiceArtwork,
      (loaded) => {
        if (disposed || lost) {
          loaded.dispose();
          return;
        }
        loaded.minFilter = THREE.LinearFilter;
        loaded.magFilter = THREE.LinearFilter;
        geometry = new THREE.PlaneGeometry(2.18, 2.18, 48, 48);
        material = new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          uniforms: { artwork: { value: loaded }, time: { value: 0 } },
          vertexShader: `varying vec2 artUv;
          void main(){ artUv=uv; vec3 p=position;
            p.z=0.10*sin(uv.x*3.14159)*sin(uv.y*3.14159);
            gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
          fragmentShader: `uniform sampler2D artwork; uniform float time; varying vec2 artUv;
          void main(){ vec3 ink=texture2D(artwork,artUv).rgb;
            float strength=max(ink.r,max(ink.g,ink.b));
            if(strength<0.035) discard;
            float light=0.86+0.12*sin(artUv.y*8.0-time*0.7);
            float edge=smoothstep(0.0,0.045,artUv.y)*smoothstep(0.0,0.025,artUv.x);
            gl_FragColor=vec4(ink*light, smoothstep(0.035,0.32,strength)*edge*0.86); }`,
        });
        figure = new THREE.Mesh(geometry, material);
        scene.add(figure);
        pose(0);
        resize();
        setMode("ready");
        resume();
      },
      undefined,
      fallback,
    );
    resize();
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
      geometry?.dispose();
      material?.dispose();
      texture?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return (
    <div
      className="v-globe v-justice"
      role="img"
      aria-label="Animated blue particle Lady Justice holding the scales of justice"
      data-fallback={mode === "fallback"}
      data-ready={mode === "ready"}
    >
      <div
        ref={host}
        className={`v-globe-canvas ${mode === "fallback" ? "hidden" : ""}`}
      />
      {mode !== "ready" && (
        <img
          className="v-justice-still"
          src={justiceArtwork}
          alt="Blue particle Lady Justice, still view"
        />
      )}
    </div>
  );
}
