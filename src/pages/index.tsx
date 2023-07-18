"use client"
// Example Usage
import React from "react"
import { useMouseMatrixTransform } from "../index"
export default () => {
  const { ref, applyTransformToPoint, transform } = useMouseMatrixTransform()

  const { x: left, y: top } = applyTransformToPoint({ x: 100, y: 100 }) as any
  // console.log(transform, left, top)

  return (
    <div
      ref={ref}
      style={{
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
  )
}
