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
  enabled?: boolean
  shouldDrag?: (e: MouseEvent) => boolean
}

export const useMouseMatrixTransform = (props: Props = {}) => {
  const extRef = useRef<any>(null)
  const [lastDragCancelTime, setLastDragCancelTime] = useState(0)
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
    const canvasElm: HTMLCanvasElement | null =
      props.canvasElm ?? extRef.current
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

      setTransform(compose(translate(m1.x - m0.x, m1.y - m0.y), init_tf))
    }
    function handleMouseWheel(e: WheelEvent) {
      if (props.enabled === false) return
      if (props.shouldDrag && !props.shouldDrag(e)) return
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
      if (props.shouldDrag && !props.shouldDrag(e)) return

      // If the mouseout occurs in the bounding box of the canvasElm, it's
      // defocusing on internal elements, so we should ignore it
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

    canvasElm.addEventListener("pointerdown", handleMouseDown)
    canvasElm.addEventListener("pointerup", handleMouseUp)
    window.addEventListener("pointermove", handleMouseMove)
    canvasElm.addEventListener("pointerout", handleMouseOut)
    canvasElm.addEventListener("wheel", handleMouseWheel)

    return () => {
      canvasElm.removeEventListener("pointerdown", handleMouseDown)
      canvasElm.removeEventListener("pointerup", handleMouseUp)
      window.removeEventListener("pointermove", handleMouseMove)
      canvasElm.removeEventListener("pointerout", handleMouseOut)
      canvasElm.removeEventListener("wheel", handleMouseWheel)
    }
  }, [outerCanvasElm, waitCounter, extChangeCounter, lastDragCancelTime, props.enabled, props.shouldDrag])

  const applyTransformToPoint = useCallback(
    (obj: Point | [number, number]) => applyToPoint(transform, obj),
    [transform]
  )

  return {
    ref: extRef,
    transform,
    applyTransformToPoint,
    setTransform: setTransformExt,
    cancelDrag
  }
}

export default useMouseMatrixTransform
