// Компоненты, которые сайт передаёт в MDX урока (<Content components={lessonComponents} />): в MDX импортов нет.
import Block from "./Block.astro";
import Derivation from "./Derivation.astro";
import Formula from "./Formula.astro";
import Note from "./Note.astro";
import Prereqs from "./Prereqs.astro";
import SymbolLegend from "./SymbolLegend.astro";
import FitLine from "../widgets/FitLine.astro";

// виджеты — обёртки .astro с островами React
export const lessonComponents = { Block, Derivation, Formula, Note, Prereqs, SymbolLegend, FitLine };
export { Block, Derivation, FitLine, Formula, Note, Prereqs, SymbolLegend };
