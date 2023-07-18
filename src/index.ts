import {
  Matrix,
  identity,
  scale,
  translate,
  compose,
  applyToPoint,
} from "transformation-matrix"
import { useCallback, useEffect, useRef, useState } from "react"

type Point = { x: number; y: number }

type MouseState = {
  md: boolean
  m0: Point
  m1: Point
  mlastrel: Point
}

interface Props {
  canvasElm?: HTMLElement
  transform?: Matrix
  initialTransform?: Matrix
  onSetTransform?: (transform: Matrix) => any
}

export const useMouseMatrixTransform = (props: Props = {}) => {
  const extRef = useRef<any>(null)
  const { current: ms } = useRef<MouseState>({
    m0: { x: 0, y: 0 },
    m1: { x: 0, y: 0 },
    mlastrel: { x: 0, y: 0 },
    md: false,
  })
  const tref = useRef<{ matrix: Matrix | null }>({ matrix: null })
  const canvasElm = props.canvasElm ?? extRef.current
  const [internalTransform, setInternalTransform] = useState<Matrix>(
    props.initialTransform ?? identity()
  )

  // The references inside this function to setInternalTransform might be lost
  // when the component's second ref is found, we could try to make it so this
  // useEffect dance doesn't even happen if the div doesn't actually change
  // or something
  const setTransform = (newTransform: Matrix) => {
    if (props.onSetTransform) {
      props.onSetTransform(newTransform)
    } else {
      setInternalTransform(newTransform)
    }
  }

  const transform = tref.current.matrix ?? props.transform ?? internalTransform

  useEffect(() => {
    // redefine canvasElm, it can sometimes not be defined in
    // render but be defined in effects due to SSR
    const canvasElm = props.canvasElm ?? extRef.current
    if (!canvasElm) return
    if (!tref.current.matrix) {
      tref.current.matrix = props.transform ?? internalTransform
    }

    const getMousePos = (e: MouseEvent) => {
      // Using the offset for the elemenet messes things up when the element
      // size might change or the element is moved
      // const rect = canvasElm.getBoundingClientRect()
      // return {
      //   x: e.clientX - rect.left,
      //   y: e.clientY - rect.top,
      // }

      return {
        x: e.pageX,
        y: e.pageY,
      }
    }

    function handleMouseDown(e: MouseEvent) {
      ms.m0 = getMousePos(e)
      ms.md = true
      e.preventDefault()
    }
    function handleMouseUp(e: MouseEvent) {
      ms.m1 = getMousePos(e)
      const { m0, m1 } = ms

      const new_tf = compose(
        translate(m1.x - m0.x, m1.y - m0.y),
        tref.current.matrix!
      )
      setTransform(new_tf)
      tref.current.matrix = new_tf

      ms.md = false
    }
    function handleMouseMove(e: MouseEvent) {
      const { m0, m1, md } = ms
      ms.mlastrel = getMousePos(e)
      if (!md) return
      ms.m1 = getMousePos(e)

      setTransform(
        compose(translate(m1.x - m0.x, m1.y - m0.y), tref.current.matrix!)
      )
    }
    function handleMouseWheel(e: WheelEvent) {
      console.log("wheel")
      const center = getMousePos(e)
      const new_tf = compose(
        translate(center.x, center.y),
        scale(1 - e.deltaY / 1000, 1 - e.deltaY / 1000),
        translate(-center.x, -center.y),
        tref.current.matrix!
      )
      setTransform(new_tf)
      tref.current.matrix = new_tf
      e.preventDefault()
    }
    function handleMouseOut(e: MouseEvent) {
      if (!ms.md) return
      ms.md = false
      ms.m1 = getMousePos(e)

      const { m0, m1 } = ms
      const new_tf = compose(
        translate(m1.x - m0.x, m1.y - m0.y),
        tref.current.matrix!
      )
      setTransform(new_tf)
      tref.current.matrix = new_tf
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
  }, [canvasElm])

  const applyTransformToPoint = useCallback(
    (obj: Point | [number, number]) => {
      console.log(tref.current.matrix?.e)
      return applyToPoint(tref.current.matrix ?? transform, obj)
    },
    [transform, tref.current.matrix]
  )

  return {
    ref: extRef,
    transform,
    applyTransformToPoint,
  }
}

export default useMouseMatrixTransform
