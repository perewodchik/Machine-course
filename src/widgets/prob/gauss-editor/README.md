# Редактор μ и Σ

Виджет урока III.11. Бегунки задают $\mu_1$, $\mu_2$, $\sigma_1$, $\sigma_2$ и $\rho$; ковариация $\Sigma = \begin{smallmatrix} \sigma_1^2 & \rho\sigma_1\sigma_2 \\ \rho\sigma_1\sigma_2 & \sigma_2^2 \end{smallmatrix}$.

На рисунке:
- линии уровня плотности — эллипсы расстояния Махаланобиса $1$, $2$, $3$;
- оси эллипса — собственные векторы $\Sigma$ длины $\sqrt{\lambda_i}$;
- точка $P$: расстояние Махаланобиса до $\mu$ рядом с обычным.

Показания — $\lambda_1$, $\lambda_2$, $\det\Sigma$, $d_M(P)$.

Модель — `src/lib/math/gauss2.ts`. Тесты (`gauss2.test.ts`):
- плотность интегрируется в $1$;
- выборка воспроизводит $\mu$ и $\Sigma$;
- $\Sigma u = \lambda_1 u$, $\lambda_1\lambda_2 = \det\Sigma$;
- на конце полуоси $\sqrt{\lambda_1}\, u$ расстояние Махаланобиса равно $1$.

```mdx
<GaussEditor n={1} initial={{ s1: 1.5, s2: 1, rho: 0.6 }}>Подпись рисунка.</GaussEditor>
```
