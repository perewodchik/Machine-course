// Отрисовка набора на сервере (как при сборке Astro): клетка и оси, обрезка по области графика, подписи, ARIA.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Ellipse, Line, ParamSlider, Plane, Point, Readout, Scrub, Vector } from "./index";

const plane = (children: React.ReactNode) =>
  renderToStaticMarkup(
    <Plane x={[0, 10]} y={[0, 7]} xStep={2} yStep={2} label="Пример">
      {children}
    </Plane>,
  );

describe("Plane", () => {
  it("viewBox по ширине, подпись для скринридера, clipPath области графика", () => {
    const html = plane(null);
    expect(html).toContain('viewBox="0 0 660 340"');
    expect(html).toContain('role="img" aria-label="Пример"');
    expect(html).toMatch(/<clipPath id="(plot-[^"]+)"><rect x="40" y="20" width="600" height="280"/);
    const id = /<clipPath id="(plot-[^"]+)"/.exec(html)![1];
    expect(html).toContain(`clip-path="url(#${id})"`);
  });
});

describe("элементы внутри области графика", () => {
  it("прямая рисуется через всю область, подпись — у видимого конца", () => {
    const html = plane(<Line intercept={0} slope={2} label="ŷ = θ_0 + θ_1 x" sym="theta" />);
    expect(html).toContain('data-visible="true"');
    expect(html).toContain('class="sub"');
    expect(html).toContain('data-sym="theta"');
  });

  it("прямая целиком выше графика — без подписи", () => {
    const html = plane(<Line intercept={20} slope={0} label="ŷ" />);
    expect(html).toMatch(/<g class="kit-line r2" data-visible="false"><line[^>]*><\/line><\/g>/);
  });

  it("точка, эллипс и вектор получают класс роли", () => {
    const html = plane(
      <>
        <Point x={2} y={3} role="data" />
        <Ellipse center={[5, 3]} cov={[[2, 0.6], [0.6, 1]]} role="target" />
        <Vector to={[4, 2]} role="param" label="v" />
      </>,
    );
    expect(html).toMatch(/kit-point r1/);
    expect(html).toMatch(/kit-ellipse r3/);
    expect(html).toMatch(/kit-vector r2/);
    expect(html).toContain('vector-effect="non-scaling-stroke"');
  });
});

describe("управление", () => {
  it("ползунок: подпись, значение для скринридера", () => {
    const html = renderToStaticMarkup(<ParamSlider name="θ_1" value={0.25} min={-1} max={1} step={0.05} onChange={() => {}} />);
    expect(html).toContain('type="range"');
    expect(html).toContain('aria-valuetext="θ1 = 0.25"');
    expect(html).toContain("<sub>1</sub>");
  });

  it("живое число — spinbutton с пределами", () => {
    const html = renderToStaticMarkup(<Scrub label="наклон θ_1" value={-0.5} min={-1} max={1} step={0.05} onChange={() => {}} />);
    expect(html).toContain('role="spinbutton"');
    expect(html).toContain('aria-valuenow="-0.5"');
    expect(html).toContain('aria-valuetext="−0.50"');
    expect(html).toContain('tabindex="0"');
  });

  it("показание с десятичной точкой", () => {
    expect(renderToStaticMarkup(<Readout name="J" value={5.2312} />)).toContain("5.23");
  });
});
