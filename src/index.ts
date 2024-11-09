import {
  Matrix,
  identity,
  scale,
  translate,
  compose,
  applyToPoint,
  inverse,
} from "transformation-matrix"
import { useCallback, useEffect, useReducer, useRef, useState } from "react"

type Point = { x: number; y: number }

interface Props {
  canvasElm?: HTMLElement
  transform?: Matrix
  initialTransform?: Matrix
  onSetTransform?: (transform: Matrix) => void
  minScale?: number
  maxScale?: number
}

export const useMouseMatrixTransform = (props: Props = {}) => {
  const extRef = useRef<HTMLElement | null>(null)
  const [lastDragCancelTime, setLastDragCancelTime] = useState(0)
  const outerCanvasElm = props.canvasElm ?? extRef.current
  const [internalTransform, setInternalTransform] = useState<Matrix>(
    props.initialTransform ?? identity()
  )
  const [waitCounter, setWaitCounter] = useState(0)
  const [extChangeCounter, incExtChangeCounter] = useReducer((s) => s + 1, 0)
  const containerBoundsRef = useRef<DOMRect | null>(null)
  const lastWheelEventRef = useRef<number>(0)
  const accumulatedDeltaRef = useRef<number>(0)

  // Default scale limits
  const minScale = props.minScale ?? 0.1
  const maxScale = props.maxScale ?? 5

  const setTransform = useCallback(
    (newTransform: Matrix) => {
      if (props.onSetTransform) {
        props.onSetTransform(newTransform)
      }
      if (!props.transform) {
        setInternalTransform(newTransform)
      }
    },
    [props.onSetTransform, setInternalTransform]
  )

  const setTransformExt = useCallback(
    (newTransform: Matrix) => {
      setTransform(newTransform)
      incExtChangeCounter()
    },
    [setTransform]
  )

  const transform = props.transform ?? internalTransform

  const cancelDrag = useCallback(() => {
    setLastDragCancelTime(Date.now())
  }, [])

  useEffect(() => {
    const canvasElm = props.canvasElm ?? extRef.current
    
    if (!canvasElm) {
      const timeout = setTimeout(() => {
        setWaitCounter(waitCounter + 1)
      }, 100)
      return () => clearTimeout(timeout)
    }

    if (canvasElm && !outerCanvasElm) {
      setWaitCounter(waitCounter + 1)
      return
    }

    containerBoundsRef.current = canvasElm.getBoundingClientRect()
    
    let init_tf = props.transform ?? internalTransform
    let m0: Point = { x: 0, y: 0 }
    let m1: Point = { x: 0, y: 0 }
    let md = false
    let mlastrel: Point = { x: 0, y: 0 }

    const getMousePos = (e: MouseEvent | WheelEvent) => {
      const rect = canvasElm.getBoundingClientRect()
      containerBoundsRef.current = rect
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }

    const getCurrentScale = (matrix: Matrix) => {
      return Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b)
    }

    function handleMouseDown(e: MouseEvent) {
      m0 = getMousePos(e)
      if (Date.now() - lastDragCancelTime < 100) return
      md = true
      e.preventDefault()
      if (canvasElm) {
        canvasElm.style.cursor = "grabbing"
      }
    }

    function handleMouseUp(e: MouseEvent) {
      if (!md) return
      if (canvasElm) {
        canvasElm.style.cursor = "grab"
      }
      m1 = getMousePos(e)

      const dragDelta = {
        x: m1.x - m0.x,
        y: m1.y - m0.y
      }

      // Apply scale-adjusted translation
      const currentScale = getCurrentScale(init_tf)
      const new_tf = compose(
        translate(dragDelta.x / currentScale, dragDelta.y / currentScale),
        init_tf
      )
      
      setTransform(new_tf)
      init_tf = new_tf
      md = false
    }

    function handleMouseMove(e: MouseEvent) {
      mlastrel = getMousePos(e)
      if (!md) return
      m1 = getMousePos(e)

      const dragDelta = {
        x: m1.x - m0.x,
        y: m1.y - m0.y
      }

      // Apply scale-adjusted translation
      const currentScale = getCurrentScale(init_tf)
      setTransform(
        compose(
          translate(dragDelta.x / currentScale, dragDelta.y / currentScale),
          init_tf
        )
      )
    }

    function handleMouseWheel(e: WheelEvent) {
      e.preventDefault()

      const now = Date.now()
      const mousePos = getMousePos(e)
      
      // Accumulate delta with decay
      if (now - lastWheelEventRef.current > 50) {
        accumulatedDeltaRef.current = 0
      }
      accumulatedDeltaRef.current += e.deltaY
      lastWheelEventRef.current = now

      const smoothFactor = -0.0007
      const scaleFactor = Math.exp(accumulatedDeltaRef.current * smoothFactor)
      
      // current scale and calculate for new scale
      const currentScale = getCurrentScale(init_tf)
      const newScale = currentScale * scaleFactor

      // scale bounds
      if (newScale < minScale || newScale > maxScale) {
        accumulatedDeltaRef.current = 0
        return
      }

      // Calculate new transform
      const new_tf = compose(
        translate(mousePos.x, mousePos.y),
        scale(scaleFactor, scaleFactor),
        translate(-mousePos.x, -mousePos.y),
        init_tf
      )

      setTransform(new_tf)
      init_tf = new_tf
    }

    function handleMouseOut(e: MouseEvent) {
      if (!md) return

      const rect = containerBoundsRef.current
      if (
        rect &&
        e.clientX >= rect.left + 10 &&
        e.clientX <= rect.right - 10 &&
        e.clientY >= rect.top + 10 &&
        e.clientY <= rect.bottom - 10
      ) {
        return
      }

      md = false
      if (canvasElm) {
        canvasElm.style.cursor = "grab"
      }
      m1 = getMousePos(e)

      const dragDelta = {
        x: m1.x - m0.x,
        y: m1.y - m0.y
      }

      const currentScale = getCurrentScale(init_tf)
      const new_tf = compose(
        translate(dragDelta.x / currentScale, dragDelta.y / currentScale),
        init_tf
      )
      
      setTransform(new_tf)
      init_tf = new_tf
    }

    canvasElm.addEventListener("mousedown", handleMouseDown)
    canvasElm.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("mousemove", handleMouseMove)
    canvasElm.addEventListener("mouseout", handleMouseOut)
    canvasElm.addEventListener("wheel", handleMouseWheel, { passive: false })

    return () => {
      canvasElm.removeEventListener("mousedown", handleMouseDown)
      canvasElm.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("mousemove", handleMouseMove)
      canvasElm.removeEventListener("mouseout", handleMouseOut)
      canvasElm.removeEventListener("wheel", handleMouseWheel)
    }
  }, [outerCanvasElm, waitCounter, extChangeCounter, lastDragCancelTime, minScale, maxScale])

  const applyTransformToPoint = useCallback(
    (obj: Point | [number, number]) => applyToPoint(transform, obj),
    [transform]
  )

  return {
    ref: extRef,
    transform,
    applyTransformToPoint,
    setTransform: setTransformExt,
    cancelDrag,
  }
}

export default useMouseMatrixTransform