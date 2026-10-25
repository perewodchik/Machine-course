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
import CompGraph from "../widgets/CompGraph.astro";
import Chord from "../widgets/Chord.astro";
import Newton from "../widgets/Newton.astro";
import Lagrange from "../widgets/Lagrange.astro";
import Kkt from "../widgets/Kkt.astro";
import GradientField from "../widgets/GradientField.astro";
import LevelSets from "../widgets/LevelSets.astro";
import LowRank from "../widgets/LowRank.astro";
import MatmulViews from "../widgets/MatmulViews.astro";
import NormBalls from "../widgets/NormBalls.astro";
import PlaneProjection from "../widgets/PlaneProjection.astro";
import Projection from "../widgets/Projection.astro";
import Span from "../widgets/Span.astro";
import SvdSteps from "../widgets/SvdSteps.astro";
import SystemLines from "../widgets/SystemLines.astro";
import OpenIn from "../python/OpenIn.astro";
import PyCell from "../python/PyCell.astro";
import PyCode from "../python/PyCode.astro";

// виджеты — обёртки .astro с островами React
export const lessonComponents = { Block, Derivation, Diagnostic, Exercise, ExerciseSet, Formula, Note, Pilot, Prereqs, SymbolLegend, FitLine, GridMap, BayesGrid, Riemann, Span, NormBalls, Projection, MatmulViews, SystemLines, PlaneProjection, LevelSets, SvdSteps, LowRank, GradientField, CompGraph, Chord, Newton, Lagrange, Kkt, PyCode, PyCell, OpenIn };
export { BayesGrid, Block, Chord, CompGraph, Derivation, Diagnostic, Exercise, ExerciseSet, FitLine, Formula, GradientField, GridMap, Kkt, Lagrange, LevelSets, LowRank, MatmulViews, Newton, Note, NormBalls, Pilot, PlaneProjection, OpenIn, Prereqs, Projection, PyCell, PyCode, Riemann, Span, SvdSteps, SymbolLegend, SystemLines };
