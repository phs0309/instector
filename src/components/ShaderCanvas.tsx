'use client'

import { useEffect, useRef } from 'react'
import { shaders, vertexShader } from '@/lib/shaders'

interface ShaderCanvasProps {
  size?: number
  shaderId?: number
  isActive?: boolean
  className?: string
}

export default function ShaderCanvas({
  size = 80,
  shaderId = 1,
  isActive = false,
  className = '',
}: ShaderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)

  const selectedShader = shaders.find((s) => s.id === shaderId) || shaders[0]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl')
    if (!gl) {
      console.error('WebGL not supported')
      return
    }

    const vsSource = vertexShader
    const fsSource = selectedShader.fragmentShader

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource)
    if (!shaderProgram) return

    const programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
      },
      uniformLocations: {
        iResolution: gl.getUniformLocation(shaderProgram, 'iResolution'),
        iTime: gl.getUniformLocation(shaderProgram, 'iTime'),
        isActive: gl.getUniformLocation(shaderProgram, 'isActive'),
      },
    }

    const buffers = initBuffers(gl)
    const startTime = Date.now()

    canvas.width = size * 2 // Higher resolution
    canvas.height = size * 2
    gl.viewport(0, 0, canvas.width, canvas.height)

    const render = () => {
      const currentTime = (Date.now() - startTime) / 1000
      drawScene(gl, programInfo, buffers, currentTime, canvas.width, canvas.height, isActive)
      animationRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationRef.current)
      if (gl && shaderProgram) {
        gl.deleteProgram(shaderProgram)
      }
    }
  }, [size, shaderId, isActive, selectedShader.fragmentShader])

  function initShaderProgram(
    gl: WebGLRenderingContext,
    vsSource: string,
    fsSource: string
  ) {
    const vertShader = loadShader(gl, gl.VERTEX_SHADER, vsSource)
    const fragShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource)

    if (!vertShader || !fragShader) return null

    const shaderProgram = gl.createProgram()
    if (!shaderProgram) return null

    gl.attachShader(shaderProgram, vertShader)
    gl.attachShader(shaderProgram, fragShader)
    gl.linkProgram(shaderProgram)

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error(
        'Unable to initialize the shader program: ' +
          gl.getProgramInfoLog(shaderProgram)
      )
      return null
    }

    return shaderProgram
  }

  function loadShader(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type)
    if (!shader) return null

    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(
        'An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader)
      )
      gl.deleteShader(shader)
      return null
    }

    return shader
  }

  function initBuffers(gl: WebGLRenderingContext) {
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    const positions = [-1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0]
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

    const textureCoordBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer)
    const textureCoordinates = [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0]
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(textureCoordinates),
      gl.STATIC_DRAW
    )

    const indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    const indices = [0, 1, 2, 0, 2, 3]
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      gl.STATIC_DRAW
    )

    return {
      position: positionBuffer,
      textureCoord: textureCoordBuffer,
      indices: indexBuffer,
    }
  }

  function drawScene(
    gl: WebGLRenderingContext,
    programInfo: {
      program: WebGLProgram
      attribLocations: { vertexPosition: number; textureCoord: number }
      uniformLocations: {
        iResolution: WebGLUniformLocation | null
        iTime: WebGLUniformLocation | null
        isActive: WebGLUniformLocation | null
      }
    },
    buffers: {
      position: WebGLBuffer | null
      textureCoord: WebGLBuffer | null
      indices: WebGLBuffer | null
    },
    currentTime: number,
    width: number,
    height: number,
    isActive: boolean
  ) {
    gl.clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clearDepth(1.0)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    // Enable blending for soft edges
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.useProgram(programInfo.program)

    gl.uniform2f(programInfo.uniformLocations.iResolution, width, height)
    gl.uniform1f(programInfo.uniformLocations.iTime, currentTime)
    gl.uniform1i(programInfo.uniformLocations.isActive, isActive ? 1 : 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      2,
      gl.FLOAT,
      false,
      0,
      0
    )
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition)

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord)
    gl.vertexAttribPointer(
      programInfo.attribLocations.textureCoord,
      2,
      gl.FLOAT,
      false,
      0,
      0
    )
    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices)
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
  }

  return (
    <canvas
      ref={canvasRef}
      className={`rounded-full ${className}`}
      style={{
        width: size,
        height: size,
      }}
    />
  )
}
