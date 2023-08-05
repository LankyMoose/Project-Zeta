import * as Cinnabun from "cinnabun"
import { For, Component } from "cinnabun"
import "./Carousel.css"

type CarouselImage = {
  src: string
  alt: string
}
type CarouselProps = {
  images: CarouselImage[]
}
export const Carousel = (props: CarouselProps) => {
  const totalItems = props.images.length
  const currentIndex = Cinnabun.createSignal(0)
  let carouselInner: HTMLElement

  function goToIndex(index: number) {
    if (index < 0 || index >= totalItems) {
      return
    }

    const translateX = -index * 100
    const currentImg = carouselInner.querySelectorAll("img")![index]!
    carouselInner.setAttribute(
      "style",
      `max-height: ${currentImg.clientHeight}px; transform: translateX(${translateX}%)`
    )
    currentIndex.value = index
  }

  function goToNext() {
    goToIndex(currentIndex.value + 1)
  }
  function goToPrev() {
    goToIndex(currentIndex.value - 1)
  }

  function onMounted(component: Component): void {
    carouselInner = component.element as HTMLDivElement
    // get the height of the shortest image
    let minHeight = Infinity
    const firstImg = carouselInner.querySelector("img")!
    firstImg.onload = () => {
      minHeight = firstImg.clientHeight
      carouselInner.setAttribute("style", `max-height: ${minHeight}px`)
    }
    document.addEventListener("resize", () => {
      minHeight = firstImg.clientHeight
      carouselInner.setAttribute("style", `max-height: ${minHeight}px`)
    })
  }

  return (
    <div className="carousel">
      <div className="carousel-inner" onMounted={onMounted}>
        <For
          each={props.images}
          template={(img: CarouselImage, i: number) => (
            <div className="carousel-item" key={i}>
              <img src={img.src} alt={img.alt} cross-origin="anonymous" />
            </div>
          )}
        />
      </div>
      <div className="carousel-controls">
        <button
          onclick={goToPrev}
          watch={currentIndex}
          bind:disabled={() => currentIndex.value === 0}
        >
          &lt;
        </button>
        <button
          onclick={goToNext}
          watch={currentIndex}
          bind:disabled={() => currentIndex.value === totalItems - 1}
        >
          &gt;
        </button>
      </div>
    </div>
  )
}
