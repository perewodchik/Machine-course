// Набор для рисунков виджетов: свой SVG-слой на d3-scale. Виджеты импортируют только отсюда.
export { Axis } from "./Axis";
export { Ellipse, covAxes } from "./Ellipse";
export { Line } from "./Line";
export { MathText } from "./MathText";
export { ParamSlider } from "./ParamSlider";
export { Plane } from "./Plane";
export { Point } from "./Point";
export { Readout } from "./Readout";
export { Scrub } from "./Scrub";
export { Vector } from "./Vector";
export { useLiveText, useLit, useWidth } from "./hooks";
export { clipLine, clipSegment, labelAnchor, type Box, type Pt } from "./clip";
export { fmt, labelParts, plainLabel } from "./format";
export { planeLayout, niceStep, ticks, type PlaneLayout, type PlaneOptions } from "./layout";
export { dragValue, keyValue, snap, type StepOptions } from "./scrub";
export { roleClass, type Role } from "./roles";
