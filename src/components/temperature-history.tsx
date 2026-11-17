import { useEffect, useMemo, useRef, useState } from "react";
import { type GalleryDay, temperatureSegments } from "../lib/gallery-history";

const spacing = 72;
export function TemperatureHistory({
	days,
	selectedIndex,
	onSelect,
}: {
	days: GalleryDay[];
	selectedIndex: number;
	onSelect: (index: number) => void;
}) {
	const scroller = useRef<HTMLElement>(null);
	const [width, setWidth] = useState(300);
	const segments = useMemo(() => temperatureSegments(days), [days]);
	const recordedIndices = useMemo(
		() => days.flatMap((day, index) => (day.selection ? [index] : [])),
		[days],
	);
	const temperatures = days.flatMap((day) =>
		day.selection ? [day.selection.conditions.temperature] : [],
	);
	const min = Math.floor(Math.min(...temperatures) - 2),
		max = Math.ceil(Math.max(...temperatures) + 2);
	const padding = Math.max(0, (width - spacing) / 2);
	const totalWidth = padding * 2 + days.length * spacing;
	const x = (index: number) => padding + spacing / 2 + index * spacing;
	const y = (temperature: number) =>
		90 - ((temperature - min) / (max - min)) * 64;

	useEffect(() => {
		const element = scroller.current;
		if (!element) return;
		const observer = new ResizeObserver(([entry]) =>
			setWidth(entry.contentRect.width),
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	useEffect(() => {
		if (scroller.current)
			scroller.current.scrollLeft = Math.max(0, totalWidth - width);
	}, [totalWidth, width]);

	return (
		<section
			className="transparent-glass temperature-history"
			aria-label="気温と日付の記録"
		>
			<div className="temperature-axis" aria-hidden="true">
				<span>℃</span>
				<span>{max}</span>
				<span>{min}</span>
			</div>
			<section
				ref={scroller}
				className="temperature-scroll"
				aria-label="横スクロールして日付を選択"
				// biome-ignore lint/a11y/noNoninteractiveTabindex: Scroll region needs keyboard focus.
				tabIndex={0}
				onScroll={(event) => {
					const position = event.currentTarget.scrollLeft / spacing;
					const index = recordedIndices.reduce(
						(nearest, candidate) =>
							Math.abs(candidate - position) < Math.abs(nearest - position)
								? candidate
								: nearest,
						recordedIndices[0],
					);
					if (index !== undefined) onSelect(index);
				}}
			>
				<div className="temperature-track" style={{ width: totalWidth }}>
					{recordedIndices.map((index) => (
						<span
							key={days[index].key}
							className="temperature-snap-point"
							style={{ left: x(index) - 0.5 }}
							aria-hidden="true"
						/>
					))}
					<svg
						width={totalWidth}
						height={140}
						role="img"
						aria-label="記録のない日は線が途切れる気温グラフ"
					>
						{[26, 58, 90].map((position) => (
							<line
								key={position}
								x1={0}
								y1={position}
								x2={totalWidth}
								y2={position}
								stroke="currentColor"
								opacity={0.12}
								strokeDasharray="3 5"
							/>
						))}
						{segments.map((segment) => (
							<polyline
								key={segment[0].index}
								points={segment
									.map((point) => `${x(point.index)},${y(point.temperature)}`)
									.join(" ")}
								fill="none"
								stroke="#f0f8ff"
								strokeWidth={2}
								strokeLinejoin="round"
							/>
						))}
						{days.map((day, index) => (
							<g key={day.key}>
								{day.selection && (
									<circle
										cx={x(index)}
										cy={y(day.selection.conditions.temperature)}
										r={index === selectedIndex ? 5.5 : 3.5}
										fill={index === selectedIndex ? "#fff4b9" : "#e6f3ff"}
										stroke="#fff"
										strokeWidth={index === selectedIndex ? 2 : 0}
									/>
								)}
								{index === selectedIndex && (
									<rect
										x={x(index) - 25}
										y={109}
										width={50}
										height={23}
										rx={11.5}
										fill="#fff"
									/>
								)}
								<text
									x={x(index)}
									y={125}
									textAnchor="middle"
									fill={index === selectedIndex ? "#12376f" : "#eff7ff"}
									fontSize={11}
									fontFamily="inherit"
								>
									{day.date.getMonth() + 1}/{day.date.getDate()}
								</text>
							</g>
						))}
					</svg>
				</div>
			</section>
			<span className="temperature-center-marker" aria-hidden="true" />
		</section>
	);
}
