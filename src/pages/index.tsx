"use client"
// Example Usage
import React, { useState } from "react"
import { useMouseMatrixTransform } from "../index"

export default () => {
  const {
    ref,
    applyTransformToPoint,
    transform,
    setTransform,
    cancelDrag,
    handleMouseWheel,
  } = useMouseMatrixTransform()
  const [offCenter, setOffCenter] = useState(false)

  const { x: redLeft, y: redTop } = applyTransformToPoint({
    x: 100,
    y: 100,
  }) as any

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
        onWheel={handleMouseWheel} // Attach wheel event to canvas for zooming
      >
        <div
          style={{
            position: "absolute",
            left: redLeft,
            top: redTop,
            width: 25 * transform.d,
            height: 25 * transform.d,
            backgroundColor: "red",
          }}
        ></div>

        {/* Blue button, unaffected by zoom */}
        <div
          style={{
            position: "absolute",
            left: 500,
            top: 200,
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
