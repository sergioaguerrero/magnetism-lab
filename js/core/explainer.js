/* ===== Motor pedagógico: explicación paso a paso en vivo según tema, variante y parámetros ===== */
(function () {
  function buildModA(S) {
    const pNames = {
      e: 'un <b>electrón</b> ($q = -e = -1.602\\times 10^{-19}\\text{ C}$, $m_e = 9.109\\times 10^{-31}\\text{ kg}$)',
      p: 'un <b>protón</b> ($q = +e = +1.602\\times 10^{-19}\\text{ C}$, $m_p = 1.673\\times 10^{-27}\\text{ kg}$)',
      a: 'una <b>partícula alfa ($\\alpha$)</b> ($q = +2e = +3.204\\times 10^{-19}\\text{ C}$, $m_\\alpha = 6.645\\times 10^{-27}\\text{ kg}$)'
    };
    const presetDesc = {
      ciclotron:
        '<b>Caso activo — Órbita de Ciclotrón:</b> La partícula ingresa perpendicularmente al campo magnético ($\\theta = 90^\\circ$) sin campo eléctrico ($E = 0$). La fuerza magnética actúa como fuerza centrípeta pura, describiendo un movimiento circular uniforme.',
      helice:
        '<b>Caso activo — Hélice Magnética:</b> La velocidad inicial forma un ángulo oblicuo ($\\theta \\neq 90^\\circ$) respecto a $\\vec{B}$. La componente perpendicular $v_\\perp$ genera el giro circular mientras la componente paralela $v_\\parallel$ permanece constante (pues $\\vec{F}_B \\perp \\vec{B}$), combinándose en una trayectoria helicoidal.',
      selector:
        '<b>Caso activo — Selector de Velocidades (Filtro de Wien):</b> Se aplican campos cruzados $\\vec{E} \\perp \\vec{B}$. Cuando la rapidez cumple $v_0 = E/B$, la fuerza eléctrica $\\vec{F}_E = q\\vec{E}$ y la fuerza magnética $\\vec{F}_B = q(\\vec{v}\\times\\vec{B})$ tienen igual magnitud y sentidos opuestos ($\\vec{F}_{\\text{neta}} = \\vec{0}$), permitiendo que solo las partículas con esa velocidad pasen sin desviarse.',
      espectrometro:
        '<b>Caso activo — Espectrómetro de Masas:</b> Iones con igual rapidez entran en un campo magnético uniforme $\\vec{B}$. Como el radio de curvatura es proporcional a la razón masa/carga ($r = \\frac{m}{|q|}\\frac{v}{B}$), la partícula $\\alpha$ (curva roja, mayor $m/|q|$) describe un radio aproximadamente el doble que el del protón (curva azul).',
      deriva:
        '<b>Caso activo — Deriva $\\vec{E}\\times\\vec{B}$:</b> En presencia de ambos campos perpendiculares con $v_0 \\neq E/B$, la partícula acelera y frena cíclicamente bajo $\\vec{E}$, cambiando su radio de curvatura y produciendo una trayectoria cicloide cuyo centro guía deriva con velocidad $v_d = E/B$.',
      libre:
        '<b>Caso activo — Configuración Personalizada:</b> Análisis general del movimiento tridimensional de una carga puntual bajo la acción combinada de la fuerza de Lorentz.'
    };

    const [q, m] = P[S.part];
    const v0 = S.v * 1e6;
    const thRad = (S.th * Math.PI) / 180;
    const vp = v0 * Math.sin(thRad);
    const vl = v0 * Math.cos(thRad);
    const B = S.B * 1e-3;
    const E = S.E * 1e3;
    const FB = Math.abs(q) * vp * B;
    const FE = Math.abs(q) * E;
    const r = (m * vp) / (Math.abs(q) * B);
    const T = (2 * Math.PI * m) / (Math.abs(q) * B);
    const f = 1 / T;
    const pitch = vl * T;
    const vd = E / B;
    const EkJ = 0.5 * m * v0 * v0;
    const EkeV = EkJ / E_;

    return `
      <div class="exp-sec">
        <h3>1. Planteamiento del problema actual</h3>
        <p>${presetDesc[S.preset] || presetDesc.libre}</p>
        <p>Se estudia el movimiento de ${pNames[S.part]} lanzada desde el origen con rapidez inicial $v_0 = ${fm(S.v)}\\times 10^6\\text{ m/s}$ formando un ángulo $\\theta = ${S.th}^\\circ$ con el campo magnético uniforme $\\vec{B} = ${fm(S.B)}\\text{ mT}\\,\\hat{j}$${E > 0 ? ` y un campo eléctrico cruzado $\\vec{E} = -${fm(S.E)}\\text{ kV/m}\\,\\hat{k}$` : ' en ausencia de campo eléctrico ($E = 0$)'}.</p>
      </div>

      <div class="exp-sec">
        <h3>2. Conversión de datos al Sistema Internacional (SI)</h3>
        <ul>
          <li><b>Carga y masa:</b> $q = ${fm(q)}\\text{ C}$, $m = ${fm(m)}\\text{ kg}$ (razón $\\frac{m}{|q|} = ${fm(m / Math.abs(q))}\\text{ kg/C}$).</li>
          <li><b>Velocidad inicial:</b> $v_0 = ${fm(v0)}\\text{ m/s}$ con componentes:
            $$v_\\perp = v_0\\sin(${S.th}^\\circ) = ${fm(vp)}\\text{ m/s}, \\qquad v_\\parallel = v_0\\cos(${S.th}^\\circ) = ${fm(vl)}\\text{ m/s}$$
          </li>
          <li><b>Campos en SI:</b> $B = ${fm(S.B)}\\times 10^{-3}\\text{ T} = ${fm(B)}\\text{ T}$${E > 0 ? `, $\\;E = ${fm(S.E)}\\times 10^3\\text{ V/m} = ${fm(E)}\\text{ V/m}$` : ''}.</li>
        </ul>
      </div>

      <div class="exp-sec">
        <h3>3. Resolución matemática paso a paso</h3>
        <p><b>Paso A · Fuerza de Lorentz y Regla de la Mano Derecha:</b> La ecuación gobernante es $\\vec{F} = q(\\vec{E} + \\vec{v}\\times\\vec{B})$. La magnitud de la fuerza magnética es:</p>
        $$|\\vec{F}_B| = |q|\\,v_\\perp\\,B = (${fm(Math.abs(q))})(${fm(vp)})(${fm(B)}) = ${fm(FB)}\\text{ N}$$
        <p>${q > 0 ? 'Como la carga es <b>positiva ($q > 0$)</b>, por la regla de la mano derecha la fuerza magnética $\\vec{F}_B$ (flecha roja) apunta en la <b>misma dirección</b> del pulgar ($\\vec{v}\\times\\vec{B}$, flecha amarilla).' : 'Como el electrón tiene <b>carga negativa ($q < 0$)</b>, la fuerza magnética $\\vec{F}_B$ (flecha roja) se <b>invierte $180^\\circ$</b> respecto al pulgar de la mano derecha ($\\vec{v}\\times\\vec{B}$, flecha amarilla).'}</p>

        <p><b>Paso B · Radio de ciclotrón (Larmor):</b> Igualando la fuerza magnética a la fuerza centrípeta ($|q|v_\\perp B = \\frac{m v_\\perp^2}{r}$):</p>
        $$r = \\frac{m\\,v_\\perp}{|q|\\,B} = \\frac{(${fm(m)})(${fm(vp)})}{(${fm(Math.abs(q))})(${fm(B)})} = ${fm(r)}\\text{ m}$$

        <p><b>Paso C · Periodo, frecuencia y paso helicoidal:</b> El periodo de giro depende únicamente de $m$, $|q|$ y $B$ (es independiente de la rapidez de la partícula):</p>
        $$T = \\frac{2\\pi\\,m}{|q|\\,B} = ${fm(T)}\\text{ s}, \\qquad f = \\frac{1}{T} = ${fm(f)}\\text{ Hz}$$
        $$p = v_\\parallel\\,T = (${fm(vl)})(${fm(T)}) = ${fm(pitch)}\\text{ m}$$

        ${
          E > 0
            ? `<p><b>Paso D · Efecto del campo eléctrico cruzado ($\\vec{E} \\perp \\vec{B}$):</b> La fuerza eléctrica tiene magnitud $|\\vec{F}_E| = |q|E = ${fm(FE)}\\text{ N}$. La velocidad crítica del selector / deriva es:</p>
               $$v_d = \\frac{E}{B} = \\frac{${fm(E)}}{${fm(B)}} = ${fm(vd)}\\text{ m/s}$$
               <p>${Math.abs(v0 - vd) / (vd || 1) < 0.03 ? 'Como $v_0 \\approx E/B$, las fuerzas eléctrica y magnética se <b>cancelan exactamente</b> ($|\\vec{F}_E| = |\\vec{F}_B|$) y la partícula describe una <b>trayectoria rectilínea</b> sin desviación.' : `Como $v_0 = ${fm(v0)}\\text{ m/s} \\neq E/B$, las fuerzas no se equilibran ($|\\vec{F}_E| = ${fm(FE)}\\text{ N}$ vs. $|\\vec{F}_B| = ${fm(FB)}\\text{ N}$) y la órbita deriva a velocidad $v_d = ${fm(vd)}\\text{ m/s}$.`}</p>`
            : `<p><b>Paso D · Conservación de la energía cinética:</b> Al ser $E = 0$, la fuerza magnética es siempre perpendicular al desplazamiento ($dW = \\vec{F}_B\\cdot d\\vec{r} = q(\\vec{v}\\times\\vec{B})\\cdot\\vec{v}\\,dt = 0$). Por tanto, la energía cinética permanece constante en $E_k = \\frac{1}{2}mv_0^2 = ${fm(EkJ)}\\text{ J} = ${fm(EkeV)}\\text{ eV}$.</p>`
        }
      </div>
    `;
  }

  function buildModB(S) {
    const geoNames = {
      hilo: 'un <b>conductor rectilíneo muy largo</b> situado sobre el eje vertical $Y$',
      espira: `una <b>espira circular de corriente</b> de radio $R = ${S.R}\\text{ cm}$ centrada en el origen sobre el plano $XZ$ (eje de simetría en $Y$)`,
      helmholtz: `un par de <b>bobinas de Helmholtz</b> coaxiales de radio $R = ${S.R}\\text{ cm}$ separadas una distancia igual a su radio ($y = \\pm R/2$) para generar un campo altamente uniforme en el centro`,
      solenoide: `un <b>solenoide helicoidal</b> de radio $R = ${S.R}\\text{ cm}$, longitud $L = ${S.L}\\text{ cm}$ y $N = ${S.N}$ espiras`,
      elemento_dl: 'un <b>elemento diferencial de corriente aislado $I\\,\\Delta\\vec{l}$</b> de longitud $\\Delta l = 1\\text{ cm}$ orientado en $+Y$',
      carga_mov: 'una <b>carga puntual $q$ en movimiento</b> con vector velocidad $\\vec{v}$ a lo largo del eje $+Y$'
    };

    const xm = S.px * 1e-2;
    const ym = S.py * 1e-2;
    const rm = Math.hypot(xm, ym);
    const Rm = S.R * 1e-2;
    const Lm = S.L * 1e-2;

    let formulaBlock = '';
    if (S.geo === 'hilo') {
      const Bana = Math.abs(xm) > 0.003 ? (MU0 * S.I) / (2 * Math.PI * Math.abs(xm)) : null;
      formulaBlock = `
        <p><b>Solución analítica para el hilo recto infinito:</b> Integrando la ley de Biot-Savart a una distancia perpendicular $d = |x| = ${fm(Math.abs(xm))}\\text{ m}$ del eje $Y$:</p>
        $$B = \\frac{\\mu_0\\,I}{2\\pi\\,d} = ${Bana ? `\\frac{(4\\pi\\times 10^{-7})(${S.I})}{2\\pi(${fm(Math.abs(xm))})} = ${fm(Bana * 1e6)}\\text{ }\\mu\\text{T}` : '\\text{Indefinido sobre el conductor }(d = 0)'}$$
        <p>Por la regla de la mano derecha (pulgar en $+Y$, sentido de $I$), las líneas de campo magnético son circunferencias concéntricas en planos horizontales $XZ$.</p>
      `;
    } else if (S.geo === 'espira') {
      const Bana = Math.abs(S.px) < 0.05 ? (MU0 * S.I * Rm * Rm) / (2 * Math.pow(Rm * Rm + ym * ym, 1.5)) : null;
      formulaBlock = `
        <p><b>Solución analítica en el eje de la espira circular ($x = 0$):</b> En cualquier punto $(0, y, 0)$ sobre el eje de simetría, las componentes radiales de $d\\vec{B}$ se cancelan por simetría y solo sobrevive la componente axial $B_y$:</p>
        $$B_y(y) = \\frac{\\mu_0\\,I\\,R^2}{2\\,(R^2 + y^2)^{3/2}} = ${Bana != null ? `${fm(Bana * 1e6)}\\text{ }\\mu\\text{T}` : '\\text{(Mueve }x\\text{ a }0\\text{ cm para evaluar en el eje)}'} $$
      `;
    } else if (S.geo === 'helmholtz') {
      const lp = (yy) => (MU0 * S.I * Rm * Rm) / (2 * Math.pow(Rm * Rm + yy * yy, 1.5));
      const Bana = Math.abs(S.px) < 0.05 ? lp(ym - Rm / 2) + lp(ym + Rm / 2) : null;
      formulaBlock = `
        <p><b>Principio de superposición en Bobinas de Helmholtz:</b> Al separar dos espiras idénticas una distancia igual a su radio $R$ ($y_1 = -R/2$, $y_2 = +R/2$), se anula la segunda derivada $\\frac{d^2 B_y}{dy^2}$ en el origen, logrando un campo magnético casi constante en la región central:</p>
        $$B_y(y) = \\frac{\\mu_0 I R^2}{2}\\left[\\frac{1}{\\left(R^2 + (y - R/2)^2\\right)^{3/2}} + \\frac{1}{\\left(R^2 + (y + R/2)^2\\right)^{3/2}}\\right] = ${Bana != null ? `${fm(Bana * 1e6)}\\text{ }\\mu\\text{T}` : '\\text{(Evalúa en el eje }x = 0\\text{)}'}$$
      `;
    } else if (S.geo === 'solenoide') {
      const Bana = (MU0 * S.N * S.I) / Lm;
      formulaBlock = `
        <p><b>Campo en el interior del solenoide:</b> Para un solenoide de $N = ${S.N}$ vueltas y longitud $L = ${fm(Lm)}\\text{ m}$ (densidad $n = N/L = ${fm(S.N / Lm)}\\text{ vueltas/m}$), la aproximación de solenoide largo en su región central es:</p>
        $$B_{\\text{int}} \\approx \\mu_0\\,\\frac{N}{L}\\,I = (4\\pi\\times 10^{-7})\\frac{${S.N}}{${fm(Lm)}}(${S.I}) = ${fm(Bana * 1e6)}\\text{ }\\mu\\text{T}$$
        <p>La ligera diferencia frente al valor numérico de Biot-Savart se debe a los efectos de borde de un solenoide de longitud finita $L = ${S.L}\\text{ cm}$.</p>
      `;
    } else {
      const sinTh = rm > 1e-4 ? Math.abs(xm) / rm : 0;
      const Bana = rm > 0.005 ? ((MU0 / (4 * Math.PI)) * (S.I * 0.01 * sinTh)) / (rm * rm) : null;
      formulaBlock = `
        <p><b>Campo puntual de ${S.geo === 'carga_mov' ? 'una carga en movimiento ($q\\vec{v}$)' : 'un elemento diferencial ($I\\,\\Delta\\vec{l}$)'}:</b> A distancia $r = \\sqrt{x^2+y^2} = ${fm(rm)}\\text{ m}$ con $\\sin\\theta = \\frac{|x|}{r} = ${sinTh.toFixed(3)}$:</p>
        $$|\\vec{B}| = \\frac{\\mu_0}{4\\pi}\\,\\frac{${S.geo === 'carga_mov' ? '|q\\,\\vec{v}\\times\\hat{r}|' : '|I\\,\\Delta\\vec{l}\\times\\hat{r}|'}}{r^2} = ${Bana != null ? `${fm(Bana * 1e6)}\\text{ }\\mu\\text{T}` : '\\text{Singularidad en }r = 0'}$$
      `;
    }

    return `
      <div class="exp-sec">
        <h3>1. Planteamiento del problema actual</h3>
        <p>Se calcula y visualiza el campo magnético tridimensional $\\vec{B}(\vec{r})$ generado por ${geoNames[S.geo]} que transporta una intensidad $I = ${S.I}\\text{ A}$. La sonda de prueba (esfera rosa) se encuentra en las coordenadas $(x, y, z) = (${S.px}\\text{ cm},\\, ${S.py}\\text{ cm},\\, 0)$.</p>
      </div>

      <div class="exp-sec">
        <h3>2. Integración numérica de la Ley de Biot-Savart</h3>
        <p>El simulador discretiza la geometría del conductor en segmentos vectoriales $\\Delta\\vec{l}_k$ centrados en $\\vec{r}_k$ y evalúa la suma vectorial directa en cada punto del espacio:</p>
        $$\\vec{B}(\\vec{r}) = \\frac{\\mu_0\\,I}{4\\pi}\\sum_{k} \\frac{\\Delta\\vec{l}_k \\times (\\vec{r} - \\vec{r}_k)}{|\\vec{r} - \\vec{r}_k|^3}$$
        <p>En la posición actual de la sonda ($r = ${fm(rm)}\\text{ m}$ al origen), el producto cruz $\\Delta\\vec{l}_k \\times \\vec{r}$ determina la dirección tangencial o axial del vector $\\vec{B}$ (flecha magenta sobre la sonda).</p>
      </div>

      <div class="exp-sec">
        <h3>3. Desarrollo analítico y validación</h3>
        ${formulaBlock}
      </div>
    `;
  }

  function buildModC(S) {
    const dm = S.d * 1e-2;
    const dlm = S.dl * 1e-2;
    const B1 = (MU0 * S.I1) / (2 * Math.PI * dm);
    const B2 = (MU0 * S.I2) / (2 * Math.PI * dm);
    const FperL = (MU0 * S.I1 * S.I2) / (2 * Math.PI * dm);
    const dF = FperL * dlm;
    const mismo = S.dir === 'mismo';

    return `
      <div class="exp-sec">
        <h3>1. Planteamiento del problema actual</h3>
        <p>Dos conductores rectilíneos largos y paralelos al eje vertical $Y$ están separados una distancia $d = ${S.d}\\text{ cm} = ${fm(dm)}\\text{ m}$. El conductor 1 (izquierda, $x_1 = -${S.d / 2}\\text{ cm}$) transporta $I_1 = ${S.I1}\\text{ A}$ hacia $+Y$, mientras que el conductor 2 (derecha, $x_2 = +${S.d / 2}\\text{ cm}$) transporta $I_2 = ${S.I2}\\text{ A}$ en <b>${mismo ? 'el mismo sentido ($+Y$, corrientes paralelas $\\uparrow\\uparrow$)' : 'sentido opuesto ($-Y$, corrientes antiparalelas $\\uparrow\\downarrow$)'}</b>.</p>
        <p>Se analiza además la fuerza magnética neta sobre un segmento diferencial resaltado de longitud $\\Delta l = ${S.dl}\\text{ cm} = ${fm(dlm)}\\text{ m}$ ubicado a la altura $y_0 = ${S.y0}\\text{ cm}$.</p>
      </div>

      <div class="exp-sec">
        <h3>2. Desarrollo matemático paso a paso</h3>
        <p><b>Paso A · Campo magnético creado por el Conductor 1 sobre el Conductor 2:</b> Por la ley de Biot-Savart / Ampère, los anillos verdes centrados en el hilo 1 llegan al hilo 2 con magnitud:</p>
        $$B_1 = \\frac{\\mu_0\\,I_1}{2\\pi\\,d} = \\frac{(4\\pi\\times 10^{-7})(${S.I1})}{2\\pi(${fm(dm)})} = ${fm(B1 * 1e6)}\\text{ }\\mu\\text{T}$$
        <p>Por la regla de la mano derecha, en la posición del hilo 2 ($+X$) el vector $\\vec{B}_1$ apunta perpendicularmente en dirección $-Z$ ($\\vec{B}_1 = -B_1\\,\\hat{k}$).</p>

        <p><b>Paso B · Fuerza de Laplace sobre el Conductor 2:</b> Un tramo $\\Delta\\vec{l}_2 = ${mismo ? '+' : '-'}\\Delta l\\,\\hat{j}$ del conductor 2 sumergido en $\\vec{B}_1$ experimenta la fuerza:</p>
        $$\\Delta\\vec{F}_{1\\to 2} = I_2\\,\\Delta\\vec{l}_2 \\times \\vec{B}_1 = I_2\\,(${mismo ? '+' : '-'}\\Delta l\\,\\hat{j}) \\times (-B_1\\,\\hat{k}) = ${mismo ? '-' : '+'}I_2\\,\\Delta l\\,B_1\\,\\hat{i}$$
        <p>La fuerza por unidad de longitud entre ambos conductores es:</p>
        $$\\frac{F}{L} = \\frac{\\mu_0\\,I_1\\,I_2}{2\\pi\\,d} = \\frac{(4\\pi\\times 10^{-7})(${S.I1})(${S.I2})}{2\\pi(${fm(dm)})} = ${fm(FperL * 1e6)}\\text{ }\\mu\\text{N/m}$$

        <p><b>Paso C · Fuerza sobre el segmento $\\Delta l = ${S.dl}\\text{ cm}$:</b></p>
        $$\\Delta F = \\left(\\frac{F}{L}\\right)\\Delta l = (${fm(FperL * 1e6)}\\text{ }\\mu\\text{N/m})(${fm(dlm)}\\text{ m}) = ${fm(dF * 1e6)}\\text{ }\\mu\\text{N}$$
      </div>

      <div class="exp-sec">
        <h3>3. Conclusión física y 3.ª Ley de Newton</h3>
        <p>${mismo ? 'Como $\\Delta\\vec{F}_{1\\to 2}$ apunta en $-\\hat{i}$ (hacia el conductor 1) y $\\Delta\\vec{F}_{2\\to 1}$ apunta en $+\\hat{i}$ (hacia el conductor 2), <b>dos corrientes paralelas se atraen mutuamente</b>.' : 'Como $\\Delta\\vec{F}_{1\\to 2}$ apunta en $+\\hat{i}$ (alejándose del conductor 1) y $\\Delta\\vec{F}_{2\\to 1}$ apunta en $-\\hat{i}$ (alejándose del conductor 2), <b>dos corrientes antiparalelas se repelen mutuamente</b>.'} Aunque $I_1$ e $I_2$ sean distintas, las fuerzas sobre ambos hilos tienen idéntica magnitud ($|\\Delta\\vec{F}_{1\\to 2}| = |\\Delta\\vec{F}_{2\\to 1}| = ${fm(dF * 1e6)}\\text{ }\\mu\\text{N}$).</p>
      </div>
    `;
  }

  function buildModD(S) {
    const Lm = S.L * 1e-2;
    const A = S.shape === 'rect' ? Lm * Lm : Math.PI * (Lm / 2) * (Lm / 2);
    const B = S.B * 1e-3;
    const mu = S.N * S.I * A;
    const thRad = (S.th0 * Math.PI) / 180;
    const tau = mu * B * Math.abs(Math.sin(thRad));
    const U = -mu * B * Math.cos(thRad);
    const Farm = S.N * S.I * Lm * B;

    return `
      <div class="exp-sec">
        <h3>1. Planteamiento del problema actual</h3>
        <p>Una <b>${S.shape === 'rect' ? `espira cuadrada de lado $L = ${S.L}\\text{ cm}$` : `espira circular de diámetro $L = ${S.L}\\text{ cm}$ (radio $R = ${S.L / 2}\\text{ cm}$)`}</b> con $N = ${S.N}$ vueltas y corriente $I = ${S.I}\\text{ A}$ puede girar alrededor del eje vertical $Y$ dentro de un campo magnético uniforme $\\vec{B} = ${S.B}\\text{ mT}\\,\\hat{i}$.</p>
        <p>El vector normal a la espira (momento dipolar $\\vec{\\mu}$, flecha magenta) se orienta a un ángulo $\\theta = ${S.th0}^\\circ$ respecto a $\\vec{B}$ en modo <b>${S.mode === 'dinamico' ? 'dinámico (oscilación amortiguada hacia el equilibrio)' : 'estático (inspección vectorial a ángulo fijo)'}</b>.</p>
      </div>

      <div class="exp-sec">
        <h3>2. Desarrollo matemático paso a paso</h3>
        <p><b>Paso A · Área y Momento Dipolar Magnético ($\\vec{\\mu}$):</b></p>
        $$A = ${S.shape === 'rect' ? `L^2 = (${fm(Lm)}\\text{ m})^2` : `\\pi\\,(L/2)^2 = \\pi(${fm(Lm / 2)}\\text{ m})^2`} = ${fm(A)}\\text{ m}^2 \\;(${fm(A * 1e4)}\\text{ cm}^2)$$
        $$|\\vec{\\mu}| = N\\,I\\,A = (${S.N})(${S.I})(${fm(A)}) = ${fm(mu)}\\text{ A}\\cdot\\text{m}^2$$

        <p><b>Paso B · Par de fuerzas y anulación de la fuerza neta:</b> En un campo uniforme, las fuerzas sobre lados opuestos son iguales y de sentido contrario ($\\vec{F}_1 = -\\vec{F}_2$, flechas rojas de magnitud $F_{\\text{brazo}} = N I L B = ${fm(Farm)}\\text{ N}$). Por tanto, la espira no se traslada ($\\sum\\vec{F} = \\vec{0}$), pero como sus líneas de acción están separadas por el brazo de palanca $b = L\\sin\\theta$, producen un momento de torsión neto:</p>
        $$\\vec{\\tau} = \\vec{\\mu} \\times \\vec{B} \\implies |\\vec{\\tau}| = \\mu\\,B\\,|\\sin\\theta| = (${fm(mu)})(${fm(B)})|\\sin(${S.th0}^\\circ)| = ${fm(tau)}\\text{ N}\\cdot\\text{m}$$

        <p><b>Paso C · Energía potencial magnética y equilibrio:</b></p>
        $$U(\\theta) = -\\vec{\\mu}\\cdot\\vec{B} = -\\mu\\,B\\,\\cos\\theta = -(${fm(mu)})(${fm(B)})\\cos(${S.th0}^\\circ) = ${fm(U)}\\text{ J}$$
        <p>El torque $\\vec{\\tau}$ (flecha azul cian sobre el eje $Y$) actúa como un torque restaurador ($\\tau_y = -\\mu B\\sin\\theta$) que lleva la espira hacia su estado de mínima energía potencial en $\\theta = 0^\\circ$ ($\\vec{\\mu} \\parallel \\vec{B}$, equilibrio estable).</p>
      </div>
    `;
  }

  function buildModE(S) {
    const Lm = S.L * 1e-2;
    const A = S.shape === 'disco' ? Math.PI * (Lm / 2) * (Lm / 2) : Lm * Lm;
    const B = S.B * 1e-3;
    const thRad = (S.th * Math.PI) / 180;
    const cTh = Math.cos(thRad);
    const Aeff = A * cTh;
    const phi = B * A * cTh;

    return `
      <div class="exp-sec">
        <h3>1. Planteamiento del problema actual</h3>
        <p>Se desea determinar el flujo magnético $\\Phi_B$ que atraviesa una <b>${S.shape === 'disco' ? `superficie circular plana de diámetro $L = ${S.L}\\text{ cm}$ (radio $R = ${S.L / 2}\\text{ cm}$)` : `superficie cuadrada plana de lado $L = ${S.L}\\text{ cm}$`}</b> inmersa en un campo magnético uniforme $\\vec{B} = ${S.B}\\text{ mT}\\,\\hat{i}$.</p>
        <p>El vector normal unitario a la superficie ($\\hat{n}$, flecha magenta) forma un ángulo $\\theta = ${S.th}^\\circ$ con las líneas de campo magnético $\\vec{B}$ (flechas verdes).</p>
      </div>

      <div class="exp-sec">
        <h3>2. Desarrollo matemático paso a paso</h3>
        <p><b>Paso A · Cálculo del área geométrica $A$ en SI:</b></p>
        $$A = ${S.shape === 'disco' ? `\\pi\\left(\\frac{L}{2}\\right)^2 = \\pi(${fm(Lm / 2)}\\text{ m})^2` : `L^2 = (${fm(Lm)}\\text{ m})^2`} = ${fm(A)}\\text{ m}^2 \\;(${fm(A * 1e4)}\\text{ cm}^2)$$

        <p><b>Paso B · Área efectiva proyectada ($A_\\perp$):</b> Solo la proyección de la superficie perpendicular a las líneas de campo intercepta flujo magnético (representada por la silueta proyectada en el plano del fondo $x = -10$):</p>
        $$A_\\perp = A\\,\\cos\\theta = (${fm(A * 1e4)}\\text{ cm}^2)\\cos(${S.th}^\\circ) = (${fm(A * 1e4)})(${cTh.toFixed(3)}) = ${fm(Aeff * 1e4)}\\text{ cm}^2$$

        <p><b>Paso C · Evaluación de la integral de flujo magnético $\\Phi_B$:</b> Como $\\vec{B}$ es uniforme sobre toda la superficie plana:</p>
        $$\\Phi_B = \\int_S \\vec{B}\\cdot d\\vec{A} = B\\,A\\,\\cos\\theta = (${fm(B)}\\text{ T})(${fm(A)}\\text{ m}^2)(${cTh.toFixed(3)}) = ${fm(phi)}\\text{ Wb} = ${fm(phi * 1e6)}\\text{ }\\mu\\text{Wb}$$
      </div>

      <div class="exp-sec">
        <h3>3. Interpretación del signo y de las líneas en 3D</h3>
        <p>${
          Math.abs(cTh) < 0.02
            ? 'En $\\theta \\approx \\pm 90^\\circ$, el vector normal $\\hat{n}$ es perpendicular a $\\vec{B}$ (la superficie está de canto respecto al campo). Ninguna línea atraviesa la superficie y el <b>flujo magnético es nulo ($\\Phi_B = 0$)</b>.'
            : cTh > 0
            ? 'Como $|\\theta| < 90^\\circ$ ($\\cos\\theta > 0$), las líneas de campo atraviesan la superficie saliendo por la cara de la normal $+\\hat{n}$ (color <b>verde esmeralda, flujo positivo $\\Phi_B > 0$</b>).'
            : 'Como $|\\theta| > 90^\\circ$ ($\\cos\\theta < 0$), las líneas de campo entran por la cara $+\\hat{n}$ en sentido opuesto al vector normal (color <b>rojo coral, flujo negativo $\\Phi_B < 0$</b>).'
        }</p>
      </div>
    `;
  }

  function buildModF(S) {
    return `
      <div class="exp-sec">
        <h3>1. Planteamiento del problema actual</h3>
        <p>Se evalúa la <b>Ley de Gauss del magnetismo</b> sobre una superficie gaussiana cerrada $S$ con forma de <b>${S.surf === 'esfera' ? `esfera de radio $R_g = ${S.Rg}\\text{ cm}$` : `cubo cerrado de lado $2R_g = ${2 * S.Rg}\\text{ cm}$`}</b> centrada en $(x_g, y_g, 0) = (${S.gx}\\text{ cm},\\, ${S.gy}\\text{ cm},\\, 0)$, en presencia del campo magnético generado por <b>${S.source === 'dipolo' ? 'un imán de barra cilíndrico (dipolo magnético Norte–Sur)' : 'una espira circular de corriente'}</b> de intensidad equivalente $I = ${S.I}\\text{ A}$.</p>
      </div>

      <div class="exp-sec">
        <h3>2. Demostración física y matemática paso a paso</h3>
        <p><b>Paso A · Descomposición de la integral de superficie cerrada:</b> Dividimos la superficie cerrada $S$ en elementos diferenciales de área $d\\vec{A} = \\hat{n}\\,dA$ (con la normal $\\hat{n}$ apuntando siempre hacia el exterior de la superficie cerrada) y separamos el flujo saliente ($\\vec{B}\\cdot\\hat{n} > 0$, flechas verdes) del flujo entrante ($\\vec{B}\\cdot\\hat{n} < 0$, flechas rojas):</p>
        $$\\oint_S \\vec{B}\\cdot d\\vec{A} = \\underbrace{\\int_{\\vec{B}\\cdot\\hat{n} > 0} \\vec{B}\\cdot d\\vec{A}}_{\\Phi_{\\text{saliente}} > 0} + \\underbrace{\\int_{\\vec{B}\\cdot\\hat{n} < 0} \\vec{B}\\cdot d\\vec{A}}_{\\Phi_{\\text{entrante}} < 0}$$

        <p><b>Paso B · Por qué $\\Phi_{\\text{neto}} = 0$ incluso encerrando un solo polo del imán:</b> En electrostática ($\\oint \\vec{E}\\cdot d\\vec{A} = q_{\\text{enc}}/\\varepsilon_0$), las líneas de campo eléctrico nacen en cargas positivas y mueren en cargas negativas. En magnetismo, en cambio, <b>no existen monopolos magnéticos ($q_m = 0$)</b>: toda línea de campo magnético $\\vec{B}$ que sale del Polo Norte hacia el exterior regresa al Polo Sur y <b>continúa cerrada por el interior del imán de Sur a Norte</b>.</p>
        $$\\Phi_{\\text{saliente}} = |\\Phi_{\\text{entrante}}| \\implies \\oint_S \\vec{B}\\cdot d\\vec{A} = 0\\text{ Wb}$$

        <p><b>Paso C · Forma diferencial (Teorema de la Divergencia):</b> Aplicando el teorema de Gauss-Ostrogradski a cualquier volumen $V$ encerrado por $S$:</p>
        $$\\oint_S \\vec{B}\\cdot d\\vec{A} = \\iiint_V (\\nabla\\cdot\\vec{B})\\,dV = 0 \\iff \\nabla\\cdot\\vec{B} = 0$$
        <p>Esto se cumple porque todo campo magnético estacionario proviene del rotacional de un potencial vectorial ($\\vec{B} = \\nabla\\times\\vec{A}$), y la divergencia de cualquier rotacional es idénticamente nula en todo punto del espacio.</p>
      </div>
    `;
  }

  function update(mod) {
    const bodyEl = $('explain-body');
    const titleEl = $('explain-mod-title');
    if (!bodyEl || !mod) return;

    if (titleEl) {
      titleEl.textContent = mod.title;
    }

    const S = mod.state || {};
    let html = '';
    if (mod.id === 'A') html = buildModA(S);
    else if (mod.id === 'B') html = buildModB(S);
    else if (mod.id === 'C') html = buildModC(S);
    else if (mod.id === 'D') html = buildModD(S);
    else if (mod.id === 'E') html = buildModE(S);
    else if (mod.id === 'F') html = buildModF(S);

    bodyEl.innerHTML = html;
    if (Sim.ui && Sim.ui.renderMath) {
      Sim.ui.renderMath(bodyEl);
    }
  }

  Sim.explainer = { update };
})();
