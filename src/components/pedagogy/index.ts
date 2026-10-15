// Компоненты, которые сайт передаёт в MDX урока (<Content components={lessonComponents} />): в MDX импортов нет.
import Block from "./Block.astro";
import Derivation from "./Derivation.astro";
import Exercise from "./Exercise.astro";
import ExerciseSet from "./ExerciseSet.astro";
import Formula from "./Formula.astro";
import Note from "./Note.astro";
import Prereqs from "./Prereqs.astro";
import SymbolLegend from "./SymbolLegend.astro";
import FitLine from "../widgets/FitLine.astro";
import GridMap from "../widgets/GridMap.astro";
import BayesGrid from "../widgets/BayesGrid.astro";
import OpenIn from "../python/OpenIn.astro";
import PyCell from "../python/PyCell.astro";
import PyCode from "../python/PyCode.astro";

// виджеты — обёртки .astro с островами React
export const lessonComponents = { Block, Derivation, Exercise, ExerciseSet, Formula, Note, Prereqs, SymbolLegend, FitLine, GridMap, BayesGrid, PyCode, PyCell, OpenIn };
export { BayesGrid, Block, Derivation, Exercise, ExerciseSet, FitLine, Formula, GridMap, Note, OpenIn, Prereqs, PyCell, PyCode, SymbolLegend };
