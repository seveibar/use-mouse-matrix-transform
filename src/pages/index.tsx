"use client"
// Example Usage
import React, { useState } from "react"
import { useMouseMatrixTransform } from "../index"
export default () => {
  const { ref, applyTransformToPoint, transform, cancelDrag } =
    useMouseMatrixTransform()
  const [offCenter, setOffCenter] = useState(false)

  const { x: left, y: top } = applyTransformToPoint({ x: 100, y: 100 }) as any
  // console.log(transform, left, top)

  return (
    <div style={{ height: 2000 }}>
      <div
        ref={ref}
        style={{
          marginTop: offCenter ? 400 : 0,
          marginLeft: offCenter ? 400 : 0,
          position: "relative",
          backgroundColor: "#eee",
          height: 600,
          width: 600,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left,
            top,
            width: 25 * transform.d,
            height: 25 * transform.d,
            backgroundColor: "red",
          }}
        ></div>
        <div
          style={{
            position: "absolute",
            left: left + 400,
            top: top + 100,
            padding: 8,
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
