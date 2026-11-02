import { useState } from "react"
import { compose, scale, translate, type Matrix } from "transformation-matrix"
import useMouseMatrixTransform from "../index"

export const initialBoardToPxTransform = compose(
  translate(400, 300),
  scale(18, -18),
)
export const fittedBoardToPxTransform = compose(
  translate(400, 300),
  scale(24, -24),
)

export function ControlledTransformRepro({
  deferCommit,
}: {
  deferCommit: (commit: () => void) => void
}) {
  const [boardToPxTransform, setBoardToPxTransform] = useState<Matrix>(
    initialBoardToPxTransform,
  )
  const { ref, setTransform } = useMouseMatrixTransform({
    transform: boardToPxTransform,
    onSetTransform: (nextBoardToPxTransform) =>
      deferCommit(() => setBoardToPxTransform(nextBoardToPxTransform)),
  })

  return (
    <main>
      <p>
        Fit the board, then zoom or drag. The first gesture should keep the
        fitted view.
      </p>
      <button onClick={() => setTransform(fittedBoardToPxTransform)}>
        Fit board
      </button>
      <div ref={ref} style={{ width: 800, height: 600 }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
          <title>Controlled PCB camera</title>
          <rect width="800" height="600" fill="#111" />
          <g
            data-board-transform
            transform={`matrix(${boardToPxTransform.a} ${boardToPxTransform.b} ${boardToPxTransform.c} ${boardToPxTransform.d} ${boardToPxTransform.e} ${boardToPxTransform.f})`}
          >
            <rect
              x="-12"
              y="-7"
              width="24"
              height="14"
              rx="1"
              fill="#0c3721"
              stroke="#aaa"
              strokeWidth="0.1"
            />
            <path d="M -4 0 H 4" stroke="#c83434" strokeWidth="0.4" />
            <rect x="-5" y="-1" width="2" height="2" fill="#c83434" />
            <rect x="3" y="-1" width="2" height="2" fill="#c83434" />
            <circle cx="-9" cy="4" r="1" fill="#d6b245" />
            <circle cx="9" cy="-4" r="1" fill="#d6b245" />
          </g>
        </svg>
      </div>
    </main>
  )
}

export default function ControlledTransformPage() {
  return (
    <ControlledTransformRepro
      deferCommit={(commit) => requestAnimationFrame(commit)}
    />
  )
}
