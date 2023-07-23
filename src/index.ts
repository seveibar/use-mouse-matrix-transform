import {
  Matrix,
  identity,
  scale,
  translate,
  compose,
  applyToPoint,
} from "transformation-matrix"
import { useCallback, useEffect, useReducer, useRef, useState } from "react"

type Point = { x: number; y: number }

interface Props {
  canvasElm?: HTMLElement
  transform?: Matrix
  initialTransform?: Matrix
  onSetTransform?: (transform: Matrix) => any
}

export const useMouseMatrixTransform = (props: Props = {}) => {
  const extRef = useRef<any>(null)
  const outerCanvasElm = props.canvasElm ?? extRef.current
  const [internalTransform, setInternalTransform] = useState<Matrix>(
    props.initialTransform ?? identity()
  )
  const [waitCounter, setWaitCounter] = useState(0)
  const [extChangeCounter, incExtChangeCounter] = useReducer((s) => s + 1, 0)

  const setTransform = useCallback(
    (newTransform: Matrix) => {
      if (props.onSetTransform) {
        props.onSetTransform(newTransform)
      } else {
        setInternalTransform(newTransform)
      }
    },
    [props.onSetTransform, setInternalTransform]
  )

  const setTransformExt = useCallback(
    (newTransform: Matrix) => {
      incExtChangeCounter()
      return setTransform(newTransform)
    },
    [setTransform]
  )

  const transform = props.transform ?? internalTransform

  useEffect(() => {
    const canvasElm = props.canvasElm ?? extRef.current
    if (canvasElm && !outerCanvasElm) {
      // Always re-render when the canvas element is known
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
      return { x: e.pageX, y: e.pageY }
    }

    function handleMouseDown(e: MouseEvent) {
      m0 = getMousePos(e)
      md = true
      e.preventDefault()
    }
    function handleMouseUp(e: MouseEvent) {
      m1 = getMousePos(e)

      const new_tf = compose(translate(m1.x - m0.x, m1.y - m0.y), init_tf)
      setTransform(new_tf)
      init_tf = new_tf

      md = false
    }
    function handleMouseMove(e: MouseEvent) {
      mlastrel = getMousePos(e)
      if (!md) return
      m1 = getMousePos(e)

      setTransform(compose(translate(m1.x - m0.x, m1.y - m0.y), init_tf))
    }
    function handleMouseWheel(e: WheelEvent) {
      const center = getMousePos(e)
      const new_tf = compose(
        translate(center.x, center.y),
        scale(1 - e.deltaY / 1000, 1 - e.deltaY / 1000),
        translate(-center.x, -center.y),
        init_tf
      )
      setTransform(new_tf)
      init_tf = new_tf
      e.preventDefault()
    }
    function handleMouseOut(e: MouseEvent) {
      if (!md) return
      md = false
      m1 = getMousePos(e)

      const new_tf = compose(translate(m1.x - m0.x, m1.y - m0.y), init_tf)
      setTransform(new_tf)
      init_tf = new_tf
    }

    canvasElm.addEventListener("mousedown", handleMouseDown)
    canvasElm.addEventListener("mouseup", handleMouseUp)
    canvasElm.addEventListener("mousemove", handleMouseMove)
    canvasElm.addEventListener("mouseout", handleMouseOut)
    canvasElm.addEventListener("wheel", handleMouseWheel)

    return () => {
      canvasElm.removeEventListener("mousedown", handleMouseDown)
      canvasElm.removeEventListener("mouseup", handleMouseUp)
      canvasElm.removeEventListener("mousemove", handleMouseMove)
      canvasElm.removeEventListener("mouseout", handleMouseOut)
      canvasElm.removeEventListener("wheel", handleMouseWheel)
    }
  }, [outerCanvasElm, waitCounter, extChangeCounter])

  const applyTransformToPoint = useCallback(
    (obj: Point | [number, number]) => applyToPoint(transform, obj),
    [transform]
  )

  return {
    ref: extRef,
    transform,
    applyTransformToPoint,
    setTransform: setTransformExt,
  }
}

export default useMouseMatrixTransform
