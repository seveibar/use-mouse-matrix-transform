"use client"
// Example Usage
import React, { useState } from "react"
import { useMouseMatrixTransform } from "../index"
export default () => {
  const { ref, applyTransformToPoint, transform } = useMouseMatrixTransform()
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
        {
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
        }
      </div>
      <div>
        <input type="checkbox" onClick={() => setOffCenter(!offCenter)} /> off
        center
      </div>
    </div>
  )
}
