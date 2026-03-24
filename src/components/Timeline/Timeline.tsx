import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, FreeMode } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";

import "./Timeline.scss";

import { timelineData } from "../../data/timelineData";

import type { Swiper as SwiperType } from "swiper"

const Timeline: React.FC = () => {

	/* --- state --- */
	const [radius, setRadius] = useState(0) // радиус круга
	const [activeIndex, setActiveIndex] = useState(0) // текущий активный элемент
	const [isMounted, setIsMounted] = useState(false) // монитрование(для первого рендера)
	const [isAnimated, setIsAnimated] = useState(false) // анимация вращения
	const [isReady, setIsReady] = useState(false) // расчет размеров для радиуса круга
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 576)

	/* --- refs --- */
	const circleRef = useRef<HTMLDivElement>(null) 
	const swiperRef = useRef<SwiperType | null>(null)
	const resizeTimeout = useRef<number | null>(null)

	/* --- data --- */
	const pointCount = timelineData.length
	const activeItem = timelineData[activeIndex]

	/* --- rotation --- */
	const targetAngle = 300 // угол куда направлена активная точка
	const anglePerPoint = 360 / pointCount // угол между всеми точками
	const activeAngle = activeIndex * anglePerPoint // угол активной точки
	const rotation = targetAngle - activeAngle // итоговый поворот круга

	// флаги для кнопок под кругом
	const isFirst = activeIndex === 0
	const isLast = activeIndex === pointCount - 1

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth <= 576)
		}
		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	})

	// считывание радиуса круга, resize + debounce
	useEffect(() => {
		const updateRadius = () => {
			if(!circleRef.current) return

			const rect = circleRef.current.offsetWidth
			setRadius(rect / 2)
		}

		const handleResize = () => {
			if(resizeTimeout.current) {
				clearTimeout(resizeTimeout.current)
			}

			resizeTimeout.current = window.setTimeout(() => {
				updateRadius()
			}, 100)
		}
		
		updateRadius()
		window.addEventListener('resize', handleResize)
		
		return () => {
			window.removeEventListener('resize', handleResize)

			if(resizeTimeout.current) {
				clearTimeout(resizeTimeout.current)
			}
		}
	}, [])

	// готовность компонента для радиуса
	useEffect(() => {
		if(radius > 0) {
			setIsReady(true)
		}
	}, [radius])
	
	// управление анимацией при первом рендере\смене activeIndex
	useLayoutEffect(() => {
		if(!circleRef.current || !isReady) return

		// первый рендер - без анимки
		if(!isMounted) {
			setIsMounted(true)
			return
		}

		// смена activeIndex - анимка
		setIsAnimated(true)
	}, [activeIndex, pointCount, isReady])

	// отслеживание конца анимации
	useEffect(() => {
		const el = circleRef.current
		if(!el) return

		const handleTransitionEnd = (e: TransitionEvent) => {
			if(e.propertyName === 'transform') {
				setIsAnimated(false)
			}
		}

		el.addEventListener('transitionend', handleTransitionEnd)

		return () => {
			el.removeEventListener('transitionend', handleTransitionEnd)
		}
	}, [])
	
	// расчет координат точек на круге
	const points = useMemo(() => {
		if(!radius) return []

		return timelineData.map((_, i) => {
			// угол точки в радианах
			const angle = (i / pointCount) * Math.PI * 2

			// позиция по окружности
			const x = Math.cos(angle) * radius
			const y = Math.sin(angle) * radius

			return { x, y }
		})
	}, [radius, pointCount])

	// кнопки управления кругом
	const handlePrev = () => {
		if(isFirst) return

		const newIndex = activeIndex -1
		setActiveIndex(newIndex)
		swiperRef.current?.slideTo(0)
	}

	const handleNext = () => {
		if(isLast) return

		const newIndex = activeIndex + 1
		setActiveIndex(newIndex)
		swiperRef.current?.slideTo(0)
	}

	// диапазон годов
	const { minYear, maxYear } = useMemo(() => {
		const years = activeItem.events.map(e => e.year)
		return {
			minYear: Math.min(...years),
			maxYear: Math.max(...years)
		}
	}, [activeItem])

	// анимация диапозона готов
	const [displayMin, setDisplayMin] = useState(minYear)
	const [displayMax, setDisplayMax] = useState(maxYear)

	// анимация чисел
	useEffect(() => {
		let start: number | null = null
		let frameId: number | null = null

		const duration = 1000

		const startMin = displayMin
		const startMax = displayMax

		const diffMin = minYear - startMin
		const diffMax = maxYear - startMax

		const animate = (timestamp: number) => {
			if(!start) start = timestamp
			const progress = Math.min((timestamp - start) / duration, 1)

			const ease = 0.5 * (1 - Math.cos(Math.PI * progress))

			setDisplayMin(Math.round(startMin + diffMin * ease))
			setDisplayMax(Math.round(startMax + diffMax * ease))

			if(progress < 1) {
				frameId = requestAnimationFrame(animate)
			}
		}

		frameId = requestAnimationFrame(animate)

		return () => {
			if(frameId !== null) {
				cancelAnimationFrame(frameId)
			}
		}
	}, [minYear, maxYear])

	// сортировка событий
	const sortedEvents = useMemo(() => {
		return [...activeItem.events].sort((a, b) => a.year - b.year)
	}, [activeItem])

    return (
        <section className="timeline">
            <h2 className="timeline__head">Исторические даты</h2>
            <div className="timeline__container">

                <div className="timeline__content">

					<div className="timeline__content_years">
						<span className="timeline__year_min">{displayMin}</span>
						<span className="timeline__year_max">{displayMax}</span>
					</div>

					{!isMobile && 
						<div 
							className="timeline__content_circle"
							ref={circleRef}
							style={{ 
								transform: isReady ? `rotate(${rotation}deg)` : 'none',
								transition: isMounted  ? 'transform 1.5s' : 'none', 
								opacity: isReady ? 1 : 0
							}}
						>
							{isReady && points.map((pos, i) => (
								<div
									key={i} 
									className={`timeline__circle_dot ${activeIndex === i ? 'active': ''} ${isAnimated ? 'hidden' : ''}`}
									style={{transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) rotate(${-rotation}deg)`}}
									onClick={() => setActiveIndex(i)}
								>
									<span className="timeline__circle_num">{timelineData[i]?.id}</span>
									<span className="timeline__circle_title">{timelineData[i]?.title}</span>
								</div>
							))}
						</div>
					}
					
					<div className="timeline__swiper_controls">
						<span className="timeline__counter">
							{String(activeIndex + 1).padStart(2, '0')}/{String(timelineData.length).padStart(2, '0')}
						</span>
						<button 
							className={`timeline__controls_btn prev ${isFirst ? 'disabled' : ''}`}
							onClick={handlePrev}
						>
							<svg width="9" height="14" viewBox="0 0 9 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.66418 0.707108L1.41419 6.95711L7.66418 13.2071" stroke="#42567A" strokeWidth="2"/></svg>
						</button>
						<button 
							className={`timeline__controls_btn next ${isLast ? 'disabled' : ''}`}
							onClick={handleNext}
						>
							<svg width="9" height="14" viewBox="0 0 9 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.66418 0.707108L1.41419 6.95711L7.66418 13.2071" stroke="#42567A" strokeWidth="2"/></svg>
						</button>
					</div>
				</div> {/* /.timeline__content */}

				<div className="timeline__swiper">
					<Swiper
						spaceBetween={0}
						slidesPerView={1.5}
						modules={[ Navigation, FreeMode ]}
						navigation={!isMobile}
						freeMode
						onSwiper={(swiper) => {
							swiperRef.current = swiper
						}}
						breakpoints={{
							768: {
								slidesPerView: 2,
							},
							1280: {
								slidesPerView: 3
							}
						}}
					>
						{sortedEvents.map((event, i) => (
								<SwiperSlide key={i}>
									<div className="slide-inner">
										<div className="timeline__event" key={activeIndex}>
											<div className="timeline__event_year">{event.year}</div>
											<div className="timeline__event_text">{event.text}</div>
										</div>
									</div>
								</SwiperSlide>
							))
						}
					</Swiper>
					{isMobile && (
						<div className="timeline__swiper_pagination">
							{timelineData.map((item, i) => (
								<span
									key={item.id}
									className={`dot ${activeIndex === i ? 'active' : ''}`}
									onClick={() => {
										swiperRef.current?.slideTo(i)
										setActiveIndex(i)
									}}
								></span>
							))}
						</div>
					)}
				</div> {/* /.timeline__swiper */}
            </div> {/* /.timeline__container */}
        </section> /* /.timeline */
    );
};

export default Timeline;
