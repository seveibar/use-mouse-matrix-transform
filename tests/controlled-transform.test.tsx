import { expect, test } from "bun:test"
import "bun-match-svg"
import { GlobalRegistrator } from "@happy-dom/global-registrator"
import { compose, scale, translate } from "transformation-matrix"
import {
  ControlledTransformRepro,
  fittedBoardToPxTransform,
} from "../src/pages/controlled-transform-repro"

let deferredCommit: (() => void) | undefined

function deferCommit(commit: () => void) {
  deferredCommit = commit
}

function commitTransform() {
  if (!deferredCommit) throw new Error("A camera update must be pending")
  const commit = deferredCommit
  deferredCommit = undefined
  commit()
}

test("the first zoom uses a fitted transform committed on the next frame", async () => {
  GlobalRegistrator.register()
  Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
    value: true,
    configurable: true,
  })
  const { createRoot } = await import("react-dom/client")
  const { act } = await import("react-dom/test-utils")
  const container = document.createElement("div")
  document.body.append(container)
  const root = createRoot(container)
  try {
    await act(async () =>
      root.render(<ControlledTransformRepro deferCommit={deferCommit} />),
    )
    const button = container.querySelector("button")!
    await act(async () => button.click())
    await act(async () => commitTransform())
    const svg = container.querySelector("svg")!
    const wheel = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: -100,
      clientX: 400,
      clientY: 300,
    })
    await act(async () => {
      svg.dispatchEvent(wheel)
    })
    await act(async () => commitTransform())
    await expect(svg.outerHTML).toMatchSvgSnapshot(
      import.meta.path,
      "controlled-transform-first-zoom",
    )
    const expectedBoardToPxTransform = compose(
      translate(wheel.pageX, wheel.pageY),
      scale(1.1, 1.1),
      translate(-wheel.pageX, -wheel.pageY),
      fittedBoardToPxTransform,
    )
    expect(
      svg.querySelector("[data-board-transform]")!.getAttribute("transform"),
    ).toBe(
      `matrix(${expectedBoardToPxTransform.a} ${expectedBoardToPxTransform.b} ${expectedBoardToPxTransform.c} ${expectedBoardToPxTransform.d} ${expectedBoardToPxTransform.e} ${expectedBoardToPxTransform.f})`,
    )
  } finally {
    await act(async () => root.unmount())
    GlobalRegistrator.unregister()
  }
})
