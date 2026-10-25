# Как растягивается площадь при замене переменных

Виджет урока II.10. Клетка $[r, r + \Delta] \times [\varphi, \varphi + \Delta]$ на плоскости $(\varphi, r)$ при переходе к $x = r\cos\varphi$, $y = r\sin\varphi$ становится куском кольца. Его точная площадь — $\tfrac12((r + \Delta)^2 - r^2)\Delta$, а приближение через якобиан — $\lvert \det J \rvert \Delta r \Delta\varphi = r\,\Delta^2$. Отношение стремится к $1$ при $\Delta \to 0$; разность равна $\tfrac12 \Delta^3$. Бегунки $r$, $\varphi$ (в градусах) и $\Delta$.

Тесты (`model.test.ts`):
- якобиан сверяется с конечными разностями, $\det J = r$;
- площадь контура образа по формуле шнурка совпадает с точной.

```mdx
<AreaStretch n={1} initial={{ r: 1.5, phi: 30, d: 0.4 }}>Подпись рисунка.</AreaStretch>
```
