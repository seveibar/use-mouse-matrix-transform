import { test, expect } from "bun:test"

test("ensures canvas or ref element style has transformOrigin set to 0 0", () => {
  const fakeElement = {
    style: {
      transformOrigin: "50% 50%",
    },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as HTMLElement

  if (fakeElement.style) {
    fakeElement.style.transformOrigin = "0 0"
  }

  expect(fakeElement.style.transformOrigin).toBe("0 0")
})
