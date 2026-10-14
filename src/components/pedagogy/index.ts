// Компоненты, которые сайт передаёт в MDX урока (<Content components={lessonComponents} />): в MDX импортов нет.
import Block from "./Block.astro";
import Derivation from "./Derivation.astro";
import Formula from "./Formula.astro";
import Note from "./Note.astro";
import Prereqs from "./Prereqs.astro";
import SymbolLegend from "./SymbolLegend.astro";

export const lessonComponents = { Block, Derivation, Formula, Note, Prereqs, SymbolLegend };
export { Block, Derivation, Formula, Note, Prereqs, SymbolLegend };
