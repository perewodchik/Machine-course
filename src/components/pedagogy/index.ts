// Компоненты, которые сайт передаёт в MDX урока (<Content components={lessonComponents} />): в MDX импортов нет.
import Block from "./Block.astro";
import Derivation from "./Derivation.astro";
import Diagnostic from "./Diagnostic.astro";
import Exercise from "./Exercise.astro";
import ExerciseSet from "./ExerciseSet.astro";
import Formula from "./Formula.astro";
import Note from "./Note.astro";
import Prereqs from "./Prereqs.astro";
import Pilot from "./Pilot.astro";
import SymbolLegend from "./SymbolLegend.astro";
import FitLine from "../widgets/FitLine.astro";
import GridMap from "../widgets/GridMap.astro";
import BayesGrid from "../widgets/BayesGrid.astro";
import Riemann from "../widgets/Riemann.astro";
import MatmulViews from "../widgets/MatmulViews.astro";
import NormBalls from "../widgets/NormBalls.astro";
import Projection from "../widgets/Projection.astro";
import Span from "../widgets/Span.astro";
import OpenIn from "../python/OpenIn.astro";
import PyCell from "../python/PyCell.astro";
import PyCode from "../python/PyCode.astro";

// виджеты — обёртки .astro с островами React
export const lessonComponents = { Block, Derivation, Diagnostic, Exercise, ExerciseSet, Formula, Note, Pilot, Prereqs, SymbolLegend, FitLine, GridMap, BayesGrid, Riemann, Span, NormBalls, Projection, MatmulViews, PyCode, PyCell, OpenIn };
export { BayesGrid, Block, Derivation, Diagnostic, Exercise, ExerciseSet, FitLine, Formula, GridMap, MatmulViews, Note, NormBalls, Pilot, OpenIn, Prereqs, Projection, PyCell, PyCode, Riemann, Span, SymbolLegend };
