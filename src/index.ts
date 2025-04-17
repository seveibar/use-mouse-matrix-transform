import {
  Matrix,
  identity,
  translate,
  compose,
  applyToPoint,
  scale,
} from "transformation-matrix"
import { fromTwoMovingPoints } from "transformation-matrix"
import { useCallback, useEffect, useReducer, useRef, useState } from "react"

type Point = { x: number; y: number }

interface Props {
  canvasElm?: HTMLElement
  transform?: Matrix
  initialTransform?: Matrix
  onSetTransform?: (transform: Matrix) => any
  enabled?: boolean
  shouldDrag?: (e: MouseEvent | TouchEvent | WheelEvent) => boolean
}

export const useMouseMatrixTransform = (props: Props = {}) => {
  const extRef = useRef<any>(null)
  const [lastDragCancelTime, setLastDragCancelTime] = useState(0)
  const outerCanvasElm = props.canvasElm ?? extRef.current
  const [internalTransform, setInternalTransform] = useState<Matrix>(
    props.initialTransform ?? identity(),
  )
  const [waitCounter, setWaitCounter] = useState(0)
  const [extChangeCounter, incExtChangeCounter] = useReducer((s) => s + 1, 0)

  const setTransform = useCallback(
    (newTransform: Matrix) => {
      if (props.onSetTransform) {
        props.onSetTransform(newTransform)
      }
      if (!props.transform) {
        setInternalTransform(newTransform)
      }
    },
    [props.onSetTransform, setInternalTransform],
  )

  const setTransformExt = useCallback(
    (newTransform: Matrix) => {
      setTransform(newTransform)
      incExtChangeCounter()
    },
    [setTransform],
  )

  const transform = props.transform ?? internalTransform

  const cancelDrag = useCallback(() => {
    setLastDragCancelTime(Date.now())
  }, [])

  const gestureModeRef = useRef<"none" | "drag" | "pinch">("none")
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null)
  const pinchDataRef = useRef<{
    touch1: { x: number; y: number }
    touch2: { x: number; y: number }
  } | null>(null)

  useEffect(() => {
    const canvasElm: HTMLCanvasElement | null =
      props.canvasElm ?? extRef.current
    if (canvasElm && !outerCanvasElm) {
      setWaitCounter(waitCounter + 1)
      return
    }
    if (!canvasElm) {
      const timeout = setTimeout(() => {
        setWaitCounter(waitCounter + 1)
      }, 100)
      return () => clearTimeout(timeout)
    }
    let init_tf = props.transform ?? internalTransform

    let m0: Point = { x: 0, y: 0 },
      m1: Point = { x: 0, y: 0 },
      md = false,
      mlastrel: Point = { x: 0, y: 0 }

    const getMousePos = (e: MouseEvent) => {
      return {
        x: e.pageX - canvasElm.getBoundingClientRect().left - window.scrollX,
        y: e.pageY - canvasElm.getBoundingClientRect().top - window.scrollY,
      }
    }

    function handleMouseDown(e: MouseEvent) {
      if (props.enabled === false) return
      if (props.shouldDrag && !props.shouldDrag(e)) return
      m0 = getMousePos(e)
      if (Date.now() - lastDragCancelTime < 100) return
      md = true
      e.preventDefault()
    }
    function handleMouseUp(e: MouseEvent) {
      if (!md || props.enabled === false) return
      if (props.shouldDrag && !props.shouldDrag(e)) return
      m1 = getMousePos(e)

      const new_tf = compose(translate(m1.x - m0.x, m1.y - m0.y), init_tf)
      setTransform(new_tf)
      init_tf = new_tf

      md = false
    }
    function handleMouseMove(e: MouseEvent) {
      mlastrel = getMousePos(e)
      if (!md || props.enabled === false) return
      if (props.shouldDrag && !props.shouldDrag(e)) return
      m1 = getMousePos(e)
      const new_tf = compose(translate(m1.x - m0.x, m1.y - m0.y), init_tf)
      setTransform(new_tf)
    }
    function handleMouseWheel(e: WheelEvent) {
      if (props.enabled === false) return
      if (props.shouldDrag && !props.shouldDrag(e)) return
      const center = getMousePos(e)
      const new_tf = compose(
        translate(center.x, center.y),
        scale(1 - e.deltaY / 1000, 1 - e.deltaY / 1000),
        translate(-center.x, -center.y),
        init_tf,
      )
      setTransform(new_tf)
      init_tf = new_tf
      e.preventDefault()
    }
    function handleMouseOut(e: MouseEvent) {
      if (!md) return
      if (props.shouldDrag && !props.shouldDrag(e)) return

      if (canvasElm) {
        const boundingBox = canvasElm.getBoundingClientRect()
        if (
          e.clientX >= boundingBox.left + 10 &&
          e.clientX <= boundingBox.right - 10 &&
          e.clientY >= boundingBox.top + 10 &&
          e.clientY <= boundingBox.bottom - 10
        ) {
          return
        }
      }

      md = false
      m1 = getMousePos(e)
      const new_tf = compose(translate(m1.x - m0.x, m1.y - m0.y), init_tf)
      setTransform(new_tf)
      init_tf = new_tf
    }

    function handleTouchStart(e: TouchEvent) {
      e.preventDefault()
      if (props.enabled === false) return
      if (e.touches.length === 1) {
        gestureModeRef.current = "drag"
        const touch = e.touches[0]
        lastTouchRef.current = { x: touch.clientX, y: touch.clientY }
      } else if (e.touches.length === 2) {
        gestureModeRef.current = "pinch"
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        pinchDataRef.current = {
          touch1: { x: touch1.clientX, y: touch1.clientY },
          touch2: { x: touch2.clientX, y: touch2.clientY },
        }
      }
    }

    function handleTouchMove(e: TouchEvent) {
      e.preventDefault()
      if (props.enabled === false) return
      if (
        gestureModeRef.current === "drag" &&
        e.touches.length === 1 &&
        lastTouchRef.current
      ) {
        // const touch = e.touches[0];
        // const deltaX = touch.clientX - lastTouchRef.current.x;
        // const deltaY = touch.clientY - lastTouchRef.current.y;
        // setTransform(compose(translate(deltaX, deltaY), init_tf));
        // lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
      } else if (
        gestureModeRef.current === "pinch" &&
        e.touches.length === 2 &&
        pinchDataRef.current
      ) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]

        // initial positions when pinch began
        const initialTouch1 = pinchDataRef.current.touch1
        const initialTouch2 = pinchDataRef.current.touch2

        // current positions
        const currentTouch1 = { x: touch1.clientX, y: touch1.clientY }
        const currentTouch2 = { x: touch2.clientX, y: touch2.clientY }

        // centers
        const initialCenter = {
          x: (initialTouch1.x + initialTouch2.x) / 2,
          y: (initialTouch1.y + initialTouch2.y) / 2,
        }
        const currentCenter = {
          x: (currentTouch1.x + currentTouch2.x) / 2,
          y: (currentTouch1.y + currentTouch2.y) / 2,
        }

        // distances
        const initialDist = Math.hypot(
          initialTouch2.x - initialTouch1.x,
          initialTouch2.y - initialTouch1.y,
        )
        const currentDist = Math.hypot(
          currentTouch2.x - currentTouch1.x,
          currentTouch2.y - currentTouch1.y,
        )

        // zoom factor
        const s = currentDist / initialDist

        // build the pure pan+zoom matrix
        const pinchTransform = compose(
          // 1) move origin to current center
          translate(currentCenter.x, currentCenter.y),
          // 2) scale
          scale(s, s),
          // 3) move back by initial center
          translate(-initialCenter.x, -initialCenter.y),
          // 4) apply the transform you had before pinch
          transform, // Use current transform instead of init_tf
        )

        setTransform(pinchTransform)
      }
    }

    function handleTouchEnd(e: TouchEvent) {
      e.preventDefault()
      if (e.touches.length === 0) {
        gestureModeRef.current = "none"
        lastTouchRef.current = null
        pinchDataRef.current = null
      }
    }

    canvasElm.addEventListener("mousedown", handleMouseDown)
    canvasElm.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("mousemove", handleMouseMove)
    canvasElm.addEventListener("mouseout", handleMouseOut)
    canvasElm.addEventListener("wheel", handleMouseWheel)

    canvasElm.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    })
    canvasElm.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    })
    canvasElm.addEventListener("touchend", handleTouchEnd, { passive: false })
    canvasElm.addEventListener("touchcancel", handleTouchEnd, {
      passive: false,
    })

    return () => {
      canvasElm.removeEventListener("mousedown", handleMouseDown)
      canvasElm.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("mousemove", handleMouseMove)
      canvasElm.removeEventListener("mouseout", handleMouseOut)
      canvasElm.removeEventListener("wheel", handleMouseWheel)

      canvasElm.removeEventListener("touchstart", handleTouchStart)
      canvasElm.removeEventListener("touchmove", handleTouchMove)
      canvasElm.removeEventListener("touchend", handleTouchEnd)
      canvasElm.removeEventListener("touchcancel", handleTouchEnd)
    }
  }, [
    outerCanvasElm,
    waitCounter,
    extChangeCounter,
    lastDragCancelTime,
    props.enabled,
    props.transform,
    props.shouldDrag,
  ])

  const applyTransformToPoint = useCallback(
    (obj: Point | [number, number]) => applyToPoint(transform, obj),
    [transform],
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
