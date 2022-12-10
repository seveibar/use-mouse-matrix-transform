import {
  Matrix,
  identity,
  scale,
  translate,
  compose,
  flipY,
} from "transformation-matrix"
import {
  createRef,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react"

type Point = { x: number; y: number }

interface Props {
  canvasElm?: HTMLElement
  transform?: Matrix
  onSetTransform?: (transform: Matrix) => any
}

export const useMouseMatrixTransform = (props: Props) => {
  const extRef = useRef<any>(null)
  const canvasElm = props.canvasElm ?? extRef.current
  const [internalTransform, setInternalTransform] = useState<Matrix>(identity())
  const extTrackingTransform = createRef<Matrix>()

  const setTransform = (newTransform: Matrix) => {
    if (props.onSetTransform) {
      ;(extTrackingTransform as any).current = newTransform
      props.onSetTransform(newTransform)
    } else {
      setInternalTransform(newTransform)
    }
  }

  const [canvasReloadCount, reloadCanvasEvents] = useReducer((s) => s + 1, 0)
  useEffect(() => {
    if (extTrackingTransform.current !== props.transform) {
      ;(extTrackingTransform as any).current = props.transform
      reloadCanvasEvents()
    }
  }, [props.transform])

  const transform = props.transform ?? internalTransform

  useEffect(() => {
    if (!canvasElm) return
    let init_tf = props.transform ?? internalTransform

    let m0: Point = { x: 0, y: 0 },
      m1: Point = { x: 0, y: 0 },
      md = false

    const getMousePos = (e: MouseEvent) => {
      const rect = canvasElm.getBoundingClientRect()
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
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
  }, [canvasElm, reloadCanvasEvents])

  return {
    ref: extRef,
    transform,
  }
}

export default useMouseMatrixTransform
