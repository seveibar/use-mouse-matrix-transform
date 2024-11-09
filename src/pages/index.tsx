"use client"
import React, { useState, useRef } from "react"
import { useMouseMatrixTransform } from "../index"
import { toString as transformToString } from "transformation-matrix"

export default () => {
  const svgDivRef = useRef<HTMLDivElement>(null)
  const { ref, cancelDrag } = useMouseMatrixTransform({
    onSetTransform(transform) {
      if (svgDivRef.current) {
        svgDivRef.current.style.transform = transformToString(transform)
      }
    },
  })

  const [offCenter, setOffCenter] = useState(false)

  return (
    <div style={{ height: 2000 }}>
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        style={{
          marginTop: offCenter ? 400 : 0,
          marginLeft: offCenter ? 400 : 0,
          position: "relative",
          backgroundColor: "#eee",
          height: 600,
          width: 600,
          overflow: "hidden",
          cursor: "grab",
        }}
      >
        <div
          ref={svgDivRef}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 25,
            height: 25,
            backgroundColor: "red",
            pointerEvents: "none",
            transformOrigin: "0 0",
          }}
        ></div>
        <div
          style={{
            position: "absolute",
            padding: 8,
            right: 0,
            bottom: 0,
            color: "white",
            cursor: "pointer",
            backgroundColor: "blue",
            fontFamily: "monospace",
          }}
          onMouseDown={() => {
            cancelDrag()
          }}
        >
          cancelDrag
        </div>
      </div>
      <div>
        <input type="checkbox" onClick={() => setOffCenter(!offCenter)} /> off
        center
      </div>
      <div style={{ marginTop: 20 }}>Try dragging the canvas above around</div>
    </div>
  )
}
