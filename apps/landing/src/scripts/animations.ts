import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"
import Lenis from "lenis"

gsap.registerPlugin(ScrollTrigger, SplitText)

const root = document.documentElement
const EASE = "expo.out"

const TIMELINE_DURATION = 634

const $ = <T extends Element = HTMLElement>(
  selector: string,
  scope: ParentNode = document
) => scope.querySelector<T>(selector)
const $$ = <T extends Element = HTMLElement>(
  selector: string,
  scope: ParentNode = document
) => Array.from(scope.querySelectorAll<T>(selector))

function formatTime(seconds: number) {
  const whole = Math.round(seconds)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`
}

function formatCount(value: number, format: string | undefined) {
  if (format === "k") {
    if (value < 1000) return String(Math.round(value))
    return `${(value / 1000).toFixed(value >= 9950 ? 0 : 1)}K`
  }
  return String(Math.round(value))
}

function countUp(element: HTMLElement, duration = 1.6) {
  const target = Number(element.dataset.count ?? element.dataset.mockCount)
  const suffix = element.dataset.suffix ?? ""
  const counter = { value: 0 }
  return gsap.to(counter, {
    value: target,
    duration,
    ease: "power2.out",
    onUpdate: () => {
      element.textContent =
        formatCount(counter.value, element.dataset.format) + suffix
    },
  })
}

function setupSmoothScroll() {
  const lenis = new Lenis({ lerp: 0.09, anchors: { offset: 0 } })
  lenis.on("scroll", ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  return lenis
}

function playIntro(lenis: Lenis) {
  const preloader = $("[data-preloader]")
  const timeline = gsap.timeline()
  if (!preloader || root.classList.contains("intro-seen")) {
    preloader?.remove()
    return timeline
  }

  lenis.stop()
  const count = $("[data-preloader-count]", preloader)
  const counter = { value: 0 }

  gsap.set($$("[data-signet-ring]", preloader), {
    strokeDasharray: "100 100",
    strokeDashoffset: 100,
  })

  timeline
    .to(
      "[data-preloader] [data-signet-ring]",
      { strokeDashoffset: 0, duration: 1.4, ease: "power3.inOut" },
      0
    )
    .from(
      "[data-preloader] [data-signet-top]",
      { y: -70, opacity: 0, duration: 1.1, ease: EASE },
      0.35
    )
    .from(
      "[data-preloader] [data-signet-bottom]",
      { y: 70, opacity: 0, duration: 1.1, ease: EASE },
      0.45
    )
    .to(
      counter,
      {
        value: 100,
        duration: 1.7,
        ease: "power2.inOut",
        onUpdate: () => {
          if (count)
            count.textContent = String(Math.round(counter.value)).padStart(
              2,
              "0"
            )
        },
      },
      0
    )
    .to(
      "[data-preloader-bar]",
      { scaleX: 1, duration: 1.7, ease: "power2.inOut" },
      0
    )
    .to(
      "[data-preloader] .preloader__mark",
      { scale: 0.85, opacity: 0, duration: 0.6, ease: "power2.in" },
      ">"
    )
    .to(
      preloader,
      { yPercent: -100, duration: 1.1, ease: "expo.inOut" },
      "<0.2"
    )
    .add(() => {
      preloader.remove()
      lenis.start()
      try {
        sessionStorage.setItem("os-intro", "1")
      } catch {
        // Storage can be blocked; the intro then plays on every visit
      }
    })

  return timeline
}

function animateHero(intro: gsap.core.Timeline) {
  const title = $("[data-reveal='hero-title']")
  const stage = $("[data-hero-stage]")
  const window_ = $("[data-hero-window]")
  if (!title || !stage || !window_) return

  const split = SplitText.create(title, {
    type: "lines",
    mask: "lines",
    linesClass: "split-line",
  })
  gsap.set(title, { autoAlpha: 1 })

  const timeline = gsap.timeline()
  timeline
    .from(split.lines, {
      yPercent: 110,
      duration: 1.3,
      ease: EASE,
      stagger: 0.09,
    })
    .fromTo(
      "[data-reveal='hero']",
      { autoAlpha: 0, y: 28 },
      { autoAlpha: 1, y: 0, duration: 1.1, ease: EASE, stagger: 0.08 },
      0.3
    )
    .fromTo(
      stage,
      { autoAlpha: 0, y: 140 },
      { autoAlpha: 1, y: 0, duration: 1.6, ease: EASE },
      0.45
    )
    .from(
      "[data-mock-bar]",
      { scaleY: 0, duration: 1.2, ease: EASE, stagger: 0.02 },
      0.9
    )
    .from(
      "[data-mock-share]",
      { scaleX: 0, duration: 1.2, ease: EASE, stagger: 0.06 },
      1.1
    )
    .add(() => {
      $$("[data-mock-count]", stage).forEach((count) => countUp(count, 1.6))
    }, 0.9)
    .from(
      "[data-hero-player]",
      {
        autoAlpha: 0,
        yPercent: 30,
        scale: 0.9,
        duration: 1.4,
        ease: EASE,
        transformOrigin: "100% 100%",
      },
      1.05
    )
    .fromTo(
      "[data-timeline]",
      { y: 100, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 1, ease: EASE },
      1.1
    )

  intro.add(timeline, intro.duration() > 0 ? "-=0.55" : 0)
  animatePlayer()

  gsap.fromTo(
    window_,
    { rotationX: 16, scale: 0.9 },
    {
      rotationX: 0,
      scale: 1,
      ease: "none",
      scrollTrigger: {
        trigger: stage,
        start: "top 85%",
        end: "top 15%",
        scrub: 1,
      },
    }
  )

  for (const float of $$("[data-speed]", stage)) {
    const speed = Number(float.dataset.speed)
    gsap.to(float, {
      y: () => (1 - speed) * 400,
      ease: "none",
      scrollTrigger: {
        trigger: stage,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    })
  }
}

function animatePlayer() {
  const video = $<HTMLVideoElement>("[data-hero-video]")
  const menu = $("[data-player-menu]")
  const played = $("[data-player-played]")
  const buffer = $("[data-player-buffer]")
  const time = $("[data-player-time]")
  if (!video) return

  const offset = 194
  const total = 634
  const update = () => {
    const position = offset + video.currentTime
    gsap.set(played, { scaleX: position / total })
    gsap.set(buffer, { scaleX: Math.min(1, (position + 60) / total) })
    if (time) time.textContent = formatTime(position)
    video.requestVideoFrameCallback?.(update)
  }
  if ("requestVideoFrameCallback" in video) {
    video.requestVideoFrameCallback(update)
  } else {
    gsap.ticker.add(update)
  }

  if (menu) {
    const show = () =>
      gsap
        .timeline()
        .fromTo(
          menu,
          { autoAlpha: 0, scale: 0.9, y: 8 },
          { autoAlpha: 1, scale: 1, y: 0, duration: 0.5, ease: EASE }
        )
        .to(menu, { autoAlpha: 0, scale: 0.95, duration: 0.3, delay: 2.6 })
    gsap.delayedCall(2.6, show)
    video.addEventListener("seeked", () => {
      if (video.currentTime < 1) gsap.delayedCall(3, show)
    })
  }
}

function animateLines() {
  for (const element of $$("[data-reveal='lines']")) {
    SplitText.create(element, {
      type: "lines",
      mask: "lines",
      linesClass: "split-line",
      autoSplit: true,
      onSplit: (self) => {
        gsap.set(element, { autoAlpha: 1 })
        return gsap.from(self.lines, {
          yPercent: 110,
          duration: 1.2,
          ease: EASE,
          stagger: 0.08,
          scrollTrigger: { trigger: element, start: "top 88%", once: true },
        })
      },
    })
  }
}

function animateFades() {
  ScrollTrigger.batch("[data-reveal='fade']", {
    start: "top 92%",
    once: true,
    onEnter: (elements) =>
      gsap.fromTo(
        elements,
        { autoAlpha: 0, y: 36 },
        { autoAlpha: 1, y: 0, duration: 1.1, ease: EASE, stagger: 0.07 }
      ),
  })

  ScrollTrigger.batch("[data-reveal='card']", {
    start: "top 90%",
    once: true,
    onEnter: (elements) =>
      gsap.fromTo(
        elements,
        { autoAlpha: 0, y: 90, rotation: 2, transformOrigin: "0% 100%" },
        {
          autoAlpha: 1,
          y: 0,
          rotation: 0,
          duration: 1.3,
          ease: EASE,
          stagger: 0.1,
        }
      ),
  })

  for (const element of $$("[data-count]")) {
    if (element.closest("[data-panel], [data-hero-stage]")) continue
    ScrollTrigger.create({
      trigger: element,
      start: "top 92%",
      once: true,
      onEnter: () => countUp(element),
    })
  }
}

function animateMarquee() {
  const rows = $$("[data-marquee]")
  if (rows.length === 0) return

  const tweens = rows.map((row) =>
    Number(row.dataset.marquee) < 0
      ? gsap.fromTo(
          row,
          { xPercent: 0 },
          { xPercent: -50, duration: 40, ease: "none", repeat: -1 }
        )
      : gsap.fromTo(
          row,
          { xPercent: -50 },
          { xPercent: 0, duration: 40, ease: "none", repeat: -1 }
        )
  )

  ScrollTrigger.create({
    trigger: rows[0].parentElement,
    start: "top bottom",
    end: "bottom top",
    onUpdate: (self) => {
      const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 250, 10)
      gsap
        .timeline({ overwrite: true })
        .to(tweens, { timeScale: boost, duration: 0.2 })
        .to(tweens, { timeScale: 1, duration: 1.2, ease: "power2.out" })
    },
  })

  gsap.fromTo(
    rows,
    { skewX: 0 },
    {
      skewX: (index) => (index === 0 ? -6 : 6),
      ease: "none",
      scrollTrigger: {
        trigger: rows[0].parentElement,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
      },
    }
  )
}

function animateStatement() {
  const statement = $("[data-statement]")
  if (!statement) return

  SplitText.create(statement, {
    type: "words",
    wordsClass: "word",
    autoSplit: true,
    onSplit: (self) =>
      gsap.to(self.words, {
        opacity: 1,
        stagger: 0.1,
        ease: "none",
        scrollTrigger: {
          trigger: statement,
          start: "top 80%",
          end: "bottom 50%",
          scrub: true,
        },
      }),
  })
}

function animatePanel(panel: HTMLElement, trigger: ScrollTrigger.Vars) {
  const timeline = gsap.timeline({ scrollTrigger: { ...trigger, once: true } })

  const chunks = $$("[data-chunk]", panel)
  if (chunks.length > 0) {
    const percent = $("[data-upload-percent]", panel)
    const progress = { value: 0 }
    timeline.to(progress, {
      value: 100,
      duration: 2.2,
      ease: "power1.inOut",
      onUpdate: () => {
        const done = Math.round((progress.value / 100) * chunks.length)
        chunks.forEach((chunk, index) =>
          chunk.classList.toggle("is-done", index < done)
        )
        if (percent) percent.textContent = String(Math.round(progress.value))
      },
    })
  }

  const fills = $$("[data-ladder-fill]", panel)
  if (fills.length > 0) {
    timeline
      .from(fills, {
        scaleX: 0,
        duration: 1.4,
        ease: "power3.inOut",
        stagger: 0.18,
      })
      .from(
        $$("[data-frame]", panel),
        { autoAlpha: 0, y: 14, duration: 0.6, ease: EASE, stagger: 0.06 },
        "-=0.6"
      )
  }

  const progress = $("[data-player-progress]", panel)
  if (progress) {
    timeline
      .from(progress, { scaleX: 0, duration: 2, ease: "power2.out" })
      .from(
        $$("[data-site]", panel),
        { autoAlpha: 0, x: -24, duration: 0.8, ease: EASE, stagger: 0.12 },
        0.2
      )
      .to(
        ".is-blocked",
        { x: 6, duration: 0.07, repeat: 5, yoyo: true, ease: "none" },
        ">"
      )
  }

  const cueWords = $$("[data-cue-word]", panel)
  if (cueWords.length > 0) {
    timeline
      .from(cueWords, {
        autoAlpha: 0,
        duration: 0.2,
        ease: "none",
        stagger: 0.09,
      })
      .from(
        $$("[data-chapter]", panel),
        { autoAlpha: 0, x: -24, duration: 0.7, ease: EASE, stagger: 0.14 },
        "-=0.3"
      )
  }

  const bars = $$("[data-bar]", panel)
  if (bars.length > 0) {
    timeline.from(bars, { scaleY: 0, duration: 1, ease: EASE, stagger: 0.025 })
    for (const count of $$("[data-count]", panel)) {
      timeline.add(countUp(count, 1.4), 0)
    }
  }
}

function animatePipeline() {
  const section = $("[data-pipeline]")
  const track = $("[data-pipeline-track]")
  const sticky = $(".pipeline__sticky")
  const current = $("[data-pipeline-current]")
  if (!section || !track || !sticky) return

  const panels = $$("[data-panel]", track)
  const mm = gsap.matchMedia()
  let active = 0
  let counter: gsap.core.Timeline | undefined

  const setActive = (index: number) => {
    if (!current || index === active) return
    const direction = index > active ? 1 : -1
    active = index
    counter?.kill()
    counter = gsap
      .timeline()
      .to(current, {
        yPercent: -100 * direction,
        duration: 0.25,
        ease: "power2.in",
      })
      .add(() => {
        current.textContent = String(index + 1).padStart(2, "0")
      })
      .fromTo(
        current,
        { yPercent: 100 * direction },
        { yPercent: 0, duration: 0.45, ease: EASE, immediateRender: false }
      )
  }

  mm.add("(min-width: 901px)", () => {
    const distance = () => track.scrollWidth - root.clientWidth
    const scroll = gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: sticky,
        pin: true,
        start: "top top",
        end: () => `+=${distance()}`,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    })

    panels.forEach((panel, index) => {
      animatePanel(panel, {
        trigger: panel,
        containerAnimation: scroll,
        start: "left 70%",
      })
      ScrollTrigger.create({
        trigger: panel,
        containerAnimation: scroll,
        start: "left 55%",
        end: "right 55%",
        onToggle: (self) => {
          if (self.isActive) setActive(index)
        },
      })
      // Panels lean in as they slide past
      gsap.fromTo(
        panel,
        { rotationY: -10, scale: 0.94, transformPerspective: 1600 },
        {
          rotationY: 0,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: panel,
            containerAnimation: scroll,
            start: "left right",
            end: "left 40%",
            scrub: true,
          },
        }
      )
    })
  })

  mm.add("(max-width: 900px)", () => {
    for (const panel of panels) {
      animatePanel(panel, { trigger: panel, start: "top 70%" })
    }
  })
}

function animateMedia() {
  for (const media of $$("[data-media-reveal]")) {
    const image = $("img", media)
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: media,
        start: "top 95%",
        end: "top 30%",
        scrub: 1,
      },
    })
    timeline
      .fromTo(
        media,
        { clipPath: "inset(16% 12% 16% 12% round 22px)" },
        { clipPath: "inset(0% 0% 0% 0% round 22px)", ease: "none" }
      )
      .fromTo(
        image,
        { scale: 1.3, yPercent: 6 },
        { scale: 1, yPercent: 0, ease: "none" },
        0
      )
  }
}

function animateTerminal() {
  const terminal = $("[data-terminal]")
  const cursor = $("[data-terminal-cursor]")
  if (!terminal || !cursor) return

  const lines = $$("[data-terminal-line]", terminal)
  const typed = lines.map((line) => {
    const element = $("[data-typed]", line)!
    return {
      line,
      element,
      text: element.textContent ?? "",
      comment: $(".terminal__comment", line),
    }
  })

  gsap.set(lines, { display: "none" })
  const timeline = gsap.timeline({ paused: true })

  for (const { line, element, text, comment } of typed) {
    const progress = { chars: 0 }
    timeline
      .add(() => {
        element.textContent = ""
        gsap.set(line, { display: "inline" })
        element.after(cursor)
      })
      .to(progress, {
        chars: text.length,
        duration: text.length * 0.028,
        ease: "none",
        onUpdate: () => {
          element.textContent = text.slice(0, Math.round(progress.chars))
        },
      })
    if (comment) timeline.from(comment, { autoAlpha: 0, duration: 0.25 })
    timeline.add(() => {}, "+=0.18")
  }
  timeline.add(() => {
    $("code", terminal)?.append(cursor)
  })

  ScrollTrigger.create({
    trigger: terminal,
    start: "top 75%",
    once: true,
    onEnter: () => timeline.play(),
  })
}

function animateWordmark() {
  const wordmark = $("[data-wordmark]")
  const text = wordmark && $("span", wordmark)
  if (!wordmark || !text) return

  const split = SplitText.create(text, { type: "chars", charsClass: "char" })
  const trigger = {
    trigger: wordmark,
    start: "top bottom",
    end: "bottom 85%",
    scrub: 1,
  }
  gsap.from(split.chars, {
    yPercent: 110,
    rotation: 8,
    opacity: 0,
    stagger: 0.05,
    ease: "power3.out",
    scrollTrigger: trigger,
  })
  gsap
    .timeline({ scrollTrigger: trigger })
    .from(
      $("[data-signet-top]", wordmark),
      { y: -120, opacity: 0, ease: "power3.out" },
      0
    )
    .from(
      $("[data-signet-bottom]", wordmark),
      { y: 120, opacity: 0, ease: "power3.out" },
      0
    )
    .from(
      $("[data-signet-ring]", wordmark),
      { scale: 0.6, opacity: 0, transformOrigin: "50% 50%" },
      0
    )
}

function setupHeader() {
  const header = $("[data-header]")
  if (!header) return
  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      const scroll = self.scroll()
      header.classList.toggle("is-scrolled", scroll > 40)
      header.classList.toggle("is-hidden", self.direction === 1 && scroll > 300)
    },
  })
}

function setupTimeline() {
  const timeline = $("[data-timeline]")
  if (!timeline) return
  const progress = $("[data-timeline-progress]", timeline)
  const buffer = $("[data-timeline-buffer]", timeline)
  const time = $("[data-timeline-time]", timeline)

  ScrollTrigger.create({
    trigger: ".footer__bottom",
    start: "top bottom",
    onToggle: (self) =>
      gsap.to(timeline, {
        y: self.isActive ? 120 : 0,
        duration: 0.6,
        ease: EASE,
        overwrite: "auto",
      }),
  })

  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      gsap.set(progress, { scaleX: self.progress })
      gsap.to(buffer, {
        scaleX: Math.min(1, self.progress + 0.14),
        duration: 0.6,
        overwrite: true,
      })
      if (time) time.textContent = formatTime(self.progress * TIMELINE_DURATION)
    },
  })

  const placeChapters = () => {
    const max = ScrollTrigger.maxScroll(window) || 1
    for (const chapter of $$("[data-timeline-chapter]", timeline)) {
      const section = document.getElementById(
        chapter.dataset.timelineChapter ?? ""
      )
      if (!section) continue
      const top = section.getBoundingClientRect().top + window.scrollY
      chapter.style.left = `${Math.min(100, (top / max) * 100)}%`
    }
  }
  ScrollTrigger.addEventListener("refresh", placeChapters)
  placeChapters()
}

function setupPointerEffects() {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return

  for (const element of $$("[data-magnetic]")) {
    const toX = gsap.quickTo(element, "x", {
      duration: 0.6,
      ease: "power3.out",
    })
    const toY = gsap.quickTo(element, "y", {
      duration: 0.6,
      ease: "power3.out",
    })
    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect()
      toX((event.clientX - rect.left - rect.width / 2) * 0.3)
      toY((event.clientY - rect.top - rect.height / 2) * 0.3)
    })
    element.addEventListener("pointerleave", () => {
      toX(0)
      toY(0)
    })
  }

  for (const card of $$("[data-spotlight]")) {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect()
      card.style.setProperty("--x", `${event.clientX - rect.left}px`)
      card.style.setProperty("--y", `${event.clientY - rect.top}px`)
    })
  }
}

function setupFaq() {
  for (const item of $$("[data-faq]")) {
    const button = $("button", item)
    button?.addEventListener("click", () => {
      const open = item.classList.toggle("is-open")
      button.setAttribute("aria-expanded", String(open))
      gsap.delayedCall(0.65, () => ScrollTrigger.refresh())
    })
  }
}

function setupCopy() {
  for (const button of $$<HTMLButtonElement>("[data-copy]")) {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy ?? "")
        button.textContent = "Copied"
      } catch {
        button.textContent = "Press ⌘C"
      }
      gsap.delayedCall(2, () => {
        button.textContent = "Copy"
      })
    })
  }
}

async function init() {
  setupFaq()
  setupCopy()

  await document.fonts.ready

  const mm = gsap.matchMedia()

  mm.add("(prefers-reduced-motion: reduce)", () => {
    gsap.set("[data-reveal], [data-timeline]", { autoAlpha: 1 })
    $("[data-preloader]")?.remove()
    setupTimeline()
  })

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const lenis = setupSmoothScroll()
    const intro = playIntro(lenis)

    animateHero(intro)
    animateLines()
    animateFades()
    animateMarquee()
    animateStatement()
    animatePipeline()
    animateMedia()
    animateTerminal()
    animateWordmark()
    setupHeader()
    setupTimeline()
    setupPointerEffects()

    return () => lenis.destroy()
  })
}

init()
