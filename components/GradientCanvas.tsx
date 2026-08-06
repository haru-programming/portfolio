'use client'

import { useEffect, useRef } from 'react'
import styles from './GradientCanvas.module.css'

/**
 * このサイトで唯一のクライアントコンポーネント。
 *
 * DESIGN.md では、Bugatti が写真に割り当てているスロット（感情を担う
 * 非タイポグラフィ要素をちょうど1つだけ置く）をこのグラデーションが占める。
 * したがってグラデーションはここ以外には出さない。
 *
 * canvas は LCP の候補要素ではないので（CSS グラデーション背景も同様）、
 * この描画が LCP を遅らせることはない。LCP 要素は Hero の h1（Jost）。
 *
 * SSR させたうえで useEffect から WebGL に差し替える。canvas 要素自体は
 * HTML に含まれ、CSS グラデーションのフォールバックが即座に見えるので、
 * 描画開始まで背景が抜けることがない。
 */

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`

const FRAG = `precision highp float;
uniform vec2 u_res; uniform float u_t;

float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
}
float fbm(vec2 p){
  float v=0., a=.5;
  for(int i=0;i<3;i++){ v+=a*noise(p); p*=2.07; a*=.52; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float ar = u_res.x / u_res.y;
  vec2 st = vec2(uv.x*ar, uv.y);
  float t = u_t * 0.075;

  vec2 d1 = vec2( t*0.50, -t*0.28);
  vec2 d2 = vec2(-t*0.34,  t*0.42);

  vec2 q = vec2(fbm(st*0.90 + d1),
                fbm(st*0.90 + vec2(4.1,2.3) + d2));
  vec2 w = st*1.05 + 1.9*q;

  float fY = fbm(w + vec2( 0.0, 0.0) + d2*0.60);
  float fA = fbm(w + vec2( 5.7, 3.1) + d1*0.50);
  float fP = fbm(w + vec2(11.3, 8.4) - d2*0.70);
  float fC = fbm(w + vec2(17.9,14.2) + d1*0.40);
  float fW = fbm(st*1.35 + 2.3*q + vec2(23.1,19.5) - d1*0.60);

  vec3 white = vec3(1.000,1.000,1.000);
  vec3 lemon = vec3(0.980,0.925,0.541);
  vec3 aqua  = vec3(0.659,0.898,0.863);
  vec3 pink  = vec3(0.988,0.686,0.753);
  vec3 peach = vec3(1.000,0.788,0.659);

  vec3 col = white;
  col = mix(col, lemon, smoothstep(0.30,0.70, fY) * 0.95);
  col = mix(col, aqua,  smoothstep(0.31,0.72, fA) * 0.95);
  col = mix(col, pink,  smoothstep(0.29,0.69, fP) * 0.95);
  col = mix(col, peach, smoothstep(0.42,0.82, fC) * 0.65);

  col = mix(col, white, smoothstep(0.40,0.84, fW) * 0.90);
  col = mix(col, white, smoothstep(0.52,0.00, length(uv-0.5)) * 0.26);

  col += (hash(gl_FragCoord.xy) - 0.5) * 0.010;

  gl_FragColor = vec4(col, 1.0);
}`

const compile = (
  gl: WebGLRenderingContext,
  type: number,
  src: string,
): WebGLShader | null => {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null
}

/** 初期化に失敗したら false。呼び出し側は CSS グラデーションのまま放置する。 */
const initGL = (canvas: HTMLCanvasElement): (() => void) | false => {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false })
  if (!gl) return false

  const vs = compile(gl, gl.VERTEX_SHADER, VERT)
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
  if (!vs || !fs) return false

  const program = gl.createProgram()
  if (!program) return false
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false
  gl.useProgram(program)

  // フルスクリーン三角形。頂点は3つだけで頂点バッファも1本。
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  )
  const loc = gl.getAttribLocation(program, 'p')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  const uRes = gl.getUniformLocation(program, 'u_res')
  const uT = gl.getUniformLocation(program, 'u_t')

  // モバイルの発熱とバッテリーのため DPR は 1.5 で頭打ちにする
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  const resize = (): void => {
    canvas.width = Math.floor(canvas.clientWidth * dpr)
    canvas.height = Math.floor(canvas.clientHeight * dpr)
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform2f(uRes, canvas.width, canvas.height)
  }
  resize()
  window.addEventListener('resize', resize)

  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let visible = true
  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries[0]?.isIntersecting ?? false
    },
    { threshold: 0 },
  )
  observer.observe(canvas)

  const start = performance.now()
  let frame = 0
  const draw = (): void => {
    if (visible) {
      gl.uniform1f(uT, still ? 12.0 : (performance.now() - start) / 1000)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    // reduced-motion では t = 12.0 の1フレームだけ描いて止める
    if (!still) frame = requestAnimationFrame(draw)
  }
  draw()

  return () => {
    cancelAnimationFrame(frame)
    observer.disconnect()
    window.removeEventListener('resize', resize)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
}

export default function GradientCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const cleanup = initGL(canvas)
    return cleanup === false ? undefined : cleanup
  }, [])

  return <canvas ref={ref} className={styles.canvas} aria-hidden="true" />
}
